import type { Blank } from "./patternpilot";

// Editorial feedback stays server-side and is returned only after submission.
const explanations: Record<string, { word: string; why: string }> = {
  "set-ecology__b1": {
    word: "independent",
    why: "“Independent trees” describes trees as separate individuals.",
  },
  "set-ecology__b2": {
    word: "exchange",
    why: "“Allow trees to exchange”: after “to”, the verb stays plain.",
  },
  "set-ecology__b3": {
    word: "support",
    why: "“Can support” takes the plain verb.",
  },
  "set-ecology__b4": {
    word: "resilience",
    why: "“Increases the” needs a noun here: resilience.",
  },
  "set-ecology__b5": {
    word: "recover",
    why: "“Recover after drought” means return to a healthy state.",
  },
  "set-ecology__b6": {
    word: "studying",
    why: "“Are now studying” describes an action in progress.",
  },
  "set-ecology__b7": {
    word: "growth",
    why: "“The growth” names the process of growing, so it needs a noun.",
  },
  "set-ecology__b8": {
    word: "survival",
    why: "“Growth and survival” pairs two nouns.",
  },
  "set-memory__b1": {
    word: "record",
    why: "“A fixed record” means an account of what happened.",
  },
  "set-memory__b2": {
    word: "recall",
    why: "“Each act of recall” means each time a memory is brought back.",
  },
  "set-memory__b3": {
    word: "general",
    why: "“General knowledge” is what people already know beyond one specific event.",
  },
  "set-memory__b4": {
    word: "flexible",
    why: "“Makes memories more flexible” describes memories that can change.",
  },
  "set-memory__b5": {
    word: "vulnerable",
    why: "“Vulnerable to suggestion” means easily influenced by what others say.",
  },
  "set-memory__b6": {
    word: "supports",
    why: "“Sleep supports”: sleep is singular, so the verb ends in -s.",
  },
  "set-memory__b7": {
    word: "consolidation",
    why: "“The consolidation of new information” names the process of making memories more stable.",
  },
  "set-memory__b8": {
    word: "disrupt",
    why: "“Stress can disrupt it” means stress can interrupt that process; “can” takes the plain verb.",
  },
  "set-archaeology__b1": {
    word: "evidence",
    why: "“Kinds of evidence” refers to the clues archaeologists use.",
  },
  "set-archaeology__b2": {
    word: "organized",
    why: "“Cities were organized” describes how people arranged the cities.",
  },
  "set-archaeology__b3": {
    word: "hierarchies",
    why: "“Social hierarchies” means levels of status; the plural of hierarchy ends in -ies.",
  },
  "set-archaeology__b4": {
    word: "relationships",
    why: "“Trade relationships” names connections between trading communities.",
  },
  "set-archaeology__b5": {
    word: "careful",
    why: "“Careful inferences” describes conclusions made with care.",
  },
  "set-archaeology__b6": {
    word: "increasingly",
    why: "“Increasingly useful” means becoming more useful over time.",
  },
  "set-archaeology__b7": {
    word: "excavating",
    why: "“Without excavating” needs the -ing form after “without”.",
  },
  "set-archaeology__b8": {
    word: "interpretation",
    why: "“Study and interpretation” pairs two nouns: examining evidence and explaining it.",
  },
};

export function explainPracticeBlank(blank: Blank): string {
  const entry = explanations[blank.id];
  return entry?.word === blank.fullWord
    ? entry.why
    : `The complete word is ${blank.fullWord}.`;
}
