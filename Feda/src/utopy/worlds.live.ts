// File: src/utopy/worlds.live.ts
// Feda — mundos/territorios vivos + resonancia semántica (sem.dv.ask / sem.dv.answer)

export interface DatoVivo {
  id?: string;
  kind?: string;
  ns?: string;
  attrs?: Record<string, any>;
  traits?: string[];
  labels?: string[]; // ✅ nivel raíz (capa humana opcional)
  meta?: {
    ns?: string;
    scopes?: string[];
    ts?: number;
    [key: string]: any;
  };
  auth?: string;
  with?: any;
  [key: string]: any;
}

// ─────────────────────────────────────────────────────────────────────────────
// Store vivo en memoria
// ─────────────────────────────────────────────────────────────────────────────
let worldsStore: DatoVivo[] = [];
let subscribers: Array<(all: DatoVivo[]) => void> = [];
let socket: WebSocket | null = null;

// 👇 IMPORTANTE: ahora apuntamos a ns=mt, no utopy:worlds
const DEFAULT_WS_URL = "wss://seed.mterra.space/utopy?ns=mt&client=feda-web";

// ─────────────────────────────────────────────────────────────────────────────
// Resonancia semántica — cache local (no UI universal)
// ─────────────────────────────────────────────────────────────────────────────
export type SemFacets = {
  // paths sugeridos (no obligatorios)
  titlePath?: string;     // ej: "attrs.nombre"
  subtitlePath?: string;  // ej: "attrs.barrio"
  imagePath?: string;     // ej: "attrs.media.image"
  tagFrom?: Array<"kind" | "traits" | string>;
  aliases?: Record<string, string>; // tolerancia (attrs.name -> attrs.nombre)
  [k: string]: any;
};

type SemAnswerPayload = {
  who?: string;
  id?: string;            // dvId
  facets?: SemFacets;
  ref?: string;           // id del ask
};

const SEM_CACHE_KEY = "utopy:sem.dv.cache.v1";
let semCache = new Map<string, SemFacets>(); // dvId -> facets

function loadSemCache() {
  try {
    const raw = window.localStorage.getItem(SEM_CACHE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      semCache = new Map<string, SemFacets>(Object.entries(parsed));
    }
  } catch (e) {
    console.warn("[worlds.live] sem cache load error:", e);
  }
}
function saveSemCache() {
  try {
    const obj: Record<string, SemFacets> = {};
    for (const [k, v] of semCache.entries()) obj[k] = v;
    window.localStorage.setItem(SEM_CACHE_KEY, JSON.stringify(obj));
  } catch (e) {
    console.warn("[worlds.live] sem cache save error:", e);
  }
}
function semGet(dvId?: string) {
  if (!dvId) return undefined;
  return semCache.get(dvId);
}
function semPut(dvId: string, facets: SemFacets) {
  if (!dvId) return;
  semCache.set(dvId, facets || {});
  saveSemCache();
  // 🔁 Forzamos notify para que la UI re-renderice con facets ya aprendidas
  notify();
}

function wsSend(obj: any) {
  if (!socket || socket.readyState !== WebSocket.OPEN) return false;
  try {
    socket.send(JSON.stringify(obj));
    return true;
  } catch {
    return false;
  }
}

function sendSemAsk(dv: DatoVivo) {
  const dvId = dv?.id;
  if (!dvId) return;
  if (semGet(dvId)) return; // ✅ ya sabemos algo

  const reqId = `semreq_${Math.random().toString(36).slice(2)}`;
  const ask = {
    kind: "sem.dv.ask",
    id: reqId,
    payload: {
      // mandamos dv crudo: el otro nodo interpreta con su diccionario vivo
      dv,
      // “want” orienta pero NO obliga
      want: ["title", "subtitle", "image", "tag"],
      locale: "es",
      from: "feda@web",
    },
  };

  wsSend(ask);
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers base
// ─────────────────────────────────────────────────────────────────────────────
function mergeWorlds(incoming: DatoVivo[]): DatoVivo[] {
  const map = new Map<string, DatoVivo>();

  for (const w of worldsStore) {
    const key = (w.id as string) || JSON.stringify(w);
    map.set(key, w);
  }
  for (const w of incoming) {
    const key = (w.id as string) || JSON.stringify(w);
    map.set(key, w);
  }
  return Array.from(map.values());
}

function notify() {
  const snapshot = [...worldsStore];
  subscribers.forEach((fn) => {
    try {
      fn(snapshot);
    } catch (err) {
      console.error("[worlds.live] error en subscriber:", err);
    }
  });
}

function isWorldDato(d: DatoVivo): boolean {
  const kind = d.kind || d.with?.kind || d.attrs?.kind;
  const traits: string[] = Array.isArray(d.traits) ? d.traits : [];
  const ns = d.meta?.ns || d.ns;

  // Territorios / espacios vivos MT
  const isMtTerritorio =
    kind === "territorio" ||
    traits.includes("mt:territorio") ||
    traits.includes("mt:espacio-vivo");

  // Cualquier ns de “worlds:*” también lo consideramos mundo
  const isWorldNs = typeof ns === "string" && ns.startsWith("worlds:");

  if (isMtTerritorio) return true;
  if (isWorldNs) return true;
  return false;
}

function hydrateFromLocalStorage() {
  try {
    const raw = window.localStorage.getItem("utopy:worlds");
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const onlyWorlds = parsed.filter(isWorldDato);
      if (onlyWorlds.length > 0) {
        worldsStore = mergeWorlds(onlyWorlds);
        notify();
      }
    }
  } catch (err) {
    console.warn("[worlds.live] error leyendo localStorage:", err);
  }
}

