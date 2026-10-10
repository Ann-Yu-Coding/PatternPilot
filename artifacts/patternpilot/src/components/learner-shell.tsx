import { Link } from "wouter";
import type { ReactNode } from "react";
import "../practice.css";
export function LearnerShell({
  children,
  progress = false,
}: {
  children: ReactNode;
  progress?: boolean;
}) {
  return (
    <div className="learner-page">
      <header className="learner-nav">
        <Link href="/" className="learner-brand">
          patternpilot
        </Link>
        <nav aria-label="Main navigation">
          <Link href="/practice" className={progress ? "" : "active"}>
            Practice
          </Link>
          <Link href="/dashboard" className={progress ? "active" : ""}>
            Progress
          </Link>
        </nav>
      </header>
      <main className="learner-main">{children}</main>
    </div>
  );
}
