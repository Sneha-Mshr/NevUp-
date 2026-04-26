import type { BehavioralProfile } from "@/types";
import styles from "./ProfileCard.module.css";

interface Props {
  profile: BehavioralProfile;
}

export default function ProfileCard({ profile }: Props) {
  return (
    <div className={styles.card}>
      {/* Pathologies */}
      {profile.dominantPathologies.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Detected Patterns</h3>
          <div className={styles.pathologies}>
            {profile.dominantPathologies.map((p) => (
              <div key={p.pathology} className={styles.pathologyItem}>
                <div className={styles.pathologyHeader}>
                  <span className={styles.pathologyName}>
                    {p.pathology.replace(/_/g, " ")}
                  </span>
                  <span className={styles.confidence}>
                    {Math.round(p.confidence * 100)}% confidence
                  </span>
                </div>
                <div className={styles.evidenceRow}>
                  <span className={styles.evidenceLabel}>
                    {p.evidenceSessions.length} sessions · {p.evidenceTrades.length} key trades
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strengths */}
      {profile.strengths.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Strengths</h3>
          <ul className={styles.strengthList}>
            {profile.strengths.map((s, i) => (
              <li key={i} className={styles.strengthItem}>✓ {s}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Peak Window */}
      {profile.peakPerformanceWindow && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Peak Performance Window</h3>
          <div className={styles.peakWindow}>
            <span className={styles.peakTime}>
              {profile.peakPerformanceWindow.startHour}:00 – {profile.peakPerformanceWindow.endHour}:00 UTC
            </span>
            <span className={styles.peakRate}>
              {Math.round(profile.peakPerformanceWindow.winRate * 100)}% win rate
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
