import WebSocket from "ws";
import express from "express";
import cors from "cors";

import { MICELIO } from "./micelio.config.js";
import { MicelioStore } from "./micelio.store.js";
import { SemRouter } from "./sem.router.js";
import { ChainEngine, ActionChain } from "./action.chain.js";
import { SemOutcome } from "./types.js";

const log = (...a: any[]) => {
  if (MICELIO.log) console.log("[micelio]", ...a);
};

const store = new MicelioStore();

// ------------------------
// Event bus (SSE)
// ------------------------
type EventMsg = { kind: string; payload?: any; meta?: any; at: number };

class EventBus {
  private subs = new Set<(e: EventMsg) => void>();
  publish(e: EventMsg) {
    for (const fn of this.subs) {
      try {
        fn(e);
      } catch {}
    }
  }
  subscribe(fn: (e: EventMsg) => void) {
    this.subs.add(fn);
    return () => this.subs.delete(fn);
  }
}
const bus = new EventBus();

function publish(kind: string, payload?: any, meta?: any) {
  bus.publish({ kind, payload, meta, at: Date.now() });
}

// ------------------------
// Pending sem.dv.answer (await by cid)
// ------------------------
type Pending = { resolve: (x: any) => void; reject: (e: any) => void; t: any };
const pending = new Map<string, Pending>();

