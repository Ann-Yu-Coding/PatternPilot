import {
  latestPassages,
  type History,
  type DrillLog,
} from "./practice-history";
export const drillPercent = (d: DrillLog) =>
  Math.round((100 * d.score) / d.total);
export type ProgressPattern = {
  category: string;
  status: "Pattern" | "Possible pattern" | "Cleared";
  count: number;
  passages: number;
  recent: number;
  drills: DrillLog[];
};
export function progressSummary(history: History) {
  const passages = latestPassages(history);
  const total = passages.reduce((n, a) => n + a.total, 0);
  return {
    passages,
    accuracy: total
      ? Math.round((100 * passages.reduce((n, a) => n + a.score, 0)) / total)
      : 0,
    drills: (history.drills || []).length,
  };
}
export function progressPatterns(history: History): ProgressPattern[] {
  const window = latestPassages(history).slice(0, 5);
  const categories = new Set([
    ...window.flatMap((a) => a.misses.map((m) => m.errorCategory)),
    ...(history.drills || []).map((d) => d.category),
  ]);
  const rows: ProgressPattern[] = [];
  for (const category of categories) {
    const drills = (history.drills || [])
      .filter((d) => d.category === category)
      .sort((a, b) => a.timestamp - b.timestamp);
    const active = window.flatMap((a) =>
      a.misses.filter(
        (m) =>
          m.errorCategory === category &&
          !history.cleared[`${a.id}:${m.blankId}`],
      ),
    );
    if (active.length) {
      rows.push({
        category,
        status: active.length >= 2 ? "Pattern" : "Possible pattern",
        count: active.length,
        passages: new Set(active.map((m) => m.passageId)).size,
        recent: Math.max(...active.map((m) => m.timestamp)),
        drills,
      });
      continue;
    }
    const perfects = drills
      .filter((d) => d.score === 5 && d.total === 5)
      .reverse();
    for (const perfect of perfects) {
      if (
        history.attempts.some((a) =>
          a.misses.some(
            (m) =>
              m.errorCategory === category && m.timestamp > perfect.timestamp,
          ),
        )
      )
        break;
      // Reconstruct the evidence actually cleared at that time. A later perfect
      // drill with no remaining evidence must not erase the earlier achievement.
      const priorWindow = latestPassages({
        ...history,
        attempts: history.attempts.filter(
          (a) => a.timestamp <= perfect.timestamp,
        ),
      }).slice(0, 5);
      const cleared = priorWindow.flatMap((a) =>
        a.misses.filter(
          (m) =>
            m.errorCategory === category &&
            history.cleared[`${a.id}:${m.blankId}`],
        ),
      );
      if (!cleared.length) continue;
      rows.push({
        category,
        status: "Cleared",
        count: cleared.length,
        passages: new Set(cleared.map((m) => m.passageId)).size,
        recent: perfect.timestamp,
        drills,
      });
      break;
    }
  }
  const rank = { Pattern: 0, "Possible pattern": 1, Cleared: 2 };
  return rows.sort(
    (a, b) =>
      rank[a.status] - rank[b.status] ||
      b.count - a.count ||
      b.recent - a.recent ||
      a.category.localeCompare(b.category),
  );
}
