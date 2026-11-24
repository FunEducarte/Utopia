// src/utopy/bootSpore.ts
import manifest from "./manifest.prod.json";
import { sporeClient } from "./utopy.spore";

import { SkillLocalStore } from "./skills.localstore";
import { MindCore } from "./mind";
import { EmojiInterpreter, ADNInterpreter, SensorInterpreter } from "./interpreters";
import { makeRuleInterpreter, Rule } from "./interpreter.rules";
import { SkillVenta, SkillHuerta, SkillEnergia } from "./skills";
import { publish } from "./resonance";
import { SkillContext } from "./skills.context";

import { makeMirrorStore, makeRemoteSporeAdapter } from "./store.mirror";
import { hear, dispatch } from "./symbol.bus";
import { UPortal } from "./ui/UniversalPortal";
import { SymbiosisCore } from "./symbiosis.core";

declare const __DEV__: boolean | undefined;

// ---------------------------------------------------------------------
// isDev seguro (sin import.meta; sin depender de process directo)
// ---------------------------------------------------------------------
function resolveIsDev(): boolean {
  try {
    if (typeof __DEV__ !== "undefined") return !!__DEV__;
  } catch {}
  try {
    const g: any = globalThis as any;
    const proc = g && g.process;
    if (proc?.env?.NODE_ENV) return proc.env.NODE_ENV !== "production";
  } catch {}
  return false;
}
const isDev = resolveIsDev();

// Núcleo de simbiosis (solo wireToSpore, sin attachMind)
export const symCore = new SymbiosisCore();
symCore.wireToSpore(sporeClient);

export let mindRef: MindCore | null = null;

// ---------------------------------------------------------------------
// ✅ Local store compatible con MindStore (incluye all())
// - Web: usa localStorage si existe
// - Node/RN: cae a memoria
// ---------------------------------------------------------------------
type MindStore = {
  get: (k: string) => Promise<any>;
  set: (k: string, v: any) => Promise<void>;
  del?: (k: string) => Promise<void>;
  all: (prefix?: string) => Promise<Array<{ key: string; value: any }>>;
};

function makeLocalStoreMind(prefix = "utopy"): MindStore {
  const mem = new Map<string, any>();

  const hasLS = () => {
    try {
      const ls = (globalThis as any)?.localStorage;
      return !!ls?.getItem && !!ls?.setItem;
    } catch {
      return false;
    }
  };

  const keyOf = (k: string) => `${prefix}:${k}`;

  // cargar de LS a mem (solo si hace falta)
  const loadFromLS = (fullKey: string) => {
    if (!hasLS()) return undefined;
    try {
      const raw = (globalThis as any).localStorage.getItem(fullKey);
      if (raw == null) return undefined;
      const parsed = JSON.parse(raw);
      mem.set(fullKey, parsed);
      return parsed;
    } catch {
      return undefined;
    }
  };

  return {
    async get(k: string) {
      const full = keyOf(k);
      if (mem.has(full)) return mem.get(full);
      return loadFromLS(full);
    },

    async set(k: string, v: any) {
      const full = keyOf(k);
      mem.set(full, v);
      if (hasLS()) {
        try {
          (globalThis as any).localStorage.setItem(full, JSON.stringify(v));
        } catch {}
      }
    },

    async del(k: string) {
      const full = keyOf(k);
      mem.delete(full);
      if (hasLS()) {
        try {
          (globalThis as any).localStorage.removeItem(full);
        } catch {}
      }
    },

    async all(pfx?: string) {
      const wantPrefix = keyOf(pfx || "");
      const out: Array<{ key: string; value: any }> = [];

      // 1) traer de localStorage si existe (para que no dependas solo de mem)
      if (hasLS()) {
        try {
          const ls = (globalThis as any).localStorage;
          for (let i = 0; i < ls.length; i++) {
            const k = ls.key(i);
            if (!k) continue;
            if (!k.startsWith(wantPrefix)) continue;
            // poblar mem
            if (!mem.has(k)) loadFromLS(k);
          }
        } catch {}
      }

      // 2) devolver desde mem filtrado
      for (const [full, value] of mem.entries()) {
        if (!full.startsWith(wantPrefix)) continue;
        const key = full.slice((`${prefix}:`).length); // vuelve a "dato:xxx"
        out.push({ key, value });
      }

      return out;
    },
  };
}

// ---------------------------------------------------------------------
// Mirror pump remoto→local con backoff simple
// ---------------------------------------------------------------------
function startMirrorPump(
  ctxStore: { set: (k: string, v: any) => Promise<void> },
  remoteAny: any,
  opts?: { intervalMs?: number; jitterMs?: number; maxBackoffMs?: number; prefix?: string }
) {
  const base = opts?.intervalMs ?? 15_000;
  const jitter = opts?.jitterMs ?? 3_000;
  const maxBackoff = opts?.maxBackoffMs ?? 60_000;
  const prefix = opts?.prefix ?? "dato:";

  const pullFn: (() => Promise<any[]>) =
    typeof remoteAny?.pullRemote === "function"
      ? remoteAny.pullRemote.bind(remoteAny)
      : typeof remoteAny?.pull === "function"
      ? remoteAny.pull.bind(remoteAny)
      : typeof remoteAny?.fetch === "function"
      ? remoteAny.fetch.bind(remoteAny)
      : async () => [];

  let stopped = false;
  let backoff = 0;

  async function tick() {
    if (stopped) return;
    try {
      const items = await pullFn();
      if (Array.isArray(items)) {
        for (const it of items) {
          const id = it?.id || `anon_${Math.random().toString(36).slice(2)}`;
          await ctxStore.set(`${prefix}${id}`, it);
        }
      }
      backoff = 0;
    } catch {
      backoff = Math.min(maxBackoff, backoff ? backoff * 2 : base);
    } finally {
      const wait = (backoff || base) + Math.floor(Math.random() * jitter);
      setTimeout(tick, wait);
    }
  }

  tick();
  return () => {
    stopped = true;
  };
}