function makeCid() {
  return `cid_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function waitAnswer(cid: string, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      pending.delete(cid);
      reject(new Error("timeout_waiting_sem_dv_answer"));
    }, timeoutMs);
    pending.set(cid, { resolve, reject, t });
  });
}

// ------------------------
// HTTP API (para la UI)
// ------------------------
const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

const HTTP_PORT = parseInt(process.env.MICELIO_HTTP_PORT || "8789", 10);

// ------------------------
// WS ↔ seed (ref global)
// ------------------------
let ws: WebSocket | null = null;

function wsIsOpen() {
  return !!ws && ws.readyState === WebSocket.OPEN;
}

function sendToSeed(obj: any) {
  try {
    if (!wsIsOpen()) return false;
    ws!.send(JSON.stringify(obj));
    return true;
  } catch {
    return false;
  }
}

// Health
app.get("/health", (_req, res) => {
  const scope = MICELIO.scopes[0] || "public";
  res.json({
    ok: true,
    id: MICELIO.id,
    ns: MICELIO.ns,
    scopes: MICELIO.scopes,
    seedWs: MICELIO.seedWs,
    trust: store.getTrust(scope, MICELIO.id),
    health: store.getHealth(MICELIO.id),
    ws: wsIsOpen() ? "open" : "closed",
    ts: Date.now(),
  });
});

// ✅ Listar DVs (por scope/worldId)
app.get("/dv", (req, res) => {
  const limit = Math.max(1, Math.min(2000, parseInt(String(req.query.limit || "200"), 10)));
  const qWorldId = req.query.worldId ? String(req.query.worldId) : null;
  const qScope = req.query.scope ? String(req.query.scope) : null;

  // 1) base list
  const base =
    qScope && typeof (store as any).getDVByScope === "function"
      ? (store as any).getDVByScope(qScope, limit)
      : typeof (store as any).getAllDV === "function"
      ? (store as any).getAllDV(limit)
      : [];

  let out = Array.isArray(base) ? base.slice() : [];

  // 2) filtrar por world
  if (qWorldId) {
    const tag = `world:${qWorldId}`;
    out = out.filter((dv: any) => {
      const attrsWid = dv?.attrs?.worldId ? String(dv.attrs.worldId) : null;
      const metaWid = dv?.meta?.worldId ? String(dv.meta.worldId) : null;
      const scopes: string[] = Array.isArray(dv?.meta?.scopes) ? dv.meta.scopes.map(String) : [];
      return attrsWid === qWorldId || metaWid === qWorldId || scopes.includes(tag);
    });
  }

  // 3) ordenar por ts desc
  out.sort((a: any, b: any) => {
    const ta = a?.meta?.ts || a?.meta?.at || a?.at || 0;
    const tb = b?.meta?.ts || b?.meta?.at || b?.at || 0;
    return tb - ta;
  });

  res.json({ ok: true, ns: MICELIO.ns, items: out.slice(0, limit) });
});

// ✅ DV por id
app.get("/dv/:id", (req, res) => {
  const id = String(req.params.id);
  const dv = store.getDV(id);
  if (!dv) return res.status(404).json({ ok: false, error: "not_found", id });
  res.json({ ok: true, item: dv });
});

// ✅ SSE realtime
app.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  // @ts-ignore
  res.flushHeaders?.();

  const send = (e: EventMsg) => {
    res.write(`event: ${e.kind}\n`);
    res.write(`data: ${JSON.stringify(e)}\n\n`);
  };

  send({ kind: "hello", payload: { id: MICELIO.id, ns: MICELIO.ns }, at: Date.now() });

  const off = bus.subscribe(send);
  const t = setInterval(() => {
    res.write(`event: ping\ndata: {"ts":${Date.now()}}\n\n`);
  }, 20_000);

  req.on("close", () => {
    clearInterval(t);
    off();
    try {
      res.end();
    } catch {}
  });
});

// ✅ Pedir facets vía micelio (sem.dv.ask) + esperar sem.dv.answer
app.post("/sem/dv/ask", async (req, res) => {
  try {
    const dv = req.body?.dv; // opcional (si mandás DV completo)
    const dvId = req.body?.dvId || dv?.id;
    const scope = String(req.body?.scope || MICELIO.scopes[0] || "public");
    const ns = String(req.body?.ns || MICELIO.ns || "mt");

    if (!dvId) return res.status(400).json({ ok: false, error: "missing_dvId" });
    if (!wsIsOpen()) return res.status(503).json({ ok: false, error: "seed_ws_not_connected" });

    const cid = makeCid();

    // 🚀 mandamos ask con cid para poder esperar la respuesta
    const okSend = sendToSeed({
      kind: "sem.dv.ask",
      payload: { dvId, dv }, // mantenemos tu formato
      meta: { ns, scopes: [scope], scope, cid, from: MICELIO.id, ts: Date.now() },
    });

    if (!okSend) return res.status(503).json({ ok: false, error: "seed_ws_send_failed" });

    // ⏳ esperar sem.dv.answer con el mismo cid
    const answer = await waitAnswer(cid, 8000);

    return res.json({ ok: true, cid, answer });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || "ask_failed" });
  }
});

app.listen(HTTP_PORT, () => log(`HTTP API on :${HTTP_PORT}`));

// ------------------------
// WS ↔ seed
// ------------------------
let healthTimer: ReturnType<typeof setInterval> | null = null;

function connect() {
  log("connecting:", MICELIO.seedWs);
  ws = new WebSocket(MICELIO.seedWs);

  const router = new SemRouter(store, (m) => sendToSeed(m));

  const chainEngine = new ChainEngine(
    () => ({
      store,
      say: (kind: string, payload: any, meta?: any) => sendToSeed({ kind, payload, meta }),
      ns: MICELIO.ns,
      scope: MICELIO.scopes[0] || "public",
      me: MICELIO.id,
    }),
    (outcome: SemOutcome) => {
      sendToSeed(outcome);
      publish(outcome.kind || "sem.dv.outcome", outcome.payload ?? outcome, outcome.meta);
    },
    MICELIO.chainConcurrency
  );

  ws.on("open", () => {
    log("ws open");

    sendToSeed({
      kind: "node.alive",
      id: MICELIO.id,
      meta: { ns: MICELIO.ns, scopes: MICELIO.scopes },
    });

    sendToSeed({
      kind: "node.capability",
      id: MICELIO.id,
      capabilities: ["sem.router", "sem.memory", "action.chain", "http.api"],
      meta: { ns: MICELIO.ns, scopes: MICELIO.scopes, http: `http://127.0.0.1:${HTTP_PORT}` },
    });

    // replay DV
    sendToSeed({ kind: "dato.query", limit: 500, scope: MICELIO.scopes[0] || "public" });

    // ✅ health heartbeat → red + UI (NO duplicar)
    if (healthTimer) clearInterval(healthTimer);
    healthTimer = setInterval(() => {
      const scope = MICELIO.scopes[0] || "public";
      const payload = {
        id: MICELIO.id,
        trust: store.getTrust(scope, MICELIO.id),
        health: store.getHealth(MICELIO.id),
      };

      sendToSeed({ kind: "micelio.health", payload, meta: { ns: MICELIO.ns, scopes: MICELIO.scopes } });
      publish("micelio.health", payload, { ns: MICELIO.ns, scopes: MICELIO.scopes });
    }, 20_000);
  });

  ws.on("message", (raw: WebSocket.RawData) => {
    try {
      const txt = raw.toString();
      const msg = JSON.parse(txt);

      // 1) router: cache DV + sem
      router.onMessage(msg, { ns: MICELIO.ns, scope: MICELIO.scopes[0] || "public", me: MICELIO.id });

      // 2) DV events → SSE
      if (msg?.kind === "dato.create" || msg?.kind === "dato.update" || msg?.kind === "dato.upsert") {
        const dv = msg?.payload || msg?.dv || msg;
        if (dv?.id) {
          try {
            store.upsertDV(dv);
          } catch {}
          publish(msg.kind, dv, msg.meta);
        }
      }

      // facets answers → SSE + resolver pending(cid)
      if (msg?.kind === "sem.dv.answer") {
        publish("sem.dv.answer", msg?.payload ?? msg, msg?.meta);

        const cid = msg?.meta?.cid;
        if (cid && pending.has(cid)) {
          const p = pending.get(cid)!;
          clearTimeout(p.t);
          pending.delete(cid);
          p.resolve(msg);
        }
      }

      // 3) Chains
      if (msg?.kind === "action.chain") {
        const chain = msg?.payload as ActionChain;
        if (chain?.id && chain?.dvId && chain?.steps && chain?.start) {
          store.setChain(chain.id, { at: Date.now(), chain });
          chainEngine.enqueue(chain);
          publish("action.chain", chain, msg?.meta);
        }
      }

      if (msg?.kind === "mt:nodo.accion" && msg?.actionChain) {
        const chain = msg.actionChain as ActionChain;
        if (chain?.id) {
          chainEngine.enqueue(chain);
          publish("action.chain", chain, msg?.meta);
        }
      }
    } catch {
      // ignore
    }
  });

  ws.on("close", () => {
    log("ws close -> reconnect");
    ws = null;

    // ✅ parar timer (si no, se duplican)
    if (healthTimer) {
      clearInterval(healthTimer);
      healthTimer = null;
    }

    setTimeout(connect, 1200);
  });

  ws.on("error", () => {});
}

connect();

process.on("SIGINT", () => {
  try {
    store.close();
  } catch {}
  process.exit(0);
});
process.on("SIGTERM", () => {
  try {
    store.close();
  } catch {}
  process.exit(0);
});
