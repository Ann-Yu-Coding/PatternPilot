import legacy from "../data/legacy-seed-morphology.json";
import type { Blank } from "../data/patternpilot";
export function seedMorphologyUpgrade(stored: Blank, target: Blank) {
  const original = legacy[stored.id as keyof typeof legacy];
  if (
    !original ||
    stored.fullWord !== target.fullWord ||
    stored.prefix !== target.prefix ||
    stored.answer !== target.answer
  )
    return null;
  if (
    !Object.entries(original).every(
      ([key, value]) => (stored[key as keyof Blank] ?? "") === value,
    )
  )
    return null;
  const { lemma, partOfSpeech, wordFamily, root, suffix } = target;
  return {
    lemma,
    partOfSpeech,
    wordFamily,
    root,
    suffix,
    linguisticPrefix: target.linguisticPrefix ?? "",
  };
}
