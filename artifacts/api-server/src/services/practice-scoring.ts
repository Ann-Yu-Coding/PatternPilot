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
    const submitted = answers.find((answer) => answer.blankId === item.id)?.value ?? "";
    const isCorrect = submitted.trim().toLowerCase() === item.answer.toLowerCase();
    return {
      blankId: item.id,
      submitted,
      fullWord: item.fullWord,
      isCorrect,
      errorCategory: item.errorCategory,
      suffix: item.suffix,
      wordFamily: item.wordFamily,
      explanation: isCorrect ? "Correct form for this sentence." : `The complete word is ${item.fullWord}.`,
    };
  });
}
