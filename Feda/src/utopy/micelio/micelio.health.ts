export type HealthSignal = {
  nodeId: string;
  ns: string;
  scope: string;
  at: number;
  load?: number;
};

export class HealthTracker {
  private lastSeen = new Map<string, number>();

  mark(h: HealthSignal) {
    this.lastSeen.set(h.nodeId, h.at);
  }

  isAlive(nodeId: string, ttlMs = 45_000) {
    const t = this.lastSeen.get(nodeId);
    return t != null && Date.now() - t < ttlMs;
  }

  aliveNodes(ttlMs = 45_000) {
    const now = Date.now();
    return Array.from(this.lastSeen.entries())
      .filter(([, t]) => now - t < ttlMs)
      .map(([id]) => id);
  }
}
