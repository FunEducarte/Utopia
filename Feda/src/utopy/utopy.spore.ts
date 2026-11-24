// File: src/utopy/SporeClientBio.ts
import { UtopySpore } from "../utopy";

/** Intent simbólico (shape compatible con UtopySpore.sayIntent) */
export type Intent = {
  sym: string;
  say: string;
  with?: any;
  ns?: string;
  to?: string;
  replyTo?: string;
  ts?: number;
};

// ── Símbolos base
export const SYM = {
  SEM_DICT: "📝",
  DATO_QUERY: "🔎",
  DATO_CREATE: "🌱",
  BIO_CREATE: "🧬",
  NODE_UPSERT: "✨",
  NODE_CAP: "🧩",
  NODE_ALIVE: "💓",
  ORDER: "🛒",
  DELIVERY: "🚚",
  MATCH: "🤝",
  ORG_REG: "🏪",
  SEED_INV: "🛰️",

  // ✅ SEM ROUTER (UTOPY)
  SEM_DV_ASK: "❓",
  SEM_DV_ANSWER: "📎",
  SEM_DV_OUTCOME: "🧠",
  MICELIO_SYNC: "🕸️",
} as const;

export const SEM_DICT: Record<string, string> = {
  [SYM.SEM_DICT]: "sem.dict",
  [SYM.DATO_QUERY]: "dato.query",
  [SYM.DATO_CREATE]: "dato.create",
  [SYM.BIO_CREATE]: "bio.create",
  [SYM.NODE_UPSERT]: "node.upsert",
  [SYM.NODE_CAP]: "node.capability",
  [SYM.NODE_ALIVE]: "node.alive",
  [SYM.ORDER]: "order.create",
  [SYM.DELIVERY]: "delivery.plan",
  [SYM.MATCH]: "market.match",
  [SYM.ORG_REG]: "org.register",
  [SYM.SEED_INV]: "seed.invite",

  // ✅ verbs reales
  [SYM.SEM_DV_ASK]: "sem.dv.ask",
  [SYM.SEM_DV_ANSWER]: "sem.dv.answer",
  [SYM.SEM_DV_OUTCOME]: "sem.dv.outcome",
  [SYM.MICELIO_SYNC]: "micelio.sync.request",
};

// ── Tipos dominio (simplificados)
export type BioKind = "producto" | "territorio" | "org" | "servicio" | "evento";

export type DatoBio<T extends BioKind = BioKind> = {
  id: string;
  kind: T;
  attrs: Record<string, any>;
  meta?: Record<string, any>;
  traits?: string[];
  labels?: string[];
};

// Almacén / Organización
export type OrgLocal = DatoBio<"org"> & {
  attrs: {
    nombre: string;
    rol: "coop" | "municipio" | "feria" | "org" | "almacen";
    geo?: { lat: number; lng: number };
  };
};

// Producto
export type ProductoBio = DatoBio<"producto"> & {
  attrs: {
    nombre: string;
    unidad?: string;
    precio?: number;
    stock?: number;
    productor?: string;
    certificacion?: string;
    geo?: any;
    name?: string;
  };
};

// Territorio
export type TerritorioBio = DatoBio<"territorio"> & {
  attrs: {
    nombre?: string;
    name?: string;
    descripcion?: string;
    barrio?: string;
    direccion?: string;
    ubicacion?: { barrio?: string; direccion?: string; geo?: any };
    areaM2?: number;
    practica?: "agroecologia" | "nativo" | "mixto";
    soberania?: "comunal" | "indigena" | "mixta" | "privada" | "publica";
    uso?: "huerta" | "vivienda" | "mixto" | "resguardo" | "biodiversidad";
    acuerdos?: string[];
    geo?: any;
  };
};

// ── Mercado / logística
export type OrdenCompra = {
  id: string;
  items: Array<{
    bioId: string;
    nombre?: string;
    cantidad: number;
    unidad?: string;
    precio?: number;
  }>;
  buyer: { nombre: string; contacto?: string; geo?: any };
  preferLocal?: boolean;
};

export type PlanDelivery = {
  id: string;
  ordenId: string;
  prefer: "bici" | "caminar" | "colectivo" | "camioneta" | "mixto";
  ventanas?: Array<{ fromISO: string; toISO: string }>;
  hub?: string;
  optimizar?: "huella" | "tiempo" | "costo";
};

