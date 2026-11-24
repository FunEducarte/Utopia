export type DV = {
  id: string;
  kind: string;
  attrs?: Record<string, any>;
  traits?: string[];
  labels?: string[];
  meta?: {
    ns?: string;
    scope?: string;
    scopes?: string[];
    ts?: number;
    [k: string]: any;
  };
  [k: string]: any;
};

export type SemAsk = {
  id?: string;
  kind: "sem.dv.ask";
  payload: {
    who?: string;
    id?: string;
    dv?: DV;
    ns?: string;
    scope?: string;
    scopes?: string[];
    want?: string[]; // opcional: facets específicas
  };
  meta?: any;
};

export type SemAnswer = {
  id?: string;
  kind: "sem.dv.answer";
  payload: {
    who?: string;
    id: string;
    facets: Record<string, any>;
    confidence?: number;
    ref?: string;
  };
  meta?: any;
};

export type SemOutcome = {
  id?: string;
  kind: "sem.dv.outcome";
  payload: {
    id: string;                 // dvId
    action?: string;            // acción ejecutada
    result?: "ok" | "fail";
    effects?: any;
    confidence?: number;
    ref?: string;
    chainId?: string;
    stepId?: string;
  };
  meta?: any;
};

export type AnyMsg = DV | SemAsk | SemAnswer | SemOutcome | Record<string, any>;
