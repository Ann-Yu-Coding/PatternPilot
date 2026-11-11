import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useListPracticeSets } from "@workspace/api-client-react";
import { LearnerShell } from "./learner-shell";
import { ProgressPreview, ProgressTotals, NextStep } from "./progress-preview";
import { readHistory } from "../lib/history-storage";
import { drillForCategory, type DrillLog } from "../lib/practice-history";
import {
  progressSummary,
  progressPatterns,
  drillPercent,
} from "../lib/progress";
import "../progress.css";
const date = (timestamp: number) =>
  new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

const evidenceText = (p: { count: number; passages: number }) =>
  `${p.count} ${p.count === 1 ? "miss" : "misses"} ${p.passages === 1 ? "in" : "across"} ${p.passages} ${p.passages === 1 ? "passage" : "passages"}`;

function DrillChart({ drills, main }: { drills: DrillLog[]; main?: string }) {
  const [width, setWidth] = useState(720);
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);
  const ordered = [...drills].sort((a, b) => a.timestamp - b.timestamp);
  const categories = [...new Set(ordered.map((d) => d.category))];
  // The main pattern gets the solid green line. If it has no drills yet, the
  // first drilled pattern takes that role so the lines stay distinguishable.
  const lead = main && categories.includes(main) ? main : categories[0];
  // Enough space per event keeps date/value labels legible for a long history.
  // Only the chart scrolls; the page and table never overflow on phones.
  const chartWidth = Math.max(width, ordered.length * 60 + 50);
  const x = (i: number) =>
    46 + ((i + 0.5) * (chartWidth - 62)) / ordered.length;
  const y = (d: DrillLog) => 66 + (100 - drillPercent(d)) * 1.6;
  const color = (category: string) =>
    category === lead ? "#2E6B55" : "#7F948A";
  const segments = categories.flatMap((category) => {
    const points = ordered.flatMap((d, i) =>
      d.category === category ? [{ x: x(i), y: y(d) }] : [],
    );
    return points.slice(1).map((point, i) => [points[i], point]);
  });
  const labelY = (d: DrillLog, i: number) => {
    const left = x(i) - 24,
      right = x(i) + 24;
    return (
      [y(d) - 18, y(d) + 28, y(d) - 40, y(d) + 50, 30].find((baseline) => {
        if (baseline < 20 || baseline > 244) return false;
        if (
          [66, 146, 226].some(
            (line) => line >= baseline - 14 && line <= baseline + 4,
          )
        )
          return false;
        if (
          ordered.some(
            (other, j) =>
              Math.abs(x(j) - x(i)) < 30 &&
              y(other) >= baseline - 20 &&
              y(other) <= baseline + 10,
          )
        )
          return false;
        return !segments.some(([a, b]) => {
          const l = Math.max(left, a.x),
            r = Math.min(right, b.x);
          if (l > r) return false;
          const yl = a.y + ((b.y - a.y) * (l - a.x)) / (b.x - a.x),
            yr = a.y + ((b.y - a.y) * (r - a.x)) / (b.x - a.x);
          return (
            Math.max(yl, yr) >= baseline - 16 &&
            Math.min(yl, yr) <= baseline + 6
          );
        });
      }) || 30
    );
  };
  return (
    <section className="progress-chart">
      <header>
        <div>
          <h3>Recent drill results</h3>
          <p>Each point is one completed drill.</p>
        </div>
        <ul className="chart-legend">
          {categories.map((category) => (
            <li key={category}>
              <i
                className={category === lead ? "" : "is-dashed"}
                style={
                  category === lead
                    ? { background: color(category) }
                    : { borderColor: color(category) }
                }
              />
              {category}
            </li>
          ))}
          <li className="chart-clear-key">
            <i aria-hidden="true" />
            100% clears the pattern
          </li>
        </ul>
      </header>
      <div
        ref={setElement}
        className="chart-scroll"
        tabIndex={0}
        aria-label="Drill accuracy chart; scroll horizontally for more drills"
      >
        <svg
          width={chartWidth}
          height={280}
          role="img"
          aria-label={ordered
            .map(
              (d) => `${d.category}, ${date(d.timestamp)}: ${drillPercent(d)}%`,
            )
            .join("; ")}
        >
          {[0, 50, 100].map((value) => (
            <g key={value}>
              <text x={2} y={70 + (100 - value) * 1.6}>
                {value}%
              </text>
              <line
                x1={40}
                x2={chartWidth - 8}
                y1={66 + (100 - value) * 1.6}
                y2={66 + (100 - value) * 1.6}
                stroke={value === 100 ? "#7F948A" : "#E3E4E0"}
                strokeDasharray={value === 100 ? "2 4" : undefined}
              />
            </g>
          ))}
          {categories.map((category) => (
            <polyline
              key={category}
              points={ordered
                .flatMap((d, i) =>
                  d.category === category ? [`${x(i)},${y(d)}`] : [],
                )
                .join(" ")}
              fill="none"
              stroke={color(category)}
              strokeWidth={2.5}
              strokeDasharray={
                category === lead ? undefined : "6 5"
              }
            />
          ))}
          {ordered.map((d, i) => (
            <g key={`${d.timestamp}-${i}`}>
              <circle
                cx={x(i)}
                cy={y(d)}
                r={5}
                fill={color(d.category)}
                stroke="white"
                strokeWidth={2}
              />
              <g transform={`translate(${x(i)},${labelY(d, i)})`}>
                <rect
                  x={-24}
                  y={-16}
                  width={48}
                  height={22}
                  rx={3}
                  fill="white"
                />
                <text
                  textAnchor="middle"
                  fill={color(d.category)}
                  fontWeight={600}
                >
                  {drillPercent(d)}%
                </text>
              </g>
              <text x={x(i)} y={256} textAnchor="middle">
                {date(d.timestamp)}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </section>
  );
}

export function ProgressPage() {
  const [history, setHistory] = useState(readHistory);
  const { data: sets } = useListPracticeSets();
  useEffect(() => {
    const sync = () => setHistory(readHistory());
    window.addEventListener("storage", sync);
    window.addEventListener("pp-history-change", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("pp-history-change", sync);
    };
  }, []);
  const summary = progressSummary(history);
  const patterns = progressPatterns(history);
  const nextPattern = patterns.find((p) => p.status !== "Cleared");
  const drillHref = (category: string) =>
    `/training?category=${drillForCategory[category]}&passage=${encodeURIComponent(summary.passages[0]?.passageId ?? "")}`;
  return (
    <LearnerShell progress>
      <div className="progress-view">
        <header className="learner-intro">
          <p className="learner-eyebrow">Progress</p>
          <h1>Your practice so far</h1>
          <p className="progress-subtitle">
            See what needs practice and what you’ve cleared.
          </p>
        </header>
        {!summary.passages.length ? (
          <section className="progress-empty">
            <p>Finish a passage to see your patterns here.</p>
            <Link className="learner-button" href="/practice">
              Start practice
            </Link>
            <p className="progress-empty-hint">
              Here is what this page looks like after a few passages and
              drills:
            </p>
            <ProgressPreview />
          </section>
        ) : (
          <>
            <ProgressTotals
              passages={summary.passages.length}
              accuracy={summary.accuracy}
              drills={summary.drills}
            />
            {nextPattern ? (
              <NextStep
                title={`Focus on ${nextPattern.category.toLowerCase()}`}
                evidence={evidenceText(nextPattern)}
                action={`Practise ${nextPattern.category.toLowerCase()}`}
                href={drillHref(nextPattern.category)}
                detail="5 focused sentences"
              />
            ) : (
              <NextStep
                title="No active patterns right now"
                evidence="Every pattern you had is cleared."
                action="Try another passage"
                href="/practice"
                detail="About 3 minutes"
              />
            )}
            <section className="progress-patterns">
              <header className="progress-section-heading">
                <h2>Patterns &amp; practice</h2>
                <p>Evidence from up to your last 5 passages.</p>
              </header>
              {patterns.length ? (
                <table className="progress-pattern-table">
                  <thead>
                    <tr>
                      {[
                        "Pattern & evidence",
                        "Current status",
                        "Latest drill",
                        "Action",
                      ].map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {patterns.map((p) => {
                      const latest = p.drills.at(-1),
                        previous = p.drills.at(-2);
                      const difference =
                        latest && previous
                          ? drillPercent(latest) - drillPercent(previous)
                          : null;
                      const cleared = p.status === "Cleared";
                      const evidence = evidenceText(p);
                      const returned =
                        !cleared && latest && drillPercent(latest) === 100;
                      return (
                        <tr
                          key={p.category}
                          className={cleared ? "is-cleared" : ""}
                        >
                          <th scope="row">
                            {p.category}
                            <small>
                              {cleared ? `Previously: ${evidence}` : evidence}
                            </small>
                          </th>
                          <td data-label="Status">
                            <span className="progress-status">
                              <i
                                aria-hidden="true"
                                className={
                                  cleared
                                    ? "status-cleared"
                                    : p.status === "Pattern"
                                      ? "status-pattern"
                                      : "status-possible"
                                }
                              >
                                {cleared ? "✓" : ""}
                              </i>
                              {p.status}
                            </span>
                            {returned && (
                              <small className="progress-status-note">
                                New miss since the last perfect drill
                              </small>
                            )}
                          </td>
                          <td data-label="Latest drill">
                            {latest ? (
                              <>
                                <strong>{drillPercent(latest)}%</strong>
                                <small>
                                  {latest.score}/{latest.total} correct
                                  {difference !== null &&
                                    ` · ${difference >= 0 ? "+" : ""}${difference} points`}
                                </small>
                              </>
                            ) : (
                              <span className="progress-muted">
                                Not practised yet
                              </span>
                            )}
                          </td>
                          <td>
                            <Link
                              className={`progress-link${cleared ? " is-quiet" : ""}`}
                              href={drillHref(p.category)}
                            >
                              {cleared
                                ? "Review"
                                : latest
                                  ? "Practise"
                                  : "Start drill"}{" "}
                              →<span className="sr-only"> {p.category}</span>
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p className="progress-muted">No patterns to show yet.</p>
              )}
              <p className="progress-footnote">
                A perfect drill clears a pattern. A later miss can bring it
                back.
              </p>
            </section>
            {!!history.drills?.length && (
              <DrillChart
                drills={history.drills}
                main={patterns.find((p) => p.status === "Pattern")?.category}
              />
            )}
            <section className="progress-passages">
              <header className="progress-section-heading">
                <h2>Passages</h2>
                <p>Newest first</p>
              </header>
              <ol>
                {summary.passages.map((a) => {
                  const tries = history.attempts.filter(
                    (x) => x.passageId === a.passageId,
                  ).length;
                  return (
                    <li key={a.id}>
                      <div className="passage-description">
                        <h3>{a.title}</h3>
                        <p>
                          {a.topic ||
                            sets?.find((s) => s.id === a.passageId)?.topic ||
                            ""}{" "}
                          · {date(a.timestamp)}
                          {tries > 1
                            ? ` · tried ${tries === 2 ? "twice" : `${tries} times`}`
                            : ""}
                        </p>
                      </div>
                      <div className="passage-score-bar" aria-hidden="true">
                        <span
                          style={{
                            width: `${a.total ? (100 * a.score) / a.total : 0}%`,
                          }}
                        />
                      </div>
                      <span className="passage-score">
                        {a.score} / {a.total}
                      </span>
                      {a.review ? (
                        <Link
                          href={`/results?attempt=${encodeURIComponent(a.id)}`}
                          className="progress-link"
                        >
                          Review<span className="sr-only"> {a.title}</span>
                        </Link>
                      ) : (
                        <span className="progress-muted legacy-review">
                          Review unavailable
                        </span>
                      )}
                    </li>
                  );
                })}
              </ol>
            </section>
          </>
        )}
      </div>
    </LearnerShell>
  );
}
