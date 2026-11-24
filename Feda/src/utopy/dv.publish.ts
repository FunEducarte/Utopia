export type DatoVivo = {
  id?: string;
  kind?: string;
  attrs?: Record<string, any>;
  traits?: string[];
  labels?: string[];
  meta?: {
    ns?: string;
    scopes?: string[];
    ts?: number;
    scope?: string;
    [k: string]: any;
  };
  auth?: any;
  [k: string]: any;
};

type PublishMode = "RAW" | "EVENT";

type PublishOpts = {
  worldId?: string | number | null;
  scopes?: string[];       // extra scopes (además de los defaults)
  ns?: string;             // override ns
  mode?: PublishMode;      // override mode
};

// ---------------------------------------
// env
// ---------------------------------------
const DEFAULT_WS_URL =
  (import.meta as any)?.env?.VITE_SEED_WS ||
  (globalThis as any)?.process?.env?.VITE_SEED_WS ||
  "wss://seed.mterra.space/utopy?ns=mt&client=feda-web";

const DEFAULT_MODE: PublishMode =
  ((import.meta as any)?.env?.VITE_DV_PUBLISH_MODE as PublishMode) ||
  ((globalThis as any)?.process?.env?.VITE_DV_PUBLISH_MODE as PublishMode) ||
  "RAW";

// ✅ opcional: cuando cierres el seed, vas a usar token
const DEFAULT_TOKEN =
  (import.meta as any)?.env?.VITE_SEED_TOKEN ||
  (globalThis as any)?.process?.env?.VITE_SEED_TOKEN ||
  "";

// --------------------------------------------------
// socket state
// --------------------------------------------------
let socket: WebSocket | null = null;
let opening: Promise<WebSocket> | null = null;
let reconnectTimer: any = null;

const queue: any[] = [];
const MAX_QUEUE = 500;

// backoff simple
let backoffMs = 600;
const MAX_BACKOFF = 8000;

function now() {
  return Date.now();
}

function safeSend(ws: WebSocket, obj: any) {
  ws.send(JSON.stringify(obj));
}

function enqueue(obj: any) {
  queue.push(obj);
  while (queue.length > MAX_QUEUE) queue.shift();
}

function flushQueue(ws: WebSocket) {
  while (queue.length) {
    const m = queue.shift();
    try {
      safeSend(ws, m);
    } catch {
      enqueue(m);
      break;
    }
  }
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    openSocket().catch(() => {});
  }, backoffMs);

  backoffMs = Math.min(MAX_BACKOFF, Math.floor(backoffMs * 1.6));
}

function resetBackoff() {
  backoffMs = 600;
}

// --------------------------------------------------
// open socket
// --------------------------------------------------
function openSocket(): Promise<WebSocket> {
  if (socket && socket.readyState === WebSocket.OPEN) return Promise.resolve(socket);
  if (opening) return opening;

  opening = new Promise((resolve, reject) => {
    try {
      const ws = new WebSocket(DEFAULT_WS_URL);

      ws.addEventListener("open", () => {
        socket = ws;
        opening = null;
        resetBackoff();

        // hello (igual estilo worlds.live)
        const hello = {
          kind: "app",
          id: "feda@web",
          attrs: { name: "Feda" },
          meta: { platform: "web", ts: now() },
          // ✅ si existe token, lo mandamos
          auth: DEFAULT_TOKEN ? { token: DEFAULT_TOKEN } : "utopy-resonancia",
        };

        try {
          safeSend(ws, hello);
        } catch {}

        try {
          flushQueue(ws);
        } catch {}

        resolve(ws);
      });

      ws.addEventListener("error", (e) => {
        opening = null;
        scheduleReconnect();
        reject(e);
      });

      ws.addEventListener("close", () => {
        socket = null;
        opening = null;
        scheduleReconnect();
      });
    } catch (e) {
      opening = null;
      scheduleReconnect();
      reject(e);
    }
  });

  return opening;
}

// --------------------------------------------------
// helpers: scopes defaults
// --------------------------------------------------
function uniq(a: string[]) {
  return Array.from(new Set(a.map(String).filter(Boolean)));
}

function normalizeWorldId(v: any): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s ? s : null;
}

// --------------------------------------------------
// public API
// --------------------------------------------------
export async function publishDatoVivo(dv: DatoVivo, opts: PublishOpts = {}) {
  const mode = opts.mode || DEFAULT_MODE;

  // ✅ worldId: prioridad opts.worldId, si no dv.attrs.worldId
  const wid = normalizeWorldId(opts.worldId ?? dv?.attrs?.worldId);

  // ✅ asegurar attrs/worldId (clave para que el Main lo vea)
  dv.attrs = { ...(dv.attrs || {}) };
  if (wid) dv.attrs.worldId = wid;

  // ✅ scopes base
  const baseScopes = ["public", "mt:feda"];
  if (wid) baseScopes.push(`world:${wid}`);

  // ✅ merge scopes
  const mergedScopes = uniq([
    ...(dv?.meta?.scopes || []),
    ...baseScopes,
    ...(opts.scopes || []),
  ]);

  // defaults meta.ts + ns/scopes
  dv.meta = {
    ...(dv.meta || {}),
    ts: dv?.meta?.ts || now(),
    ns: opts.ns || dv?.meta?.ns || "mt:feda",
    scopes: mergedScopes,
  };

  // auth (si viene ya en dv, se respeta)
  if (dv.auth == null) {
    dv.auth = DEFAULT_TOKEN ? { token: DEFAULT_TOKEN } : "utopy-resonancia";
  }

  // payload según modo
  const payload =
    mode === "EVENT"
      ? { kind: "dato.create", payload: dv, meta: dv.meta, auth: dv.auth }
      : dv;

  try {
    const ws = await openSocket();
    if (ws.readyState === WebSocket.OPEN) {
      safeSend(ws, payload);
      return;
    }
    enqueue(payload);
  } catch {
    enqueue(payload);
  }
}

// Opcional: cerrar manualmente (hot reload)
export function closeDatoVivoSocket() {
  try {
    socket?.close();
  } catch {}
  socket = null;
  opening = null;
}
