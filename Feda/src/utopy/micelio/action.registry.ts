import { DV } from "./types.js";
import { MicelioStore } from "./micelio.store.js";

export type ActionCtx = {
  store: MicelioStore;
  say: (kind: string, payload: any, meta?: any) => void;
  ns: string;
  scope: string;
  me: string;
};

export type ActionHandlerResult = { ok: boolean; effects?: any };

// 🚫 "with" es keyword → usamos input
export type ActionHandler = (
  dv: DV,
  ctx: ActionCtx,
  input?: any
) => Promise<ActionHandlerResult>;

export const ActionRegistry: Record<string, ActionHandler> = {
  "ui.open": async (dv: DV): Promise<ActionHandlerResult> => {
    // no-op en servicio (la UI lo hace)
    return { ok: true, effects: { opened: dv.id } };
  },

  "market.cart.add": async (dv: DV, ctx: ActionCtx): Promise<ActionHandlerResult> => {
    ctx.say(
      "mt:nodo.accion",
      { id: dv.id, kind: dv.kind, action: "cart.add", attrs: dv.attrs },
      { ns: ctx.ns, scope: ctx.scope }
    );
    return { ok: true, effects: { added: dv.id } };
  },

  "stock.update": async (dv: DV, ctx: ActionCtx, input?: any): Promise<ActionHandlerResult> => {
    ctx.say(
      "mt:nodo.accion",
      { id: dv.id, kind: dv.kind, action: "stock.update", patch: input || {} },
      { ns: ctx.ns, scope: ctx.scope }
    );
    return { ok: true, effects: { patched: input || {} } };
  },

  "dv.create.child": async (dv: DV, ctx: ActionCtx, input?: any): Promise<ActionHandlerResult> => {
    const childKind = input?.childKind || "espacio";

    const child: DV = {
      id: `utopi:${childKind}:${Date.now()}:${Math.random().toString(36).slice(2)}`,
      kind: childKind,
      attrs: {
        nombre: input?.name || `${childKind} de ${dv.attrs?.nombre || dv.id}`,
        parentId: dv.id,
      },
      traits: ["mt:espacio-vivo", "mt:local"],
      meta: { ns: ctx.ns, scope: ctx.scope, ts: Date.now() },
    };

    ctx.store.upsertDV(child);
    ctx.say("dato.create", child, { ns: ctx.ns, scope: ctx.scope });

    return { ok: true, effects: { created: child.id } };
  },
};