// ── Utils
type Transport = "ws" | "http" | "webrtc";
const isTransport = (t: any): t is Transport => t === "ws" || t === "http" || t === "webrtc";
const toArr = <T = any>(v: any): T[] => (v == null ? [] : Array.isArray(v) ? v : [v]);

type SemRouterLike = {
  onMessage: (msg: any) => void;
  requestSync?: (scope?: string, since?: number) => void;
  askFacets?: (dvOrId: any, scope?: string) => any;
  outcome?: (
    dvId: string,
    action: any,
    result?: any,
    effects?: any,
    scope?: string,
    confidence?: number
  ) => void;
};

type FacetsSink = {
  set: (id: string, facets: any) => void;
  get: (id: string) => any | undefined;
};

function makeDefaultFacetsSink(): FacetsSink {
  const mem = new Map<string, any>();
  return {
    set(id, facets) {
      mem.set(id, facets || {});
      // opcional: persistir en localStorage si existe (no rompe Node/Hermes)
      try {
        const ls = (globalThis as any)?.localStorage;
        if (ls?.setItem) ls.setItem(`facets:${id}`, JSON.stringify(facets || {}));
      } catch {}
    },
    get(id) {
      if (mem.has(id)) return mem.get(id);
      try {
        const ls = (globalThis as any)?.localStorage;
        const raw = ls?.getItem?.(`facets:${id}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          mem.set(id, parsed);
          return parsed;
        }
      } catch {}
      return undefined;
    },
  };
}

class SporeClientBio {
  private spore: UtopySpore | null = null;
  private _readyResolve?: () => void;
  private _readyPromise: Promise<void> = Promise.resolve();

  /** Listeners que se registran antes de init() */
  private _pendingOn: Array<{ kind: string; handler: (msg: any) => void }> = [];

  /** ✅ SemRouter inyectado (opcional) */
  private semRouter: SemRouterLike | null = null;
  public setSemRouter(router: SemRouterLike | null) {
    this.semRouter = router;
  }

  /** ✅ Cache de facets (RAM + localStorage si está) */
  private facetsSink: FacetsSink = makeDefaultFacetsSink();
  public setFacetsSink(sink: FacetsSink) {
    this.facetsSink = sink;
  }

  // ---------- Re-export público básico ----------

  /** Suscribirse a eventos del spore (ej: "intent", "node.capability", "*") */
  public on(kind: string, handler: (msg: any) => void): () => void {
    if (this.spore) return this.spore.on(kind, handler);
    this._pendingOn.push({ kind, handler });
    return () => {
      /* no-op: pre-init */
    };
  }

  /** Desuscribirse */
  public off(kind: string, handler?: (msg: any) => void) {
    this.spore?.off(kind, handler as any);
  }

  /** Escuchar una sola vez */
  public once(kind: string, handler: (msg: any) => void) {
    if (this.spore) return this.spore.once(kind, handler);
    const wrapper = (m: any) => {
      try {
        handler(m);
      } finally {
        this.off(kind, wrapper);
      }
    };
    this._pendingOn.push({ kind, handler: wrapper });
    return () => this.off(kind, wrapper);
  }

  /** Enviar intención simbólica */
  public async sayIntent(i: Intent) {
    const s = await this.requireReady();
    return (s as any).sayIntent(i);
  }

  /** Utilidades proxied */
  public addWsCandidate(url: string, meta?: any) {
    (this.spore as any)?.addWsCandidate?.(url, meta);
  }
  public setNamespace(ns?: string) {
    (this.spore as any)?.setNamespace?.(ns);
  }
  public teach(sym: string, meaning: string, note?: string) {
    (this.spore as any)?.teach?.(sym, meaning, note);
  }
  public getState() {
    return (this.spore as any)?.getState?.();
  }

  // ---------- API de negocio ----------
  public async call(verb: string, payload?: any) {
    return (await this.requireReady()).call(verb, payload);
  }

  public getId(): string | undefined {
    try {
      return (this as any).spore?.getState?.().id as string | undefined;
    } catch {
      return undefined;
    }
  }

  // ✅ Sem DV helpers
  public async askDVFacets(dvOrId: any, want?: string[], scope?: string) {
    const s = await this.requireReady();
    const dv = typeof dvOrId === "object" ? dvOrId : null;
    const id = typeof dvOrId === "string" ? dvOrId : dv?.id;
    if (!id) throw new Error("askDVFacets: falta id");

    const meta: any = { ts: Date.now() };
    if (scope) meta.scope = scope;

    return s.call("sem.dv.ask", {
      id,
      dv: dv || undefined,
      want: want || ["identity.label", "summary.text", "geo", "media.image"],
      ts: Date.now(),
      meta,
    });
  }

  public resolveCachedFacets(dvOrId: any) {
    const id = typeof dvOrId === "string" ? dvOrId : dvOrId?.id;
    if (!id) return null;
    const pre = dvOrId?.meta?.facets;
    if (pre) return pre;
    return this.facetsSink.get(id) ?? null;
  }

  // init con token opcional
  async init(manifestInput: any, opts?: { token?: string }) {
    const src =
      typeof manifestInput === "string"
        ? (() => {
            try {
              return JSON.parse(manifestInput);
            } catch {
              return null;
            }
          })()
        : manifestInput;

    if (!src || typeof src !== "object") throw new Error("Manifiesto UTOPÝ inválido");

    const endpoints = src.endpoints ?? {
      ws: toArr<string>(src.ws || src?.utopy?.transports?.gossip?.wsSeeds),
      http: toArr<string>(src.http),
      webrtc: toArr<string>(src.webrtc),
    };
    const total =
      (endpoints.ws?.length ?? 0) + (endpoints.http?.length ?? 0) + (endpoints.webrtc?.length ?? 0);
    if (total === 0) throw new Error("Manifiesto UTOPÝ inválido (sin endpoints)");

    this._readyPromise = new Promise<void>((res) => (this._readyResolve = res));

    this.spore = new UtopySpore({
      onState: (s) => {
        if (s.attached) this._readyResolve?.();
      },
      onLog: (l) => console.log("[UTOPY]", typeof l === "string" ? l : JSON.stringify(l)),
      onMessage: (m: any) => {
        // ✅ discovery: micro-seeds
        if (m?.kind === "node.capability" && m?.payload?.type === "seed" && typeof m?.payload?.ws === "string") {
          (this.spore as any)?.addWsCandidate?.(m.payload.ws, {
            scope: m.payload.scope || "public",
            source: "capability",
          });
        }

        // ✅ responder sem.ask (diccionario de símbolos)
        if (m?.kind === "sem.ask") {
          const simbolo = m?.payload?.simbolo as string | undefined;
          const who = (this.spore as any)?.getState?.()?.id || "node";
          if (!simbolo || simbolo === SYM.SEM_DICT) {
            this.spore!.call("sem.tell", { who, dict: SEM_DICT, ref: m?.id }).catch(() => {});
          } else if (SEM_DICT[simbolo]) {
            this.spore!.call("sem.tell", { who, dict: { [simbolo]: SEM_DICT[simbolo] }, ref: m?.id }).catch(() => {});
          }
          // no return: dejamos pasar al semRouter también
        }

        // ✅ Cachear facets si llega sem.dv.answer
        if (m?.kind === "sem.dv.answer") {
          const id = m?.payload?.id || m?.payload?.dv?.id || m?.id;
          const facets = m?.payload?.facets;
          if (id && facets) this.facetsSink.set(String(id), facets);
        }

        // ✅ Pasar TODO al SemRouter si existe
        try {
          this.semRouter?.onMessage?.(m);
        } catch (e) {
          console.log("[UTOPY] semRouter.onMessage error:", e);
        }
      },
    });

    // listeners pre-init
    if (this._pendingOn.length) {
      for (const { kind, handler } of this._pendingOn) this.spore.on(kind, handler);
      this._pendingOn = [];
    }

    // auth injection
    if (opts?.token) {
      this.spore.setAuthGetter(() => opts.token!);
    } else {
      try {
        const tok = (globalThis as any)?.process?.env?.UTOPY_AUTH_TOKEN;
        if (tok) this.spore.setAuthGetter(() => tok);
      } catch {}
    }

    const prefer = toArr(src.prefer).filter(isTransport) as Transport[];
    this.spore.setPreferredOrder(prefer.length ? prefer : (["ws", "http", "webrtc"] as Transport[]));

    if (typeof (this.spore as any).awaken === "function") {
      await (this.spore as any).awaken({ manifest: src });
    } else {
      await (this.spore as any).attach({ ...src, endpoints });
    }
    await this.waitUntilAttached(8000);

    // enseñar símbolos
    Object.entries(SEM_DICT).forEach(([sym, meaning]) => this.spore!.teach(sym, meaning, `teach ${meaning}`));

    // anunciar nodo + pedir diccionario
    try {
      await this.announceSelf({ platform: "node_or_rn" });
      await this.spore.call("sem.ask");
    } catch (e) {
      console.log("[UTOPY] announceSelf error:", e);
    }
  }

  isReady() {
    return !!this.spore && this.spore.getState().attached;
  }

  async waitUntilAttached(timeoutMs = 8000) {
    if (!this.spore) throw new Error("Spore no inicializado");
    const start = Date.now();
    while (!this.spore.getState().attached) {
      if (Date.now() - start > timeoutMs) throw new Error("Spore no adjuntado (timeout)");
      await new Promise((r) => setTimeout(r, 100));
    }
    this._readyResolve?.();
  }

  private async requireReady() {
    if (!this.spore) throw new Error("Spore no inicializado");
    if (!this.spore.getState().attached) await this.waitUntilAttached(8000);
    return this.spore;
  }

  async announceSelf(meta?: Record<string, any>) {
    const s = await this.requireReady();
    const selfId = (s as any).getState?.().id || "spore.node";
    await s.call(SEM_DICT[SYM.NODE_UPSERT], {
      id: selfId,
      kind: "app",
      attrs: { name: "SporeNode" },
      meta: meta || {},
    });
    await s.call(SEM_DICT[SYM.NODE_ALIVE], { id: selfId });
  }

  private async upsertNodeFromData(d: { id: string; kind: string; attrs?: any; meta?: any }) {
    const s = await this.requireReady();
    const selfId = (s as any).getState?.().id || "spore.node";
    await s.call(SEM_DICT[SYM.NODE_UPSERT], {
      id: d.id,
      kind: d.kind,
      attrs: d.attrs || {},
      meta: d.meta || {},
      parent: selfId,
    });

    const caps: string[] =
      d.kind === "producto"
        ? ["info", "offer.sell", "stock.update"]
        : d.kind === "territorio"
        ? ["info", "soil.log", "harvest.plan", "lease.offer", "governance.rule"]
        : d.kind === "org"
        ? ["info", "org.match", "hub.receive"]
        : ["info"];

    await s.call(SEM_DICT[SYM.NODE_CAP], { id: d.id, capabilities: caps });
  }

  async crearBio<T extends BioKind>(bio: DatoBio<T>) {
    const s = await this.requireReady();
    try {
      await (s as any).interpret(SYM.BIO_CREATE, bio);
    } catch {
      await (s as any).interpret(SYM.DATO_CREATE, {
        id: bio.id,
        kind: bio.kind,
        attrs: bio.attrs,
        meta: bio.meta,
        traits: bio.traits,
        labels: bio.labels,
      });
    }
    await this.upsertNodeFromData({ id: bio.id, kind: bio.kind, attrs: bio.attrs, meta: bio.meta });

    // opcional: pedir facets para UI inmediata
    try {
      const scope = (bio as any)?.meta?.scope || (bio as any)?.meta?.scopes?.[0];
      await this.askDVFacets(bio, undefined, scope);
    } catch {}
  }

  async crearProducto(p: ProductoBio) {
    return this.crearBio(p);
  }
  async crearTerritorio(t: TerritorioBio) {
    return this.crearBio(t);
  }
  async registrarOrg(org: OrgLocal) {
    const s = await this.requireReady();
    try {
      await (s as any).interpret(SYM.ORG_REG, org);
    } catch {
      await this.crearBio(org);
    }
    await this.upsertNodeFromData({ id: org.id, kind: org.kind, attrs: org.attrs, meta: org.meta });
  }

  async crearOrden(o: OrdenCompra) {
    return (await this.requireReady()).interpret(SYM.ORDER, o);
  }
  async planDelivery(plan: PlanDelivery) {
    return (await this.requireReady()).interpret(SYM.DELIVERY, plan);
  }
  async matchMercado(demanda: {
    items: Array<{ nombre?: string; bioId?: string; cantidad: number; unidad?: string }>;
    geo?: any;
    reglas?: any;
  }) {
    return (await this.requireReady()).interpret(SYM.MATCH, demanda);
  }

  async buscar(where: Record<string, any>, limit = 50) {
    return (await this.requireReady()).interpret(SYM.DATO_QUERY, { where, limit });
  }

  async syncFromMicelio(scope = "public", since = 0) {
    try {
      this.semRouter?.requestSync?.(scope, since);
    } catch {}
  }

  async ping(msg = "hola utopy") {
    await (await this.requireReady()).call("ping", { msg });
  }
  async invitar(prefer?: Transport) {
    await (await this.requireReady()).call(SYM.SEED_INV, prefer ? { prefer } : undefined);
  }
}

export const sporeClient = new SporeClientBio();
