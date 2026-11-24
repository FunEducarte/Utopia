import { DV, SemOutcome } from "./types.js";
import { ActionRegistry, ActionCtx } from "./action.registry.js";

export type ChainStep = {
  id: string;
  action: string;         // ej "dv.create.child"
  input?: any;            // 🚫 with → input
  next?: string;          // id del siguiente step
  onFail?: string;        // step alternativo
  retries?: number;       // default 0
};

export type ActionChain = {
  id: string;             // chainId
  dvId: string;
  steps: Record<string, ChainStep>;
  start: string;          // stepId
};

type Running = {
  chain: ActionChain;
  current: string;
  attempts: Record<string, number>;
};

export class ChainEngine {
  private q: Running[] = [];
  private running = 0;

  constructor(
    private ctxFactory: () => ActionCtx,
    private emitOutcome: (msg: SemOutcome) => void,
    private concurrency: number
  ) {}

  enqueue(chain: ActionChain) {
    this.q.push({ chain, current: chain.start, attempts: {} });
    this.pump();
  }

  private pump() {
    while (this.running < this.concurrency && this.q.length) {
      const job = this.q.shift();
      if (!job) return;
      void this.run(job);
    }
  }

  private async run(job: Running): Promise<void> {
    this.running++;
    const ctx = this.ctxFactory();

    try {
      const dv = ctx.store.getDV(job.chain.dvId);
      if (!dv) {
        this.emitOutcome({
          kind: "sem.dv.outcome",
          payload: {
            id: job.chain.dvId,
            action: "chain.start",
            result: "fail",
            effects: { reason: "dv.not.found" },
            chainId: job.chain.id,
            stepId: job.current,
          },
          meta: { ns: ctx.ns, scope: ctx.scope, ts: Date.now() },
        });
        return;
      }

      let stepId: string = job.current;

      // loop seguro para TS
      for (let guard = 0; guard < 1000; guard++) {
        const step: ChainStep | undefined = job.chain.steps[stepId];
        if (!step) break;

        const tries = job.attempts[stepId] ?? 0;
        const maxRetries = step.retries ?? 0;

        const handler = ActionRegistry[step.action];

        if (!handler) {
          this.emitOutcome({
            kind: "sem.dv.outcome",
            payload: {
              id: dv.id,
              action: step.action,
              result: "fail",
              effects: { reason: "action.not.registered" },
              chainId: job.chain.id,
              stepId,
            },
            meta: { ns: ctx.ns, scope: ctx.scope, ts: Date.now() },
          });

          if (step.onFail) {
            stepId = step.onFail;
            continue;
          }
          break;
        }

        try {
          const res = await handler(dv as DV, ctx, step.input);

          this.emitOutcome({
            kind: "sem.dv.outcome",
            payload: {
              id: dv.id,
              action: step.action,
              result: res.ok ? "ok" : "fail",
              effects: res.effects,
              chainId: job.chain.id,
              stepId,
            },
            meta: { ns: ctx.ns, scope: ctx.scope, ts: Date.now() },
          });

          const nextId = res.ok ? step.next : step.onFail;
          if (nextId) {
            stepId = nextId;
            continue;
          }
          break;
        } catch (e: unknown) {
          const err = e instanceof Error ? e.message : String(e);
          job.attempts[stepId] = tries + 1;

          if (tries < maxRetries) {
            this.emitOutcome({
              kind: "sem.dv.outcome",
              payload: {
                id: dv.id,
                action: step.action,
                result: "fail",
                effects: { reason: "exception", err, retry: job.attempts[stepId] },
                chainId: job.chain.id,
                stepId,
              },
              meta: { ns: ctx.ns, scope: ctx.scope, ts: Date.now() },
            });
            continue; // retry mismo stepId
          }

          this.emitOutcome({
            kind: "sem.dv.outcome",
            payload: {
              id: dv.id,
              action: step.action,
              result: "fail",
              effects: { reason: "exception.final", err },
              chainId: job.chain.id,
              stepId,
            },
            meta: { ns: ctx.ns, scope: ctx.scope, ts: Date.now() },
          });

          if (step.onFail) {
            stepId = step.onFail;
            continue;
          }
          break;
        }
      }
    } finally {
      this.running--;
      this.pump();
    }
  }
}
