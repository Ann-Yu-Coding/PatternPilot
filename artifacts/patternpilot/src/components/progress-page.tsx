import { useEffect, useState } from "react";
import { Link } from "wouter";
import { LearnerShell } from "./learner-shell";
import { readHistory } from "../lib/history-storage";
import { latestPassages } from "../lib/practice-history";
import { timeLabel } from "../lib/learner-review";
export function ProgressPage() {
  const [history, setHistory] = useState(readHistory);
  useEffect(() => {
    const sync = () => setHistory(readHistory());
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  const latest = latestPassages(history);
  const score = latest.reduce((s, a) => s + a.score, 0);
  const total = latest.reduce((s, a) => s + a.total, 0);
  return (
    <LearnerShell progress>
      <header className="learner-intro">
        <p className="learner-eyebrow">Your practice</p>
        <h1>Your progress</h1>
        <p className="learner-subtitle">
          Your latest attempt shapes each passage’s pattern. Earlier attempts
          stay here.
        </p>
      </header>
      <div className="progress-summary">
        <span>
          <strong>{latest.length}</strong> passages completed
        </span>
        <span>
          <strong>
            {score} / {total}
          </strong>{" "}
          words correct on latest attempts
        </span>
        <Link className="learner-button" href="/practice">
          Continue practice
        </Link>
      </div>
      <section className="progress-attempts">
        <h2>Attempt history</h2>
        <p>Saved in this browser.</p>
        {!history.attempts.length ? (
          <p>Complete a passage to see your progress here.</p>
        ) : (
          <ol>
            {[...history.attempts].reverse().map((a) => (
              <li key={a.id}>
                <div>
                  <strong>{a.title}</strong>
                  <small>
                    {new Date(a.timestamp).toLocaleString()} ·{" "}
                    {latest.some((x) => x.id === a.id)
                      ? "Latest attempt"
                      : "Earlier attempt"}
                  </small>
                </div>
                <span>
                  {a.score} of {a.total}
                </span>
                <span>{timeLabel(a.elapsed)}</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </LearnerShell>
  );
}
