import { classifyAnswer, type MissCategory } from "./classify-answer";
import { explainPracticeBlank } from "../data/practice-explanations";
import type { Blank } from "../data/patternpilot";

export type SubmittedAnswer = {
  blankId: string;
  value: string;
};

export type ScoredBlankItem = {
  blankId: string;
  submitted: string;
  fullWord: string;
  isCorrect: boolean;
  errorCategory: string;
  missCategory: MissCategory | null;
  suffix: string;
  wordFamily: string;
  explanation: string;
};

/** Score submitted answers against blanks using globally unique blank ids. */
export function scorePracticeAnswers(
  blanks: Blank[],
  answers: SubmittedAnswer[],
): ScoredBlankItem[] {
  return blanks.map((item) => {
    const submitted =
      answers.find((answer) => answer.blankId === item.id)?.value ?? "";
    const missCategory = classifyAnswer(item, submitted);
    const isCorrect = missCategory === null;
    return {
      blankId: item.id,
      submitted,
      fullWord: item.fullWord,
      isCorrect,
      errorCategory: item.errorCategory,
      missCategory,
      suffix: item.suffix,
      wordFamily: item.wordFamily,
      explanation: explainPracticeBlank(item),
    };
  });
}
