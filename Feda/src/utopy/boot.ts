// src/utopy/boot.ts
import { spore } from "./spore.singleton";

// ---------------------------------------------------------------------
// Resolución universal del WS_URL
// ---------------------------------------------------------------------
function resolveWsUrl(): string {
  // 1) Entornos tipo Vite (import.meta.env.VITE_UTOPY_WS)
  try {
    if (typeof import.meta !== "undefined") {
      const env = (import.meta as any).env;
      if (env && typeof env.VITE_UTOPY_WS === "string" && env.VITE_UTOPY_WS.length > 0) {
        return env.VITE_UTOPY_WS;
      }
    }
  } catch {
    // ignorar
  }

  // 2) Entornos Node / webpack que ponen process en globalThis
  try {
    const g: any = globalThis as any;
    const proc = g && g.process;
    if (proc && proc.env && typeof proc.env.UTOPY_WS === "string" && proc.env.UTOPY_WS.length > 0) {
      return proc.env.UTOPY_WS;
    }
  } catch {
    // ignorar
  }

  // 3) Fallback universal (web, RN, etc.)
  return "wss://seed.mterra.space/utopy";
}

const WS_URL = resolveWsUrl();

// ---------------------------------------------------------------------
// Boot universal sobre UtopySpore (distintas versiones)
// ---------------------------------------------------------------------
export async function bootUtopyWithWs() {
  const anySpore: any = spore as any;
  const ws = WS_URL;

  console.log("[UTOPY] Booting with WS:", ws);

  // Soportar varias versiones de UtopySpore:
  // - new UtopySpore().init({ ws, token }, { log })
  // - new UtopySpore().connectWs(ws, { token })
  // - new UtopySpore().connect(ws)
  if (typeof anySpore.init === "function") {
    await anySpore.init(
      { ws, token: "utopy-resonancia" },
      { log: true }
    );
  } else if (typeof anySpore.connectWs === "function") {
    await anySpore.connectWs(ws, { token: "utopy-resonancia", log: true });
  } else if (typeof anySpore.connect === "function") {
    await anySpore.connect(ws);
  } else {
    console.warn(
      "[UTOPY] Ningún método init/connectWs/connect encontrado en UtopySpore; usando instancia tal cual."
    );
  }

  console.log("[UTOPY] Spore boot OK");
}
