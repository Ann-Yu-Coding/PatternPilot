import { emptyHistory, type History, type Attempt } from "./practice-history";
export const HISTORY_KEY = "pp-history-v1";
let fallback: History = emptyHistory();
export function readHistory(): History {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return fallback;
    const value = JSON.parse(raw);
    if (
      !Array.isArray(value.attempts) ||
      !value.cleared ||
      typeof value.cleared !== "object"
    )
      return fallback;
    const attempts = value.attempts.filter(
      (a: Attempt) =>
        a &&
        typeof a.id === "string" &&
        typeof a.passageId === "string" &&
        typeof a.title === "string" &&
        Number.isFinite(a.timestamp) &&
        Number.isFinite(a.score) &&
        Number.isFinite(a.total) &&
        Number.isFinite(a.elapsed) &&
        Array.isArray(a.misses) &&
        a.misses.every(
          (m) =>
            m &&
            typeof m.blankId === "string" &&
            typeof m.errorCategory === "string" &&
            typeof m.passageId === "string" &&
            Number.isFinite(m.timestamp),
        ),
    );
    const cleared = Object.fromEntries(
      Object.entries(value.cleared).filter(
        ([, v]) => typeof v === "number" && Number.isFinite(v),
      ),
    );
    fallback = { attempts, cleared: cleared as Record<string, number> };
    return fallback;
  } catch {
    return fallback;
  }
}
export function saveHistory(history: History): boolean {
  fallback = history;
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    window.dispatchEvent(new Event("pp-history-change"));
    return true;
  } catch {
    return false;
  }
}
