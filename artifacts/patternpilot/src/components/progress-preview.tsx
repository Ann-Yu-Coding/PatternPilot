import { Link } from "wouter";
import "../progress.css";

export function ProgressTotals({
  passages,
  accuracy,
  drills,
}: {
  passages: number;
  accuracy: number;
  drills: number;
}) {
  return (
    <dl className="progress-totals">
      <div>
        <dt>{passages === 1 ? "Passage" : "Passages"} completed</dt>
        <dd>{passages}</dd>
      </div>
      <div>
        <dt>Passage accuracy</dt>
        <dd>{accuracy}%</dd>
      </div>
      <div>
        <dt>Targeted {drills === 1 ? "drill" : "drills"}</dt>
        <dd>{drills}</dd>
      </div>
    </dl>
  );
}

/** Mint banner: what to do next, why, and the one action that does it. */
export function NextStep({
  title,
  evidence,
  action,
  href,
  detail,
}: {
  title: string;
  evidence: string;
  action: string;
  href?: string;
  detail: string;
}) {
  return (
    <section className="progress-next" aria-label="Next step">
      <span className="progress-next-label">Next step</span>
      <div className="progress-next-copy">
        <strong>{title}</strong>
        <span>{evidence}</span>
      </div>
      <div className="progress-next-action">
        {href ? (
          <Link className="progress-link" href={href}>
            {action} →
          </Link>
        ) : (
          <span className="progress-link">{action} →</span>
        )}
        <span>{detail}</span>
      </div>
    </section>
  );
}

/**
 * A static, clearly labelled example of the Progress page. Used on the
 * homepage and in the Progress empty state so new visitors can see what the
 * learning loop looks like over time. It never shows real learner data.
 */
const rows = [
  {
    pattern: "Spelling",
    status: "Pattern",
    dot: "status-pattern",
    evidence: "2 misses across 2 passages",
    practice: "60%",
    change: "3/5 correct",
    note: null,
    next: "Practise",
  },
  {
    pattern: "Context / meaning",
    status: "Possible pattern",
    dot: "status-possible",
    evidence: "1 miss in 1 passage",
    practice: "100%",
    change: "5/5 correct",
    note: "New miss since the last perfect drill",
    next: "Practise",
  },
  {
    pattern: "Word retrieval",
    status: "Possible pattern",
    dot: "status-possible",
    evidence: "1 miss in 1 passage",
    practice: null,
    change: null,
    note: null,
    next: "Start drill",
  },
] as const;

export function ProgressPreview() {
  return (
    <figure
      className="progress-preview"
      aria-label="Example progress, not real learner data"
    >
      <span className="progress-preview-tag">
        Design preview · illustrative data
      </span>
      <ProgressTotals passages={2} accuracy={69} drills={3} />
      <NextStep
        title="Focus on spelling"
        evidence="2 misses across 2 passages"
        action="Practise spelling"
        detail="5 focused sentences"
      />
      <table className="progress-pattern-table progress-preview-table">
        <thead>
          <tr>
            <th>Pattern &amp; evidence</th>
            <th>Current status</th>
            <th>Latest drill</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.pattern}>
              <th scope="row">
                {row.pattern}
                <small>{row.evidence}</small>
              </th>
              <td data-label="Status">
                <span className="progress-status">
                  <i aria-hidden="true" className={row.dot} />
                  {row.status}
                </span>
                {row.note && (
                  <small className="progress-status-note">{row.note}</small>
                )}
              </td>
              <td data-label="Latest drill">
                {row.practice ? (
                  <>
                    <strong>{row.practice}</strong>
                    <small>{row.change}</small>
                  </>
                ) : (
                  <span className="progress-muted">Not practised yet</span>
                )}
              </td>
              <td>
                <span className="progress-link">{row.next} →</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="progress-footnote">
        A perfect drill clears a pattern. A later miss can bring it back.
      </p>
    </figure>
  );
}
