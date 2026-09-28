import { FREE_PASSAGE_LIMIT, SEEDED_PASSAGE_ORDER } from "./product-config";
import { latestPassages, type History } from "./practice-history";
export function remainingFree(history: History): number { return Math.max(0, FREE_PASSAGE_LIMIT - latestPassages(history).length); }
export function canOpenPassage(history: History, id: string): boolean { return remainingFree(history)>0 || latestPassages(history).some(a=>a.passageId===id); }
export function nextPassageId(history: History, available=SEEDED_PASSAGE_ORDER): string | undefined {
  const done=new Set(latestPassages(history).map(a=>a.passageId));
  return SEEDED_PASSAGE_ORDER.find(id=>available.includes(id) && !done.has(id));
}
