export function adaptDatoToWorld(d: any) {
  if (!d) return null;

  // --------- Territorios / espacios vivos MT ---------
  if (
    d.kind === "territorio" ||
    (Array.isArray(d.traits) && d.traits.includes("mt:territorio"))
  ) {
    return {
      id: d.id,
      kind: "territorio",
      title: d.attrs?.nombre || d.attrs?.name || "Territorio sin título",
      description: d.attrs?.descripcion || "Sin descripción",
      icon: d.attrs?.media?.image || null,
      raw: d
    };
  }

  // --------- Mundos creados en FEDA ---------
  if (d.kind === "world" || d.kind === "utopy-world" || d.tokenName) {
    return {
      id: d.id,
      kind: "world",
      title: d.name || d.projectTitle || "Mundo sin título",
      description: d.description || "Sin descripción",
      icon: d.icon || null,
      raw: d
    };
  }

  // Otros tipos si quieres…
  return null;
}
