import {
  useGetTargetedTraining,
  GetTargetedTrainingCategoryKey,
} from "@workspace/api-client-react";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import {
  drillForCategory,
  type Pattern,
} from "../lib/practice-history";
export function PatternCard({
  pattern,
  sessionId,
  drillCount,
}: {
  pattern: Pattern;
  sessionId: string;
  drillCount?: number;
}) {
  const key = drillForCategory[pattern.category] || "academic-vocabulary";
  const categoryKey = Object.values(GetTargetedTrainingCategoryKey).find(
    (value) => value === key,
  );
  const training = useGetTargetedTraining(
    sessionId,
    { categoryKey },
    { query: { queryKey: ["pattern-drill", sessionId, key], retry: false } },
  );
  const count = training.data?.prompts.length || drillCount;
  return (
    <section
      className={`learner-pattern ${pattern.possible ? "is-possible" : ""}`}
      aria-labelledby={`pattern-${key}`}
    >
      <div className="learner-pattern-copy">
        <p className="learner-pattern-kicker">
          {pattern.possible
            ? "Possible pattern"
            : "Pattern across recent passages"}
        </p>
        <h2 id={`pattern-${key}`}>{pattern.category}</h2>
        <p className="pattern-evidence">{pattern.evidence}.</p>
      </div>
      <div className="learner-pattern-action">
        <Link
          className="learner-button"
          data-testid="link-result-training"
          href={`/training?category=${encodeURIComponent(key)}&pattern=${encodeURIComponent(pattern.category)}&session=${encodeURIComponent(sessionId)}`}
        >
          {pattern.possible
            ? `Check with ${count || 5} sentences`
            : `Practise ${pattern.category.toLowerCase()}`}{" "}
          <ArrowRight size={18} />
        </Link>
        <span>
          {pattern.possible
            ? "If you get them all, we drop it."
            : `${count || 5} focused sentences`}
        </span>
      </div>
    </section>
  );
}