function persistToLocalStorage() {
  try {
    window.localStorage.setItem("utopy:worlds", JSON.stringify(worldsStore));
  } catch (err) {
    console.warn("[worlds.live] error escribiendo localStorage:", err);
  }
}

function extractDatosFromMessage(raw: any): DatoVivo[] {
  if (!raw) return [];

  // debug
  console.log("[worlds.live] raw message:", raw);

  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.items)) return raw.items;
  if (raw.dato) return [raw.dato];
  if (Array.isArray(raw.data)) return raw.data;

  if (raw.ack && typeof raw.echo === "string") {
    try {
      const parsedEcho = JSON.parse(raw.echo);
      return [parsedEcho];
    } catch (err) {
      console.warn("[worlds.live] no se pudo parsear raw.echo:", err);
      return [];
    }
  }

  if (raw.kind && raw.attrs) return [raw as DatoVivo];

  return [];
}

// ─────────────────────────────────────────────────────────────────────────────
// WebSocket
// ─────────────────────────────────────────────────────────────────────────────
function ensureSocket() {
  if (socket) return;

  // caches locales
  if (semCache.size === 0) loadSemCache();

  try {
    console.log("[worlds.live] conectando WS a:", DEFAULT_WS_URL);
    socket = new WebSocket(DEFAULT_WS_URL);

    socket.addEventListener("open", () => {
      console.log("[worlds.live] WS abierto");

      // hello al seed
      const hello = {
        kind: "app",
        id: "feda@web",
        attrs: { name: "Feda" },
        meta: { platform: "web", env: "prod" },
        auth: "utopy-resonancia",
      };

      try {
        socket?.send(JSON.stringify(hello));
        console.log("[worlds.live] hello enviado:", hello);
      } catch (err) {
        console.error("[worlds.live] error enviando hello:", err);
      }
    });

    socket.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data);

        // ✅ 1) Respuesta semántica (no es DV; es “interpretación”)
        if (data?.kind === "sem.dv.answer") {
          const p = (data?.payload || data) as SemAnswerPayload;
          const dvId = String(p?.id || data?.id || "");
          const facets = (p?.facets || {}) as SemFacets;
          if (dvId) {
            console.log("[worlds.live] sem.dv.answer recibido:", dvId, facets);
            semPut(dvId, facets);
          }
          return;
        }

        // 2) DVs normales
        const nuevos = extractDatosFromMessage(data);
        if (!nuevos.length) return;

        const soloMundos = nuevos.filter(isWorldDato);
        if (!soloMundos.length) return;

        console.log("[worlds.live] mundos/territorios vivos recibidos:", soloMundos);

        // ✅ pedir semántica si falta (por cada DV)
        for (const dv of soloMundos) {
          if (dv?.id && !semGet(dv.id)) sendSemAsk(dv);
        }

        worldsStore = mergeWorlds(soloMundos);
        persistToLocalStorage();
        notify();
      } catch (err) {
        console.warn("[worlds.live] error parseando mensaje:", err);
      }
    });

    socket.addEventListener("close", () => {
      console.warn("[worlds.live] WS cerrado, reintentando conexión en 3s...");
      socket = null;
      setTimeout(ensureSocket, 3000);
    });

    socket.addEventListener("error", (err) => {
      console.error("[worlds.live] WS error:", err);
    });
  } catch (err) {
    console.error("[worlds.live] no se pudo abrir WS:", err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// API pública
// ─────────────────────────────────────────────────────────────────────────────
export function worldsLiveSubscribe(callback: (all: DatoVivo[]) => void): () => void {
  if (!worldsStore.length) {
    hydrateFromLocalStorage();
  }

  ensureSocket();

  subscribers.push(callback);

  if (worldsStore.length) {
    callback([...worldsStore]);
  }

  return () => {
    subscribers = subscribers.filter((fn) => fn !== callback);
  };
}

// ✅ Export opcional: para que tu UI pueda resolver “facets” por DV id
export function semFacetsFor(dvId?: string) {
  return semGet(dvId);
}
