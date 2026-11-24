// File: src/utopy/facetsFromDV.ts
export type Facets = Record<string, any>;

export function facetsFromDV(dv: any): Facets {
  const attrs = dv?.attrs || dv?.with?.attrs || {};
  const labels = Array.isArray(dv?.labels) ? dv.labels : [];
  const media = attrs?.media || {};
  const geo = attrs?.geo || attrs?.ubicacion?.geo || attrs?.location || attrs?.ubicacion || {};

  const title =
    labels?.[0] ||
    attrs?.nombre ||
    attrs?.name ||
    attrs?.titulo ||
    attrs?.title ||
    dv?.name ||
    dv?.kind ||
    "DatoVivo";

  const description =
    attrs?.descripcion ||
    attrs?.description ||
    dv?.description ||
    "";

  const icon =
    media?.image ||
    attrs?.icon ||
    dv?.icon ||
    "";

  return {
    title,
    description,
    icon,
    kind: dv?.kind,
    traits: dv?.traits || dv?.with?.traits || [],
    ns: dv?.meta?.ns || dv?.with?.meta?.ns || dv?.ns || "",
    geo,
  };
}
