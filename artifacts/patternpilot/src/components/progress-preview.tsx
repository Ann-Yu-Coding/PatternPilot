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
    evidence: "3 misses · 2 passages",
    practice: "80%",
    change: "+20% since last",
  },
  {
    pattern: "Grammar ending",
    status: "Possible pattern",
    dot: "status-possible",
    evidence: "1 miss · 1 passage",
    practice: null,
    change: null,
  },
  {
    pattern: "Spelling",
    status: "Cleared",
    dot: "status-cleared",
    evidence: "2 misses · 2 passages",
    practice: "100%",
    change: "cleared by a 100% drill",
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
            <th>Pattern</th>
            <th>Status</th>
            <th>Evidence</th>
            <th>Practice</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.pattern}
              className={row.status === "Cleared" ? "is-cleared" : ""}
            >
              <th scope="row">{row.pattern}</th>
              <td data-label="Status">
                <span className="progress-status">
                  <i aria-hidden="true" className={row.dot}>
                    {row.status === "Cleared" ? "✓" : ""}
                  </i>
                  {row.status}
                </span>
              </td>
              <td data-label="Evidence">{row.evidence}</td>
              <td data-label="Practice">
                {row.practice ? (
                  <>
                    <strong>{row.practice}</strong>
                    <small>{row.change}</small>
                  </>
                ) : (
                  <span className="progress-muted">Not practiced</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
