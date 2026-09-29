import type { PracticeSet, PracticeResult } from "@workspace/api-client-react";
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
  topic?: string;
  review?: { set: PracticeSet; result: PracticeResult; elapsed: number };
  timestamp: number;
  score: number;
  total: number;
  elapsed: number;
  misses: Miss[];
};
export type DrillLog = {
  category: string;
  score: number;
  total: number;
  timestamp: number;
};
export type History = {
  attempts: Attempt[];
  cleared: Record<string, number>;
  drills?: DrillLog[];
};
export const emptyHistory = (): History => ({
  attempts: [],
  cleared: {},
  drills: [],
});
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
export function clearCategory(history: History, category: string): History {
  const cleared = { ...history.cleared };
  latestPassages(history)
    .slice(0, 5)
    .forEach((a) =>
      a.misses.forEach((m) => {
        if (m.errorCategory === category) cleared[`${a.id}:${m.blankId}`] = 1;
      }),
    );
  return { ...history, cleared };
}
export function finishDrill(
  history: History,
  category: string,
  score: number,
  total: number,
  timestamp = Date.now(),
): History {
  const next = {
    ...history,
    drills: [...(history.drills || []), { category, score, total, timestamp }],
  };
  return score === 5 && total === 5 ? clearCategory(next, category) : next;
}
export function missCategory(item: {
  missCategory?: string | null;
}): string | null {
  return item.missCategory ?? null;
}
export type Pattern = {
  category: string;
  count: number;
  totalMisses: number;
  passages: number;
  possible: boolean;
  evidence: string;
};
export function findPatterns(history: History, currentId?: string): Pattern[] {
  const window = latestPassages(history).slice(0, 5);
  const current = currentId
    ? history.attempts.find((a) => a.id === currentId)
    : window[0];
  if (!current || current.score === current.total) return [];
  const active = (a: Attempt) =>
    a.misses.filter((m) => !history.cleared[`${a.id}:${m.blankId}`]);
  const groups = new Map<
    string,
    { count: number; recent: number; passages: Set<string> }
  >();
  let totalMisses = 0;
  window.forEach((a) =>
    active(a).forEach((m) => {
      totalMisses++;
      const g = groups.get(m.errorCategory) || {
        count: 0,
        recent: 0,
        passages: new Set<string>(),
      };
      g.count++;
      g.recent = Math.max(g.recent, m.timestamp);
      g.passages.add(a.passageId);
      groups.set(m.errorCategory, g);
    }),
  );
  const ranked = [...groups].sort(
    (a, b) =>
      b[1].count - a[1].count ||
      b[1].recent - a[1].recent ||
      a[0].localeCompare(b[0]),
  );
  const qualifying = ranked.filter(([, g]) => g.count >= 2).slice(0, 2);
  const chosen = qualifying.length ? qualifying : ranked.slice(0, 1);
  return chosen.map(([category, g]) => ({
    category,
    count: g.count,
    totalMisses,
    passages: g.passages.size,
    possible: !qualifying.length,
    evidence: `${g.count} similar ${g.count === 1 ? "miss" : "misses"} · across ${g.passages.size} ${g.passages.size === 1 ? "passage" : "passages"}`,
  }));
}
// Compatibility helper for summaries that have room for only the first pattern.
export function findPattern(
  history: History,
  currentId?: string,
): Pattern | null {
  return findPatterns(history, currentId)[0] || null;
}

export const drillForCategory: Record<string, string> = {
  "Word form": "noun-formation",
  "Grammar ending": "verb-inflection",
  Spelling: "spelling",
  "Context / meaning": "contextual-prediction",
  "Word retrieval": "academic-vocabulary",
};
export const feedbackForCategory: Record<string, string> = {
  "Word form": "Use the words around the gap to choose the word’s form.",
  "Grammar ending": "Check who does the action and when it happens.",
  Spelling: "Check the letters where the beginning meets the ending.",
  "Context / meaning": "Read the whole sentence before choosing the word.",
  "Word retrieval": "Try the surrounding sentence when a word holds you up.",
};
