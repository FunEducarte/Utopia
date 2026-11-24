// src/utopy/micelio/micelio.store.ts
import fs from "fs";
import path from "path";
import { DV } from "./types.js";
import { MICELIO } from "./micelio.config.js";

// ---------------- Types ----------------
export type SemMem = {
  at: number;
  facets?: Record<string, any>;
  confidence?: number;
  lastOutcome?: any;

  // ✅ extras opcionales (no rompen nada)
  votes?: Record<string, { who: string; confidence: number; at: number }>; // consenso simple
};

export type HealthMem = {
  at: number;
  lastSeen: number;
  ok: number;
  fail: number;
  lastError?: string;
};

export type TrustMem = {
  at: number;
  score: number; // 0..1
  samples: number;
};

export type StoreShape = {
  dv: Record<string, DV>; // dvId -> DV
  sem: Record<string, SemMem>; // `${scope}|${dvId}` -> memory
  chains: Record<string, any>; // chainId -> state (opcional)

  // ✅ agregado: no rompe tu carga vieja (defaults)
  health?: Record<string, HealthMem>; // nodeId -> health
  trust?: Record<string, TrustMem>; // `${scope}|${nodeId}` -> trust

  // ✅ índices (opcionales, se regeneran si faltan)
  dvByScope?: Record<string, Record<string, 1>>; // scope -> {dvId:1}
  dvByWorld?: Record<string, Record<string, 1>>; // worldId -> {dvId:1}
};

const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

