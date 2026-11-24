import { MicelioStore } from "./micelio.store.js";
import { facetsFromDV } from "./sem.dv.facets.js";
import { AnyMsg, SemAsk, SemAnswer, SemOutcome } from "./types.js";

const getScopes = (m: any): string[] => {
  const a = Array.isArray(m?.meta?.scopes) ? m.meta.scopes : null;
  if (a?.length) return a.map(String);
  const s = m?.meta?.scope || m?.scope;
  if (typeof s === "string" && s.trim()) return [s.trim()];
  return ["public"];
};

export class SemRouter {
  constructor(
    private store: MicelioStore,
    private say: (msg: any) => void
  ) {}

  onMessage(msg: AnyMsg, defaults: { ns: string; scope: string; me: string }) {
    const kind = (msg as any)?.kind;
    if (!kind) return;

    // cache DV
    if (looksLikeDV(msg)) {
      this.store.upsertDV(msg as any);
      return;
    }

    // sem.dv.ask -> responder facets (o memoria si ya existe)
    if (kind === "sem.dv.ask") {
      const m = msg as SemAsk;
      const scopes = getScopes(m);
      const scope = scopes[0] || defaults.scope;

      const dv = m.payload.dv || (m.payload.id ? this.store.getDV(m.payload.id) : undefined);
      const dvId = dv?.id || m.payload.id;
      if (!dvId) return;

      // 1) si hay memoria, preferila
      const mem = this.store.getFacets(scope, dvId);
      if (mem?.facets) {
        const ans: SemAnswer = {
          kind: "sem.dv.answer",
          payload: { who: defaults.me, id: dvId, facets: mem.facets, confidence: mem.confidence ?? 0.8, ref: m.id },
          meta: { ns: defaults.ns, scope, ts: Date.now() },
        };
        this.say(ans);
        return;
      }

      // 2) si no hay memoria, calculamos facets y guardamos (aprendizaje local)
      if (dv) {
        const facets = facetsFromDV(dv);
        this.store.setFacets(scope, dvId, facets, 0.65);

        const ans: SemAnswer = {
          kind: "sem.dv.answer",
          payload: { who: defaults.me, id: dvId, facets, confidence: 0.65, ref: m.id },
          meta: { ns: defaults.ns, scope, ts: Date.now() },
        };
        this.say(ans);
      } else {
        // no sé: respondo vacío sin romper
        const ans: SemAnswer = {
          kind: "sem.dv.answer",
          payload: { who: defaults.me, id: dvId, facets: {}, confidence: 0.1, ref: m.id },
          meta: { ns: defaults.ns, scope, ts: Date.now() },
        };
        this.say(ans);
      }
      return;
    }

    // sem.dv.answer -> aprender memoria
    if (kind === "sem.dv.answer") {
      const scopes = getScopes(msg);
      const scope = scopes[0] || defaults.scope;
      const a = msg as SemAnswer;
      this.store.setFacets(scope, a.payload.id, a.payload.facets || {}, a.payload.confidence);
      this.store.addVote(scope, a.payload.id, a.payload.who || "anon", a.payload.confidence || 0.5);
this.store.bumpTrust(scope, a.payload.who || "anon", +0.01);

      return;
    }

    // sem.dv.outcome -> aprender outcomes
    if (kind === "sem.dv.outcome") {
      const scopes = getScopes(msg);
      const scope = scopes[0] || defaults.scope;
      const o = msg as SemOutcome;
      this.store.setOutcome(scope, o.payload.id, o.payload);
      return;
    }
  }
}

function looksLikeDV(m: any) {
  return (
    m &&
    typeof m === "object" &&
    typeof m.kind === "string" &&
    (Array.isArray(m.traits) || (m.meta && typeof m.meta === "object"))
  );
}
