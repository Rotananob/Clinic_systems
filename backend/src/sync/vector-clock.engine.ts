export type ClockComparisonResult = 'BEFORE' | 'AFTER' | 'EQUAL' | 'CONCURRENT';

export class VectorClockEngine {
  /**
   * Increment local clock component
   */
  static increment(clock: Record<string, number>, nodeId: string): Record<string, number> {
    const updated = { ...clock };
    updated[nodeId] = (updated[nodeId] || 0) + 1;
    return updated;
  }

  /**
   * Merge two vector clocks taking the maximum value for each node
   */
  static merge(
    clockA: Record<string, number>,
    clockB: Record<string, number>,
  ): Record<string, number> {
    const merged: Record<string, number> = { ...clockA };
    for (const [nodeId, count] of Object.entries(clockB)) {
      merged[nodeId] = Math.max(merged[nodeId] || 0, count);
    }
    return merged;
  }

  /**
   * Compare two vector clocks
   * Returns:
   *  - 'BEFORE' if clockA < clockB (clockA causally preceded clockB)
   *  - 'AFTER' if clockA > clockB (clockA causally succeeded clockB)
   *  - 'EQUAL' if clockA == clockB
   *  - 'CONCURRENT' if clockA and clockB conflict concurrently
   */
  static compare(
    clockA: Record<string, number>,
    clockB: Record<string, number>,
  ): ClockComparisonResult {
    let aHasGreater = false;
    let bHasGreater = false;

    const allKeys = new Set([...Object.keys(clockA), ...Object.keys(clockB)]);

    for (const key of allKeys) {
      const valA = clockA[key] || 0;
      const valB = clockB[key] || 0;

      if (valA > valB) aHasGreater = true;
      if (valB > valA) bHasGreater = true;
    }

    if (aHasGreater && !bHasGreater) return 'AFTER';
    if (!aHasGreater && bHasGreater) return 'BEFORE';
    if (!aHasGreater && !bHasGreater) return 'EQUAL';
    return 'CONCURRENT';
  }

  /**
   * Evaluates if clockA is causally dominated by or equal to clockB
   */
  static isDominatedBy(clockA: Record<string, number>, clockB: Record<string, number>): boolean {
    const res = this.compare(clockA, clockB);
    return res === 'BEFORE' || res === 'EQUAL';
  }

  /**
   * Clone clock record
   */
  static clone(clock: Record<string, number>): Record<string, number> {
    return { ...clock };
  }
}