function safeJsonParse(raw: string): any {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ---------------- Helpers ----------------
function uniqStrings(a: any): string[] {
  if (!Array.isArray(a)) return [];
  const out: string[] = [];
  for (const x of a) {
    const s = String(x || "").trim();
    if (s) out.push(s);
  }
  return Array.from(new Set(out));
}

function getDvScopes(dv: DV): string[] {
  // scopes vive en meta.scopes, pero a veces llega scope único
  const meta: any = (dv as any)?.meta || {};
  const scopes = uniqStrings(meta?.scopes);
  const scope = typeof meta?.scope === "string" ? meta.scope.trim() : "";
  if (scope) scopes.push(scope);
  return Array.from(new Set(scopes.length ? scopes : ["public"]));
}

function getWorldId(dv: DV): string | null {
  const attrs: any = (dv as any)?.attrs || {};
  const meta: any = (dv as any)?.meta || {};
  const wid = attrs?.worldId ?? meta?.worldId ?? attrs?.world?.id;
  if (wid == null) return null;
  const s = String(wid).trim();
  return s ? s : null;
}

function getDvTs(dv: DV): number {
  const meta: any = (dv as any)?.meta || {};
  const ts = meta?.ts ?? meta?.at ?? (dv as any)?.at ?? 0;
  const n = typeof ts === "number" ? ts : parseInt(String(ts || "0"), 10);
  return Number.isFinite(n) ? n : 0;
}

// ---------------- Store ----------------
export class MicelioStore {
  private file: string;
  private data: StoreShape;
  private dirty = false;

  // ✅ FIX cross-platform (DOM = number, Node = Timeout)
  private t?: ReturnType<typeof setTimeout>;

  constructor() {
    ensureDir(MICELIO.dataDir);
    this.file = path.join(
      MICELIO.dataDir,
      `micelio.${encodeURIComponent(MICELIO.ns)}.json`
    );
    this.data = this.load();
    this.ensureIndexes();
  }

  private load(): StoreShape {
    try {
      if (!fs.existsSync(this.file)) {
        return {
          dv: {},
          sem: {},
          chains: {},
          health: {},
          trust: {},
          dvByScope: {},
          dvByWorld: {},
        };
      }

      const raw = fs.readFileSync(this.file, "utf8");
      const parsed = safeJsonParse(raw) || {};

      return {
        dv: parsed?.dv || {},
        sem: parsed?.sem || {},
        chains: parsed?.chains || {},
        health: parsed?.health || {},
        trust: parsed?.trust || {},
        dvByScope: parsed?.dvByScope || {},
        dvByWorld: parsed?.dvByWorld || {},
      };
    } catch {
      return {
        dv: {},
        sem: {},
        chains: {},
        health: {},
        trust: {},
        dvByScope: {},
        dvByWorld: {},
      };
    }
  }

  private scheduleSave() {
    if (this.t) return;
    this.t = setTimeout(() => {
      this.t = undefined;
      this.flush();
    }, 250);
  }

  private flush() {
    if (!this.dirty) return;
    this.dirty = false;

    const tmp = `${this.file}.tmp`;
    try {
      fs.writeFileSync(tmp, JSON.stringify(this.data));
      fs.renameSync(tmp, this.file);
    } catch {
      try {
        fs.writeFileSync(this.file, JSON.stringify(this.data));
      } catch {
        // ignore
      }
    }
  }

  close() {
    if (this.t) clearTimeout(this.t);
    this.t = undefined;
    this.flush();
  }

  // ---------------- Indexes ----------------
  private ensureIndexes() {
    if (!this.data.dvByScope) this.data.dvByScope = {};
    if (!this.data.dvByWorld) this.data.dvByWorld = {};

    // si está vacío, lo regeneramos desde dv existente
    const hasAny =
      Object.keys(this.data.dvByScope).length > 0 ||
      Object.keys(this.data.dvByWorld).length > 0;

    if (hasAny) return;

    for (const dv of Object.values(this.data.dv || {})) {
      if (!dv?.id) continue;
      this.indexDV(dv);
    }
  }

  private indexDV(dv: DV) {
    if (!dv?.id) return;

    // scopes
    const scopes = getDvScopes(dv);
    for (const s of scopes) {
      if (!this.data.dvByScope) this.data.dvByScope = {};
      if (!this.data.dvByScope[s]) this.data.dvByScope[s] = {};
      this.data.dvByScope[s]![dv.id] = 1;
    }

    // worldId
    const wid = getWorldId(dv);
    if (wid) {
      if (!this.data.dvByWorld) this.data.dvByWorld = {};
      if (!this.data.dvByWorld[wid]) this.data.dvByWorld[wid] = {};
      this.data.dvByWorld[wid]![dv.id] = 1;

      // también metemos tag world:wid como “scope virtual” (para filtros rápidos)
      const tag = `world:${wid}`;
      if (!this.data.dvByScope) this.data.dvByScope = {};
      if (!this.data.dvByScope[tag]) this.data.dvByScope[tag] = {};
      this.data.dvByScope[tag]![dv.id] = 1;
    }
  }

  // ---------------- DV cache ----------------
  upsertDV(dv: DV) {
    if (!dv?.id) return;

    // normalizar scopes mínimos (no rompe)
    const meta: any = (dv as any).meta || {};
    const scopes = uniqStrings(meta.scopes);
    if (!scopes.length) {
      // default: public
      (dv as any).meta = { ...meta, scopes: ["public"] };
    }

    this.data.dv[dv.id] = dv;

    // ✅ index
    this.indexDV(dv);

    this.dirty = true;
    this.scheduleSave();
  }

  getDV(id: string): DV | undefined {
    return this.data.dv[id];
  }

  /**
   * ✅ Lista DVs (más nuevos primero)
   */
  getAllDV(limit = 200): DV[] {
    const items = Object.values(this.data.dv || {});
    items.sort((a: any, b: any) => getDvTs(b) - getDvTs(a));
    return items.slice(0, Math.max(1, Math.min(2000, limit)));
  }

  /**
   * ✅ Lista DVs por scope (más nuevos primero)
   * - Soporta scopes reales (meta.scopes) y el scope virtual "world:<id>"
   */
  getDVByScope(scope: string, limit = 200): DV[] {
    const s = String(scope || "").trim() || "public";
    const ids = this.data.dvByScope?.[s] ? Object.keys(this.data.dvByScope[s]!) : [];
    const out: DV[] = [];

    for (const id of ids) {
      const dv = this.data.dv[id];
      if (dv) out.push(dv);
    }

    out.sort((a: any, b: any) => getDvTs(b) - getDvTs(a));
    return out.slice(0, Math.max(1, Math.min(2000, limit)));
  }

  /**
   * ✅ Lista DVs por worldId (más nuevos primero)
   */
  getDVByWorld(worldId: string, limit = 200): DV[] {
    const wid = String(worldId || "").trim();
    if (!wid) return [];
    const ids = this.data.dvByWorld?.[wid] ? Object.keys(this.data.dvByWorld[wid]!) : [];
    const out: DV[] = [];

    for (const id of ids) {
      const dv = this.data.dv[id];
      if (dv) out.push(dv);
    }

    out.sort((a: any, b: any) => getDvTs(b) - getDvTs(a));
    return out.slice(0, Math.max(1, Math.min(2000, limit)));
  }

  // ---------------- SEM memory ----------------
  private semKey(scope: string, dvId: string) {
    return `${scope}|${dvId}`;
  }

  setFacets(scope: string, dvId: string, facets: Record<string, any>, confidence?: number) {
    const key = this.semKey(scope, dvId);
    const prev = this.data.sem[key] || { at: Date.now() };

    this.data.sem[key] = {
      ...prev,
      at: Date.now(),
      facets,
      confidence: typeof confidence === "number" ? confidence : prev.confidence,
    };

    this.dirty = true;
    this.scheduleSave();
  }

  getFacets(scope: string, dvId: string) {
    return this.data.sem[this.semKey(scope, dvId)];
  }

  setOutcome(scope: string, dvId: string, outcome: any) {
    const key = this.semKey(scope, dvId);
    const prev = this.data.sem[key] || { at: Date.now() };

    this.data.sem[key] = { ...prev, at: Date.now(), lastOutcome: outcome };

    this.dirty = true;
    this.scheduleSave();
  }

  // ---------------- Consensus simple ----------------
  addVote(scope: string, dvId: string, who: string, confidence: number) {
    const key = this.semKey(scope, dvId);
    const prev = this.data.sem[key] || { at: Date.now() };
    const votes = prev.votes || {};

    votes[who] = { who, confidence: clamp01(confidence), at: Date.now() };

    this.data.sem[key] = { ...prev, at: Date.now(), votes };
    this.dirty = true;
    this.scheduleSave();
  }

  pickConsensus(scope: string, dvId: string): { who: string; confidence: number } | null {
    const mem = this.getFacets(scope, dvId);
    const votes = mem?.votes || {};
    const arr = Object.values(votes) as Array<{ who: string; confidence: number }>;
    if (!arr.length) return null;

    let best = arr[0];
    let bestScore = -1;

    for (const v of arr) {
      const t = this.getTrust(scope, v.who).score;
      const score = clamp01(v.confidence) * clamp01(t);
      if (score > bestScore) {
        bestScore = score;
        best = v;
      }
    }
    return best || null;
  }

  // ---------------- Health ----------------
  markHealth(nodeId: string, ok: boolean, err?: unknown) {
    if (!this.data.health) this.data.health = {};
    const prev = this.data.health[nodeId] || {
      at: Date.now(),
      lastSeen: Date.now(),
      ok: 0,
      fail: 0,
    };

    const next: HealthMem = {
      ...prev,
      at: Date.now(),
      lastSeen: Date.now(),
      ok: prev.ok + (ok ? 1 : 0),
      fail: prev.fail + (ok ? 0 : 1),
      lastError: ok
        ? prev.lastError
        : err instanceof Error
        ? err.message
        : err != null
        ? String(err)
        : "unknown",
    };

    this.data.health[nodeId] = next;
    this.dirty = true;
    this.scheduleSave();
  }

  getHealth(nodeId: string): HealthMem | undefined {
    if (!this.data.health) this.data.health = {};
    return this.data.health[nodeId];
  }

  // ---------------- Trust ----------------
  private trustKey(scope: string, nodeId: string) {
    return `${scope}|${nodeId}`;
  }

  bumpTrust(scope: string, nodeId: string, delta: number) {
    if (!this.data.trust) this.data.trust = {};
    const key = this.trustKey(scope, nodeId);
    const prev = this.data.trust[key] || { at: Date.now(), score: 0.5, samples: 0 };

    const next: TrustMem = {
      at: Date.now(),
      score: clamp01((prev.score ?? 0.5) + delta),
      samples: (prev.samples ?? 0) + 1,
    };

    this.data.trust[key] = next;
    this.dirty = true;
    this.scheduleSave();
  }

  getTrust(scope: string, nodeId: string): TrustMem {
    if (!this.data.trust) this.data.trust = {};
    const key = this.trustKey(scope, nodeId);
    return this.data.trust[key] || { at: 0, score: 0.5, samples: 0 };
  }

  // ---------------- Chains ----------------
  setChain(chainId: string, st: any) {
    this.data.chains[chainId] = st;
    this.dirty = true;
    this.scheduleSave();
  }

  getChain(chainId: string) {
    return this.data.chains[chainId];
  }
}
 