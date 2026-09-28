import { categoryLabel } from "./learner-review";
export type Miss = {
  blankId: string;
  errorCategory: string;
  passageId: string;
  timestamp: number;
};
export type Attempt = {
  id: string;
  passageId: string;
  title: string;
  timestamp: number;
  score: number;
  total: number;
  elapsed: number;
  misses: Miss[];
};
export type History = { attempts: Attempt[]; cleared: Record<string, number> };
export const emptyHistory = (): History => ({ attempts: [], cleared: {} });
export function latestPassages(history: History): Attempt[] {
  const seen = new Set<string>();
  return [...history.attempts]
    .sort((a, b) => b.timestamp - a.timestamp)
    .filter((a) => {
      if (seen.has(a.passageId)) return false;
      seen.add(a.passageId);
      return true;
    });
}
export function recordAttempt(history: History, attempt: Attempt): History {
  return {
    ...history,
    attempts: [...history.attempts.filter((a) => a.id !== attempt.id), attempt],
  };
}
export function clearCategory(
  history: History,
  category: string,
  through: number,
): History {
  return {
    ...history,
    cleared: {
      ...history.cleared,
      [category]: Math.max(history.cleared[category] || 0, through),
    },
  };
}
export function missCategory(item: {
  submitted: string;
  errorCategory: string;
}): string {
  return !item.submitted.trim()
    ? "Skipped / time pressure"
    : categoryLabel(item.errorCategory);
}
export type Pattern = {
  category: string;
  count: number;
  totalMisses: number;
  passages: number;
  possible: boolean;
  evidence: string;
};
export function findPattern(
  history: History,
  currentId?: string,
): Pattern | null {
  const window = latestPassages(history).slice(0, 5);
  const current = currentId
    ? history.attempts.find((a) => a.id === currentId)
    : window[0];
  if (!current || current.score === current.total) return null;
  const active = (a: Attempt) =>
    a.misses.filter(
      (m) => m.timestamp > (history.cleared[m.errorCategory] || 0),
    );
  const groups = new Map<
    string,
    { count: number; weight: number; recent: number; passages: Set<string> }
  >();
  let totalMisses = 0;
  window.forEach((a, index) =>
    active(a).forEach((m) => {
      totalMisses++;
      const g = groups.get(m.errorCategory) || {
        count: 0,
        weight: 0,
        recent: 0,
        passages: new Set<string>(),
      };
      g.count++;
      g.weight += 5 - index;
      g.recent = Math.max(g.recent, m.timestamp);
      g.passages.add(a.passageId);
      groups.set(m.errorCategory, g);
    }),
  );
  const ranked = [...groups].sort(
    (a, b) =>
      b[1].count - a[1].count ||
      b[1].weight - a[1].weight ||
      b[1].recent - a[1].recent ||
      a[0].localeCompare(b[0]),
  );
  let chosen = ranked.find(([, g]) => g.count >= 2);
  const possible = !chosen;
  if (!chosen) {
    const categories = new Set(active(current).map((m) => m.errorCategory));
    chosen = ranked
      .filter(([category]) => categories.has(category))
      .sort(
        (a, b) =>
          b[1].count - a[1].count ||
          b[1].recent - a[1].recent ||
          a[0].localeCompare(b[0]),
      )[0];
  }
  if (!chosen) return null;
  const [category, g] = chosen;
  return {
    category,
    count: g.count,
    totalMisses,
    passages: g.passages.size,
    possible,
    evidence: possible
      ? "Seen once so far · one more makes it a pattern"
      : `${g.count} of your last ${totalMisses} mistakes · across ${g.passages.size} ${g.passages.size === 1 ? "passage" : "passages"}`,
  };
}
export const drillForCategory: Record<string, string> = {
  "Word form": "noun-formation",
  "Grammar ending": "verb-inflection",
  Spelling: "spelling",
  "Meaning / context": "contextual-prediction",
  Vocabulary: "academic-vocabulary",
  "Vocabulary gap": "academic-vocabulary",
  "academic vocabulary": "academic-vocabulary",
  "Skipped / time pressure": "contextual-prediction",
};
export const feedbackForCategory: Record<string, string> = {
  "Word form": "Use the words around the gap to choose the word’s form.",
  "Grammar ending": "Check who does the action and when it happens.",
  Spelling: "Check the letters where the beginning meets the ending.",
  "Meaning / context": "Read the whole sentence before choosing the word.",
  "Skipped / time pressure":
    "Try the surrounding sentence when a word holds you up.",
};
