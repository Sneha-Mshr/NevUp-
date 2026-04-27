"use client";

import { useState, useMemo } from "react";
import type { DailyMetric } from "@/types";
import styles from "./BehavioralHeatmap.module.css";

interface Props {
  dailyMetrics: DailyMetric[];
  onClick: (date: string) => void;
}

const CELL_SIZE = 14;
const CELL_GAP = 3;
const DAYS_IN_WEEK = 7;
const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

function getColor(score: number): string {
  if (score === -1) return "var(--bg-primary)";
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#86efac";
  if (score >= 40) return "#fbbf24";
  if (score >= 20) return "#f97316";
  return "#ef4444";
}

function getDateRange(metrics: DailyMetric[]): { start: Date; end: Date } {
  if (metrics.length === 0) {
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - 90);
    return { start, end };
  }
  const dates = metrics.map((m) => new Date(m.date));
  const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));
  // Extend to cover at least 90 days
  const start = new Date(minDate);
  start.setDate(start.getDate() - start.getDay()); // align to Sunday
  const end = new Date(maxDate);
  end.setDate(end.getDate() + (6 - end.getDay())); // align to Saturday
  return { start, end };
}

export default function BehavioralHeatmap({ dailyMetrics, onClick }: Props) {
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    date: string;
    metric: DailyMetric | null;
  } | null>(null);

  const { cells, weeks, monthLabels } = useMemo(() => {
    const metricMap = new Map(dailyMetrics.map((m) => [m.date, m]));
    const { start, end } = getDateRange(dailyMetrics);

    const cells: Array<{
      date: string;
      week: number;
      day: number;
      score: number;
      metric: DailyMetric | null;
    }> = [];

    let week = 0;
    const current = new Date(start);
    const monthLabels: Array<{ week: number; label: string }> = [];
    let lastMonth = -1;

    while (current <= end) {
      const dateStr = current.toISOString().split("T")[0];
      const dayOfWeek = current.getDay();
      const metric = metricMap.get(dateStr) || null;

      if (current.getMonth() !== lastMonth) {
        monthLabels.push({
          week,
          label: current.toLocaleString("en", { month: "short" }),
        });
        lastMonth = current.getMonth();
      }

      cells.push({
        date: dateStr,
        week,
        day: dayOfWeek,
        score: metric ? metric.qualityScore : -1,
        metric,
      });

      current.setDate(current.getDate() + 1);
      if (current.getDay() === 0) week++;
    }

    return { cells, weeks: week + 1, monthLabels };
  }, [dailyMetrics]);

  const svgWidth = weeks * (CELL_SIZE + CELL_GAP) + 40;
  const svgHeight = DAYS_IN_WEEK * (CELL_SIZE + CELL_GAP) + 30;

  return (
    <div className={styles.container}>
      <div className={styles.scrollWrapper}>
        <svg
          width={svgWidth}
          height={svgHeight}
          role="img"
          aria-label="Behavioral trading quality index heatmap"
        >
          {/* Month labels */}
          {monthLabels.map((ml, i) => (
            <text
              key={i}
              x={40 + ml.week * (CELL_SIZE + CELL_GAP)}
              y={10}
              className={styles.monthLabel}
            >
              {ml.label}
            </text>
          ))}

          {/* Day labels */}
          {DAY_LABELS.map((label, i) => (
            <text
              key={i}
              x={30}
              y={22 + i * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2}
              className={styles.dayLabel}
              textAnchor="end"
            >
              {label}
            </text>
          ))}

          {/* Cells */}
          {cells.map((cell) => (
            <rect
              key={cell.date}
              x={40 + cell.week * (CELL_SIZE + CELL_GAP)}
              y={18 + cell.day * (CELL_SIZE + CELL_GAP)}
              width={CELL_SIZE}
              height={CELL_SIZE}
              rx={2}
              fill={getColor(cell.score)}
              className={cell.metric ? styles.cellActive : styles.cell}
              role={cell.metric ? "button" : undefined}
              tabIndex={cell.metric ? 0 : undefined}
              aria-label={
                cell.metric
                  ? `${cell.date}: quality ${cell.score}, ${cell.metric.tradeCount} trades, PnL $${cell.metric.totalPnl.toFixed(0)}`
                  : `${cell.date}: no trades`
              }
              onMouseEnter={(e) => {
                const rect = (e.target as SVGRectElement).getBoundingClientRect();
                setTooltip({
                  x: rect.left + rect.width / 2,
                  y: rect.top - 8,
                  date: cell.date,
                  metric: cell.metric,
                });
              }}
              onMouseLeave={() => setTooltip(null)}
              onClick={() => cell.metric && onClick(cell.date)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && cell.metric) onClick(cell.date);
              }}
            />
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        <span className={styles.legendLabel}>Less</span>
        {[0, 20, 40, 60, 80].map((score) => (
          <div
            key={score}
            className={styles.legendCell}
            style={{ background: getColor(score) }}
          />
        ))}
        <span className={styles.legendLabel}>More</span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className={styles.tooltip}
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: "translate(-50%, -100%)",
            position: "fixed",
          }}
        >
          <strong>{tooltip.date}</strong>
          {tooltip.metric ? (
            <>
              <span>Quality: {tooltip.metric.qualityScore}%</span>
              <span>Trades: {tooltip.metric.tradeCount}</span>
              <span>PnL: ${tooltip.metric.totalPnl.toFixed(2)}</span>
              <span>Win Rate: {Math.round(tooltip.metric.winRate * 100)}%</span>
            </>
          ) : (
            <span>No trades</span>
          )}
        </div>
      )}
    </div>
  );
}
