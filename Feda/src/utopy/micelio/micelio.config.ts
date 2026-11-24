// src/utopy/micelio/micelio.config.ts
const splitCSV = (s?: string) =>
  (s || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

function parseScopesFromSeedWs(seedWs?: string): string[] {
  try {
    if (!seedWs) return [];
    const u = new URL(seedWs);
    const qs = u.searchParams.get("scopes") || u.searchParams.get("scope") || "";
    return splitCSV(qs);
  } catch {
    return [];
  }
}

function parseNsFromSeedWs(seedWs?: string): string | undefined {
  try {
    if (!seedWs) return undefined;
    const u = new URL(seedWs);
    const ns = u.searchParams.get("ns");
    return ns || undefined;
  } catch {
    return undefined;
  }
}

function ensureScopes(scopes: string[]): string[] {
  const s = scopes.length ? scopes : ["public"];
  return Array.from(new Set(s.map(String)));
}

const seedWs =
  process.env.SEED_WS ||
  process.env.UTOPY_SEED_WS ||
  "wss://seed.mterra.space/utopy?ns=mt&scopes=public";

const ns =
  process.env.UTOPY_NS ||
  parseNsFromSeedWs(seedWs) ||
  "mt";

const scopes = ensureScopes(
  splitCSV(process.env.UTOPY_SCOPES).length
    ? splitCSV(process.env.UTOPY_SCOPES)
    : parseScopesFromSeedWs(seedWs)
);

export const MICELIO = {
  seedWs,
  ns,
  scopes,

  id: process.env.MICELIO_ID || "micelio@seed",

  httpPort: parseInt(process.env.MICELIO_HTTP_PORT || "8789", 10),

  dataDir: process.env.MICELIO_DATA_DIR || "./data/micelio",

  log: (process.env.MICELIO_LOG || "1") === "1",

  chainConcurrency: Math.max(
    1,
    parseInt(process.env.MICELIO_CHAIN_CONCURRENCY || "2", 10) || 2
  ),
} as const;
