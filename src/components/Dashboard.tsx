"use client";

import { useState, useEffect, useCallback } from "react";
import type { TraderInfo } from "@/lib/auth";
import type { SessionSummary, BehavioralMetrics, BehavioralProfile, DailyMetric } from "@/types";
import { getSessionsForUser, getMetricsForUser, getProfileForUser, getDailyMetrics } from "@/lib/seed-data";
import BehavioralHeatmap from "./BehavioralHeatmap";
import SessionList from "./SessionList";
import DebriefFlow from "./DebriefFlow";
import ProfileCard from "./ProfileCard";
import MetricsPanel from "./MetricsPanel";
import ErrorState from "./ErrorState";
import LoadingSkeleton from "./LoadingSkeleton";
import EmptyState from "./EmptyState";
import styles from "./Dashboard.module.css";

interface Props {
  trader: TraderInfo;
  onBack: () => void;
}

function getDailyMetricsFromTimeseries(metrics: BehavioralMetrics): DailyMetric[] {
  return metrics.timeseries.map((b) => {
    const pnlScore = b.pnl > 0 ? 1 : b.pnl < -200 ? 0 : 0.5;
    const qualityScore = Math.round(
      (b.winRate * 0.4 + (b.avgPlanAdherence / 5) * 0.4 + pnlScore * 0.2) * 100
    );
    return {
      date: b.bucket.split("T")[0],
      tradeCount: b.tradeCount,
      winRate: b.winRate,
      avgPlanAdherence: b.avgPlanAdherence,
      totalPnl: b.pnl,
      qualityScore,
    };
  });
}

type Tab = "overview" | "sessions" | "debrief";

export default function Dashboard({ trader, onBack }: Props) {
  const [tab, setTab] = useState<Tab>("overview");
  const [sessions, setSessions] = useState<SessionSummary[] | null>(null);
  const [metrics, setMetrics] = useState<BehavioralMetrics | null>(null);
  const [profile, setProfile] = useState<BehavioralProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const loadData = useCallback(() => {
    setLoading(true);
    setError(null);
    try {
      const s = getSessionsForUser(trader.userId);
      const m = getMetricsForUser(trader.userId);
      const p = getProfileForUser(trader.userId);
      setSessions(s);
      setMetrics(m);
      setProfile(p);
    } catch (err) {
      setError((err as Error).message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [trader.userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handleSessionSelect(sessionId: string) {
    setSelectedSessionId(sessionId);
    setTab("debrief");
  }

  function handleHeatmapClick(date: string) {
    if (!sessions) return;
    const session = sessions.find((s) => s.date.startsWith(date));
    if (session) handleSessionSelect(session.sessionId);
  }

  return (
    <div className={styles.container}>
      <header className={styles.topBar}>
        <button className={styles.backBtn} onClick={onBack} aria-label="Back to trader list">
          ← Back
        </button>
        <div className={styles.traderHeader}>
          <div className={styles.avatar}>
            {trader.name.split(" ").map((n) => n[0]).join("")}
          </div>
          <div>
            <h1 className={styles.traderName}>{trader.name}</h1>
            {trader.pathology && (
              <span className={styles.pathologyBadge}>
                {trader.pathology.replace(/_/g, " ")}
              </span>
            )}
          </div>
        </div>
      </header>

      <nav className={styles.tabs} role="tablist" aria-label="Dashboard sections">
        {(["overview", "sessions", "debrief"] as Tab[]).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            className={`${styles.tab} ${tab === t ? styles.tabActive : ""}`}
            onClick={() => setTab(t)}
          >
            {t === "overview" ? "Overview" : t === "sessions" ? "Sessions" : "Debrief"}
          </button>
        ))}
      </nav>

      <main className={styles.content} role="tabpanel">
        {loading && <LoadingSkeleton />}
        {error && <ErrorState message={error} onRetry={loadData} />}
        {!loading && !error && (
          <>
            {tab === "overview" && (
              <div className={`${styles.overviewGrid} step-enter`}>
                {profile && <ProfileCard profile={profile} />}
                {metrics && <MetricsPanel metrics={metrics} />}
                {metrics && metrics.timeseries.length > 0 ? (
                  <div className={styles.heatmapSection}>
                    <h2 className={styles.sectionTitle}>Behavioral Heatmap</h2>
                    <BehavioralHeatmap
                      dailyMetrics={getDailyMetricsFromTimeseries(metrics)}
                      onClick={handleHeatmapClick}
                    />
                  </div>
                ) : (
                  <EmptyState message="No trading data available for heatmap" />
                )}
              </div>
            )}
            {tab === "sessions" && (
              <div className="step-enter">
                {sessions && sessions.length > 0 ? (
                  <SessionList
                    sessions={sessions}
                    onSelect={handleSessionSelect}
                  />
                ) : (
                  <EmptyState message="No sessions found for this trader" />
                )}
              </div>
            )}
            {tab === "debrief" && (
              <div className="step-enter">
                {selectedSessionId && sessions ? (
                  <DebriefFlow
                    session={sessions.find((s) => s.sessionId === selectedSessionId)!}
                    onComplete={() => {
                      setSelectedSessionId(null);
                      setTab("sessions");
                    }}
                  />
                ) : sessions && sessions.length > 0 ? (
                  <div className={styles.selectPrompt}>
                    <p>Select a session to begin the debrief</p>
                    <SessionList sessions={sessions} onSelect={handleSessionSelect} />
                  </div>
                ) : (
                  <EmptyState message="No sessions available for debrief" />
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
