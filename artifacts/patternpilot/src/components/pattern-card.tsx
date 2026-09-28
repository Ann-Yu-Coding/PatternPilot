import {
  useGetTargetedTraining,
  GetTargetedTrainingCategoryKey,
} from "@workspace/api-client-react";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import {
  drillForCategory,
  feedbackForCategory,
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
  const words = pattern.category.split(" ");
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
      aria-labelledby="pattern-title"
    >
      <div className="learner-pattern-copy">
        <span className="learner-pattern-badge">
          {pattern.possible ? "Possible pattern" : "Pattern found"}
        </span>
        <h2 id="pattern-title">
          {words.slice(0, -1).join(" ")} <mark>{words.at(-1)}</mark>
        </h2>
        <p>
          {pattern.possible
            ? "Just one slip here, but it looks like the kind that tends to repeat."
            : feedbackForCategory[pattern.category] ||
              "Use the sentence to narrow down the missing word."}
        </p>
        <p className="pattern-evidence">{pattern.evidence}</p>
        <div className="learner-pattern-action">
          <Link
            className="learner-button"
            data-testid="link-result-training"
            href={`/training?category=${encodeURIComponent(key)}&pattern=${encodeURIComponent(pattern.category)}&session=${encodeURIComponent(sessionId)}`}
          >
            {pattern.possible
              ? `Check with ${count || "a few"} ${count ? "questions" : "questions"}`
              : `Practice ${pattern.category.toLowerCase()}`}{" "}
            <ArrowRight size={18} />
          </Link>
          <span>
            {pattern.possible
              ? "If you get them all, we drop it."
              : `${count || "A few"} quick questions · 2 min`}
          </span>
        </div>
      </div>
      <div
        className="pattern-seen"
        aria-label={`Seen ${pattern.count} ${pattern.count === 1 ? "time" : "times"}`}
      >
        <div aria-hidden="true">
          {Array.from({ length: pattern.count }, (_, i) => (
            <i key={i} />
          ))}
          {pattern.possible && <i className="is-needed" />}
        </div>
        <small>
          seen {pattern.count === 1 ? "once" : `${pattern.count} times`}
        </small>
      </div>
    </section>
  );
}
