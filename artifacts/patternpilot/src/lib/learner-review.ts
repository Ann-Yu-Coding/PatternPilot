/** Find the changed middle while retaining matching letters on both sides. */
export function wordChange(submitted: string, correct: string) {
  let start = 0;
  while (
    start < submitted.length &&
    start < correct.length &&
    submitted[start].toLowerCase() === correct[start].toLowerCase()
  )
    start++;
  let end = 0;
  while (
    end < submitted.length - start &&
    end < correct.length - start &&
    submitted[submitted.length - 1 - end].toLowerCase() ===
      correct[correct.length - 1 - end].toLowerCase()
  )
    end++;
  return {
    before: submitted.slice(0, start),
    wrong: submitted.slice(start, submitted.length - end),
    right: correct.slice(start, correct.length - end),
    after: end ? correct.slice(-end) : "",
  };
}

export function timeLabel(seconds: number) {
  const value = Math.max(0, Math.floor(seconds));
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, "0")}`;
}

// Display names only; diagnosis and grading remain server-owned.
export function categoryLabel(category: string) {
  const labels: Record<string, string> = {
    "word formation": "Word form",
    "noun ending": "Word form",
    "adjective ending": "Word form",
    "word family": "Word form",
    "verb tense / inflection": "Grammar ending",
    inflection: "Grammar ending",
    plural: "Grammar ending",
    spelling: "Spelling",
    vocabulary: "Word retrieval",
    "academic vocabulary": "Word retrieval",
    Vocabulary: "Word retrieval",
    "Vocabulary gap": "Word retrieval",
    "Skipped / time pressure": "Word retrieval",
    "Meaning / context": "Context / meaning",
    "contextual prediction": "Context / meaning",
  };
  return labels[category] || category;
}
