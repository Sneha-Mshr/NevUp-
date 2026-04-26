import type { SessionSummary } from "@/types";
import styles from "./SessionList.module.css";

interface Props {
  sessions: SessionSummary[];
  onSelect: (sessionId: string) => void;
}

export default function SessionList({ sessions, onSelect }: Props) {
  return (
    <div className={styles.list} role="list" aria-label="Trading sessions">
      {sessions.map((session) => {
        const date = new Date(session.date);
        const pnlPositive = session.totalPnl >= 0;
        const winCount = Math.round(session.winRate * session.tradeCount);
        const lossCount = session.tradeCount - winCount;

        return (
          <button
            key={session.sessionId}
            className={styles.item}
            onClick={() => onSelect(session.sessionId)}
            role="listitem"
            aria-label={`Session on ${date.toLocaleDateString()}, ${session.tradeCount} trades, PnL $${session.totalPnl.toFixed(2)}`}
          >
            <div className={styles.dateCol}>
              <span className={styles.dateDay}>{date.toLocaleDateString("en", { weekday: "short" })}</span>
              <span className={styles.dateNum}>{date.toLocaleDateString("en", { month: "short", day: "numeric" })}</span>
            </div>
            <div className={styles.details}>
              <div className={styles.topRow}>
                <span className={styles.tradeCount}>{session.tradeCount} trades</span>
                <span className={styles.winLoss}>
                  <span className={styles.win}>{winCount}W</span>
                  {" / "}
                  <span className={styles.loss}>{lossCount}L</span>
                </span>
              </div>
              <div className={styles.bottomRow}>
                <span className={`${styles.pnl} ${pnlPositive ? styles.pnlPos : styles.pnlNeg}`}>
                  {pnlPositive ? "+" : ""}${session.totalPnl.toFixed(2)}
                </span>
                <span className={styles.adherence}>
                  Win rate: {Math.round(session.winRate * 100)}%
                </span>
              </div>
            </div>
            <span className={styles.arrow}>→</span>
          </button>
        );
      })}
    </div>
  );
}