// ---------------------------------------------------------------------
// ✅ Boot
// ---------------------------------------------------------------------
export async function bootSpore(opts?: { env?: string; platform?: string; token?: string }) {
  // 0) Renderer default (DVPortal si existe)
  if (!UPortal.has("default")) {
    const dv = (globalThis as any).__DVPORTAL__;
    if (dv?.mount) UPortal.register("default", (blocks) => dv.mount(blocks));
    else {
      UPortal.register("default", (blocks) => {
        if (!blocks) return;
        console.log("[UPortal/default] blocks:", JSON.stringify(blocks));
      });
    }
  }

  // 1) Spore attach
  await sporeClient.init(manifest, { token: opts?.token });
  await sporeClient.announceSelf({
    env: opts?.env ?? (isDev ? "dev" : "prod"),
    platform: opts?.platform ?? "web",
  });

  // 2) Contexto para bus simbólico
  const ctx: any = {
    me: sporeClient.getId?.() || "node@utopy",
    say: (i: any) => sporeClient.sayIntent(i),
    portal: UPortal,
  };

  // 3) Intent → bus
  sporeClient.on("intent", (msg: any) => {
    const intent = msg?.payload || msg?.i || msg;
    if (intent?.sym && intent?.say) dispatch(intent, ctx);
  });

  // 4) Mind
  const mind = new MindCore(publish);
  mind.useInterpreter(EmojiInterpreter).useInterpreter(ADNInterpreter).useInterpreter(SensorInterpreter);

  // 5) Reglas
  const reglas: Rule[] = [
    {
      when: (d) => d.kind === "emoji" && d.payload?.symbol === "🍞",
      to: () => [{ goal: "symbol_boost", args: { ns: "mt", symbol: "🍞", add: 1 }, confidence: 0.7 }],
    },
    {
      when: (d, ctx2) =>
        d.kind === "medicion" &&
        d.payload?.tipo === "energia" &&
        typeof d.payload?.valor === "number" &&
        d.payload.valor >= (ctx2.beliefs.get("energia:umbral")?.value ?? 2.0),
      to: () => [{ goal: "set_modo", args: { modo: "ahorro" }, confidence: 0.9 }],
      weight: 2,
    },
  ];
  mind.useInterpreter(makeRuleInterpreter("rules.nodal", reglas));

  // 6) Persistencia: local-first + espejo (✅ local compatible con MindStore)
  const local = makeLocalStoreMind("utopy");
  const remote = makeRemoteSporeAdapter();
  (mind as any).ctx.store = makeMirrorStore(local as any, remote);

  // 7) DV listeners (ver DV + pedir facets)
  const onDV = async (m: any, op: "create" | "update") => {
    const dv = m?.payload || m?.dv || m;
    if (!dv?.id) return;

    // guardar DV en store
    try {
      await (mind as any).ctx.store.set(`dato:${dv.id}`, dv);
    } catch {}

    // pedir facets
    try {
      const scope = dv?.meta?.scope || dv?.meta?.scopes?.[0] || "public";
      const ask = (sporeClient as any)?.askDVFacets;
      if (typeof ask === "function") await ask.call(sporeClient, dv, undefined, scope);
    } catch {}

    // debug intent
    try {
      dispatch({ sym: "✨", say: `dv.${op}`, with: { dv }, ns: "default", ts: Date.now() }, ctx);
    } catch {}
  };

  sporeClient.on("dato.create", (m: any) => void onDV(m, "create"));
  sporeClient.on("dato.update", (m: any) => void onDV(m, "update"));
  sporeClient.on("dv.create", (m: any) => void onDV(m, "create"));
  sporeClient.on("dv.update", (m: any) => void onDV(m, "update"));
  sporeClient.on("dv.created", (m: any) => void onDV(m, "create"));
  sporeClient.on("dv.updated", (m: any) => void onDV(m, "update"));

  // 8) Mirror pump
  const stopPump = startMirrorPump((mind as any).ctx.store, remote, {
    intervalMs: 15_000,
    jitterMs: 3_000,
    maxBackoffMs: 60_000,
    prefix: "dato:",
  });

  // 9) Skills
  mind.useSkill(SkillContext).useSkill(SkillLocalStore).useSkill(SkillVenta).useSkill(SkillHuerta).useSkill(SkillEnergia);

  // 10) Contexto inicial
  mind.remember("modo", "feria", 3);
  mind.remember("energia:umbral", 2.0, 3);
  mind.learnSymbol("mt", "🧪", { goal: "medir_energia", weight: 2 });

  // 11) Bus render
  hear("*", "render", (i: any) => {
    const blocks = i?.with?.blocks ?? null;
    const target = i?.ns || "default";
    UPortal.mount(blocks, target);
  });

  mindRef = mind;

  // Limpieza hot-reload
  (globalThis as any).__UTOPY_STOP_PUMP__?.();
  (globalThis as any).__UTOPY_STOP_PUMP__ = stopPump;

  console.log("[UTOPY] spore + mind + mirror + UPortal + Symbiosis OK");
  return { sporeClient, mind, stopPump };
}
