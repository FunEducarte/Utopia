type TrustState = {
  score: number;
  lastFail?: number;
};

export class TrustStore {
  private map = new Map<string, TrustState>();

  get(nodeId: string) {
    return this.map.get(nodeId)?.score ?? 0;
  }

  onHealth(nodeId: string) {
    const s = this.map.get(nodeId) ?? { score: 0 };
    s.score += 0.1;
    this.map.set(nodeId, s);
  }

  onOutcome(nodeId: string, ok: boolean) {
    const s = this.map.get(nodeId) ?? { score: 0 };
    if (ok) s.score += 1;
    else {
      s.score -= 2;
      s.lastFail = Date.now();
    }
    this.map.set(nodeId, s);
  }

  ranked(nodes: string[]) {
    return [...nodes].sort((a, b) => this.get(b) - this.get(a));
  }
}
