import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useListPracticeSets } from "@workspace/api-client-react";
import { LearnerShell } from "./learner-shell";
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
  // Enough space per event keeps date/value labels legible for a long history.
  // Only the chart scrolls; the page and table never overflow on phones.
  const chartWidth = Math.max(width, ordered.length * 60 + 50);
  const x = (i: number) =>
    46 + ((i + 0.5) * (chartWidth - 62)) / ordered.length;
  const y = (d: DrillLog) => 66 + (100 - drillPercent(d)) * 1.6;
  const color = (category: string) =>
    category === (main || categories[0]) ? "#2E6B55" : "#7F948A";
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
        <h3>Drill accuracy over time</h3>
        <ul className="chart-legend">
          {categories.map((category) => (
            <li key={category}>
              <i style={{ background: color(category) }} />
              {category}
            </li>
          ))}
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
                stroke={value === 100 ? "#B9D8C7" : "#E3E4E0"}
                strokeDasharray={value === 100 ? "4 4" : undefined}
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
  return (
    <LearnerShell progress>
      <div className="progress-view">
        <header className="learner-intro">
          <p className="learner-eyebrow">Progress</p>
          <h1>Your practice so far</h1>
        </header>
        {!summary.passages.length ? (
          <section className="progress-empty">
            <p>Finish a passage to see your patterns here.</p>
            <Link className="learner-button" href="/practice">
              Start practice
            </Link>
          </section>
        ) : (
          <>
            <div className="progress-totals">
              <span>
                <strong>{summary.passages.length}</strong>{" "}
                {summary.passages.length === 1 ? "passage" : "passages"}
              </span>
              <b aria-hidden="true">·</b>
              <span>
                <strong>{summary.accuracy}%</strong> accuracy
              </span>
              <b aria-hidden="true">·</b>
              <span>
                <strong>{summary.drills}</strong> targeted{" "}
                {summary.drills === 1 ? "drill" : "drills"}
              </span>
            </div>
            <section className="progress-patterns">
              <header className="progress-section-heading">
                <h2>Patterns &amp; practice</h2>
                <p>From your last 5 passages</p>
              </header>
              {patterns.length ? (
                <table className="progress-pattern-table">
                  <thead>
                    <tr>
                      {[
                        "Pattern",
                        "Status",
                        "Evidence",
                        "Practice",
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
                      const href = `/training?category=${drillForCategory[p.category]}&passage=${encodeURIComponent(summary.passages[0].passageId)}`;
                      return (
                        <tr
                          key={p.category}
                          className={p.status === "Cleared" ? "is-cleared" : ""}
                        >
                          <th scope="row">{p.category}</th>
                          <td data-label="Status">
                            <span className="progress-status">
                              <i
                                aria-hidden="true"
                                className={
                                  p.status === "Cleared"
                                    ? "status-cleared"
                                    : p.status === "Pattern"
                                      ? "status-pattern"
                                      : "status-possible"
                                }
                              >
                                {p.status === "Cleared" ? "✓" : ""}
                              </i>
                              {p.status}
                            </span>
                          </td>
                          <td data-label="Evidence">
                            {p.count} {p.count === 1 ? "miss" : "misses"} ·{" "}
                            {p.passages}{" "}
                            {p.passages === 1 ? "passage" : "passages"}
                            {p.status === "Cleared" && (
                              <small>cleared by a 100% drill</small>
                            )}
                          </td>
                          <td data-label="Practice">
                            {latest ? (
                              <>
                                <strong>{drillPercent(latest)}%</strong>
                                {difference !== null && (
                                  <small>
                                    {difference >= 0 ? "+" : ""}
                                    {difference}% since last
                                  </small>
                                )}
                              </>
                            ) : (
                              <span className="progress-muted">
                                Not practiced
                              </span>
                            )}
                          </td>
                          <td>
                            <Link className="progress-link" href={href}>
                              {p.status === "Possible pattern"
                                ? "Go practice"
                                : "Practice again"}{" "}
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
                A 100% drill clears a pattern until the same kind of miss comes
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
