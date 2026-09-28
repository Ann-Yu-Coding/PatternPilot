import { ArrowRight, RotateCcw } from "lucide-react";
import type { PracticeSet } from "@workspace/api-client-react";
import { remainingFree } from "../lib/free-practice";
import type { History } from "../lib/practice-history";
export function NextPassage({
  next,
  history,
  onNext,
  onRetry,
}: {
  next?: PracticeSet;
  history: History;
  onNext: () => void;
  onRetry: () => void;
}) {
  const left = remainingFree(history);
  return (
    <section className="next-passage">
      <div>
        <p className="learner-eyebrow">
          {next ? "Next passage" : "Practice complete"}
        </p>
        <h2>{next?.title || "You’ve tried every available passage."}</h2>
        <p>
          {next
            ? `${next.topic} · 3 min · ${left} free ${left === 1 ? "passage" : "passages"} left`
            : "Revisit a passage to check your progress."}
        </p>
      </div>
      <div className="next-actions">
        <button
          className="learner-button retry"
          data-testid="button-retry-passage"
          onClick={onRetry}
        >
          <RotateCcw size={16} />
          Try again
        </button>
        {next && (
          <button
            className="learner-button"
            data-testid="button-next-passage"
            onClick={onNext}
          >
            Next passage <ArrowRight size={16} />
          </button>
        )}
      </div>
    </section>
  );
}
