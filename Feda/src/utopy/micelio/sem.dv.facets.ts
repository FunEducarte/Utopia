import { DV } from "./types.js";

export function facetsFromDV(dv: DV): Record<string, any> {
  const attrs = dv.attrs || {};
  const traits = dv.traits || [];
  const kind = (dv.kind || "").toLowerCase();

  const name =
    attrs.nombre || attrs.name || attrs.titulo || attrs.title || dv.labels?.[0] || dv.id;

  const desc =
    attrs.descripcion || attrs.description || attrs.detalle || "";

  const media = attrs.media || {};
  const image = media.image || attrs.image || null;
  const model3d = media.model3d || attrs.model3d || null;

  // heurística de “tipo”
  const type =
    traits.includes("mt:territorio") || kind === "territorio" ? "territorio" :
    traits.includes("mt:org") || kind === "org" ? "org" :
    traits.includes("mt:producto") || kind === "producto" ? "producto" :
    "dv";

  // acciones sugeridas (base)
  const actions: Array<{ id: string; label: string; kind: string; with?: any }> = [];

  if (type === "territorio") {
    actions.push(
      { id: "abrir", label: "Abrir / Ver", kind: "ui.open" },
      { id: "crear_espacio", label: "Crear espacio vivo", kind: "dv.create.child", with: { childKind: "espacio" } },
    );
  }
  if (type === "producto") {
    actions.push(
      { id: "agregar_carrito", label: "Agregar al carrito", kind: "market.cart.add" },
      { id: "actualizar_stock", label: "Actualizar stock", kind: "stock.update" },
    );
  }
  if (type === "org") {
    actions.push(
      { id: "contactar", label: "Contactar", kind: "org.contact" },
      { id: "recibir", label: "Recibir en hub", kind: "hub.receive" },
    );
  }

  return {
    ui: {
      title: name,
      description: desc,
      image,
      model3d,
      type,
    },
    actions,
    // “facets” extra que te sirven en tu UniversalPortal
    geo: attrs.geo || attrs.ubicacion?.geo || attrs.location || null,
    price: attrs.precio ?? null,
    stock: attrs.stock ?? null,
  };
}
    