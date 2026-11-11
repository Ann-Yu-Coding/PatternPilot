import "../progress.css";

/**
 * A static, clearly labelled example of the Progress page. Used on the
 * homepage and in the Progress empty state so new visitors can see what the
 * learning loop looks like over time. It never shows real learner data.
 */
const rows = [
  {
    pattern: "Word form",
    status: "Pattern",
    dot: "status-pattern",
    evidence: "3 misses across 2 passages",
    practice: "80%",
    change: "4/5 correct · +20 points",
    next: "Practise",
  },
  {
    pattern: "Grammar ending",
    status: "Possible pattern",
    dot: "status-possible",
    evidence: "1 miss in 1 passage",
    practice: null,
    change: null,
    next: "Start drill",
  },
  {
    pattern: "Spelling",
    status: "Cleared",
    dot: "status-cleared",
    evidence: "Previously: 2 misses across 2 passages",
    practice: "100%",
    change: "5/5 correct",
    next: "Review",
  },
] as const;

export function ProgressPreview() {
  return (
    <figure className="progress-preview" aria-label="Example progress, not real learner data">
      <span className="progress-preview-tag">Example progress</span>
      <div className="progress-totals">
        <span>
          <strong>3</strong> passages
        </span>
        <b aria-hidden="true">·</b>
        <span>
          <strong>75%</strong> accuracy
        </span>
        <b aria-hidden="true">·</b>
        <span>
          <strong>4</strong> targeted drills
        </span>
      </div>
      <table className="progress-pattern-table progress-preview-table">
        <thead>
          <tr>
            <th>Pattern &amp; evidence</th>
            <th>Status</th>
            <th>Latest drill</th>
            <th>Next step</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.pattern}
              className={
                row.status === "Cleared"
                  ? "is-cleared"
                  : row.status === "Pattern"
                    ? "is-pattern"
                    : ""
              }
            >
              <th scope="row">
                {row.pattern}
                <small>{row.evidence}</small>
              </th>
              <td data-label="Status">
                <span className="progress-status">
                  <i aria-hidden="true" className={row.dot}>
                    {row.status === "Cleared" ? "✓" : ""}
                  </i>
                  {row.status}
                </span>
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
                <span
                  className={`progress-link${row.status === "Cleared" ? " is-quiet" : ""}`}
                >
                  {row.next} →
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
