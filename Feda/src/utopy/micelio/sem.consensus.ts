import { TrustStore } from "./trustsimple.js";

export type SemAnswer = {
  from: string;
  facets: any;
};

export class SemConsensus {
  constructor(private trust: TrustStore) {}

  decide(answers: SemAnswer[]) {
    if (!answers.length) return null;

    // mayoría + desempate por trust
    const byFacet = new Map<string, SemAnswer[]>();

    for (const a of answers) {
      const key = JSON.stringify(a.facets);
      const arr = byFacet.get(key) ?? [];
      arr.push(a);
      byFacet.set(key, arr);
    }

    const ranked = [...byFacet.entries()].sort((a, b) => {
      if (b[1].length !== a[1].length)
        return b[1].length - a[1].length;

      const ta = a[1].reduce((s, x) => s + this.trust.get(x.from), 0);
      const tb = b[1].reduce((s, x) => s + this.trust.get(x.from), 0);
      return tb - ta;
    });

    return JSON.parse(ranked[0][0]);
  }
}
