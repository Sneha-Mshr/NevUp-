import type { BehavioralMetrics } from "@/types";
import styles from "./MetricsPanel.module.css";

interface Props {
  metrics: BehavioralMetrics;
}

const EMOTION_COLORS: Record<string, string> = {
  calm: "var(--calm)",
  anxious: "var(--anxious)",
  greedy: "var(--greedy)",
  fearful: "var(--fearful)",
  neutral: "var(--neutral)",
};

export default function MetricsPanel({ metrics }: Props) {
  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Behavioral Metrics</h2>

      <div className={styles.metricsRow}>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Plan Adherence (10-trade avg)</span>
          <span className={styles.metricValue}>
            {metrics.planAdherenceScore.toFixed(1)} / 5
          </span>
          <div className={styles.barBg}>
            <div
              className={styles.barFill}
              style={{ width: `${(metrics.planAdherenceScore / 5) * 100}%` }}
            />
          </div>
        </div>

        <div className={styles.metric}>
          <span className={styles.metricLabel}>Revenge Trades Flagged</span>
          <span className={`${styles.metricValue} ${metrics.revengeTrades > 0 ? styles.danger : ""}`}>
            {metrics.revengeTrades}
          </span>
        </div>

        <div className={styles.metric}>
          <span className={styles.metricLabel}>Session Tilt Index</span>
          <span className={styles.metricValue}>
            {metrics.sessionTiltIndex.toFixed(2)}
          </span>
        </div>
      </div>

      <h3 className={styles.subtitle}>Win Rate by Emotional State</h3>
      <div className={styles.emotionGrid}>
        {Object.entries(metrics.winRateByEmotionalState)
          .filter(([emo]) => emo !== "unknown")
          .map(([emotion, data]) => (
            <div key={emotion} className={styles.emotionItem}>
              <div className={styles.emotionHeader}>
                <span
                  className={styles.emotionDot}
                  style={{ background: EMOTION_COLORS[emotion] || "var(--text-muted)" }}
                />
                <span className={styles.emotionName}>{emotion}</span>
              </div>
              <span className={styles.emotionRate}>
                {Math.round(data.winRate * 100)}%
              </span>
              <span className={styles.emotionDetail}>
                {data.wins}W / {data.losses}L
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}
