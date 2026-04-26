import type {
  Trade,
  SessionSummary,
  DailyMetric,
  BehavioralMetrics,
  BehavioralProfile,
  PathologyEntry,
  TimeseriesBucket,
} from "@/types";
import { SEED_TRADERS } from "./auth";

import seedCsvRaw from "@/data/seed.json";

const allTrades: Trade[] = seedCsvRaw as Trade[];

export function getTradesForUser(userId: string): Trade[] {
  return allTrades.filter((t) => t.userId === userId);
}

export function getSessionsForUser(userId: string): SessionSummary[] {
  const trades = getTradesForUser(userId);
  const sessionMap = new Map<string, Trade[]>();

  for (const t of trades) {
    const arr = sessionMap.get(t.sessionId) || [];
    arr.push(t);
    sessionMap.set(t.sessionId, arr);
  }

  return Array.from(sessionMap.entries())
    .map(([sessionId, sessionTrades]) => {
      const sorted = sessionTrades.sort(
        (a, b) => new Date(a.entryAt).getTime() - new Date(b.entryAt).getTime()
      );
      const wins = sorted.filter((t) => t.outcome === "win").length;
      const totalPnl = sorted.reduce((sum, t) => sum + (t.pnl || 0), 0);

      return {
        sessionId,
        userId,
        date: sorted[0].entryAt,
        notes: null,
        tradeCount: sorted.length,
        winRate: sorted.length > 0 ? wins / sorted.length : 0,
        totalPnl: Math.round(totalPnl * 100) / 100,
        trades: sorted,
      };
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function getSessionById(sessionId: string): SessionSummary | null {
  const trades = allTrades.filter((t) => t.sessionId === sessionId);
  if (trades.length === 0) return null;
  const userId = trades[0].userId;
  const sessions = getSessionsForUser(userId);
  return sessions.find((s) => s.sessionId === sessionId) || null;
}

export function getDailyMetrics(userId: string): DailyMetric[] {
  const trades = getTradesForUser(userId);
  const dayMap = new Map<string, Trade[]>();

  for (const t of trades) {
    const day = t.entryAt.split("T")[0];
    const arr = dayMap.get(day) || [];
    arr.push(t);
    dayMap.set(day, arr);
  }

  return Array.from(dayMap.entries())
    .map(([date, dayTrades]) => {
      const wins = dayTrades.filter((t) => t.outcome === "win").length;
      const total = dayTrades.length;
      const winRate = total > 0 ? wins / total : 0;
      const adherences = dayTrades
        .map((t) => t.planAdherence)
        .filter((v): v is number => v !== null);
      const avgAdherence =
        adherences.length > 0
          ? adherences.reduce((a, b) => a + b, 0) / adherences.length
          : 0;
      const totalPnl = dayTrades.reduce((s, t) => s + (t.pnl || 0), 0);
      const pnlScore = totalPnl > 0 ? 1 : totalPnl < -200 ? 0 : 0.5;
      const qualityScore = Math.round(
        (winRate * 0.4 + (avgAdherence / 5) * 0.4 + pnlScore * 0.2) * 100
      );

      return {
        date,
        tradeCount: total,
        winRate,
        avgPlanAdherence: avgAdherence,
        totalPnl,
        qualityScore,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

function getTimeseries(userId: string): TimeseriesBucket[] {
  return getDailyMetrics(userId).map((dm) => ({
    bucket: `${dm.date}T00:00:00Z`,
    tradeCount: dm.tradeCount,
    winRate: dm.winRate,
    pnl: dm.totalPnl,
    avgPlanAdherence: dm.avgPlanAdherence,
  }));
}

export function getMetricsForUser(userId: string): BehavioralMetrics {
  const trades = getTradesForUser(userId);
  const emotionMap: Record<string, { wins: number; losses: number }> = {};

  for (const t of trades) {
    const emo = t.emotionalState || "unknown";
    if (!emotionMap[emo]) emotionMap[emo] = { wins: 0, losses: 0 };
    if (t.outcome === "win") emotionMap[emo].wins++;
    else emotionMap[emo].losses++;
  }

  const winRateByEmotionalState: Record<
    string,
    { wins: number; losses: number; winRate: number }
  > = {};
  for (const [emo, counts] of Object.entries(emotionMap)) {
    const total = counts.wins + counts.losses;
    winRateByEmotionalState[emo] = {
      ...counts,
      winRate: total > 0 ? Math.round((counts.wins / total) * 1000) / 1000 : 0,
    };
  }

  const revengeCount = trades.filter((t) => t.revengeFlag).length;
  const adherences = trades
    .slice(-10)
    .map((t) => t.planAdherence)
    .filter((v): v is number => v !== null);
  const planScore =
    adherences.length > 0
      ? adherences.reduce((a, b) => a + b, 0) / adherences.length
      : 0;

  const dates = trades.map((t) => t.entryAt).sort();

  return {
    userId,
    granularity: "daily",
    from: dates[0] || new Date().toISOString(),
    to: dates[dates.length - 1] || new Date().toISOString(),
    planAdherenceScore: Math.round(planScore * 100) / 100,
    sessionTiltIndex: 0,
    winRateByEmotionalState,
    revengeTrades: revengeCount,
    overtradingEvents: 0,
    timeseries: getTimeseries(userId),
  };
}

export function getProfileForUser(userId: string): BehavioralProfile {
  const trades = getTradesForUser(userId);
  const sessions = getSessionsForUser(userId);
  const trader = SEED_TRADERS.find((t) => t.userId === userId);

  // Build pathology entry from ground truth
  const pathologies: PathologyEntry[] = [];
  if (trader?.pathology) {
    const evidenceSessions = sessions.map((s) => s.sessionId);
    const evidenceTrades = trades
      .filter((t) => t.revengeFlag || (t.planAdherence !== null && t.planAdherence <= 2))
      .map((t) => t.tradeId)
      .slice(0, 10);

    pathologies.push({
      pathology: trader.pathology,
      confidence: 0.85,
      evidenceSessions,
      evidenceTrades,
    });
  }

  // Compute peak performance window
  const hourBuckets: Record<number, { wins: number; total: number }> = {};
  for (const t of trades) {
    const hour = new Date(t.entryAt).getUTCHours();
    if (!hourBuckets[hour]) hourBuckets[hour] = { wins: 0, total: 0 };
    hourBuckets[hour].total++;
    if (t.outcome === "win") hourBuckets[hour].wins++;
  }

  let peakWindow: BehavioralProfile["peakPerformanceWindow"] = null;
  let bestRate = 0;
  for (const [hour, data] of Object.entries(hourBuckets)) {
    const rate = data.total >= 3 ? data.wins / data.total : 0;
    if (rate > bestRate) {
      bestRate = rate;
      const h = parseInt(hour);
      peakWindow = { startHour: h, endHour: h + 1, winRate: Math.round(rate * 100) / 100 };
    }
  }

  // Strengths
  const strengths: string[] = [];
  const calmData = trades.filter((t) => t.emotionalState === "calm");
  const calmWins = calmData.filter((t) => t.outcome === "win").length;
  if (calmData.length > 0 && calmWins / calmData.length > 0.5) {
    strengths.push("Strong performance when calm and disciplined");
  }
  const highAdherence = trades.filter((t) => t.planAdherence !== null && t.planAdherence >= 4);
  if (highAdherence.length > trades.length * 0.3) {
    strengths.push("Consistent plan adherence on planned entries");
  }

  return {
    userId,
    generatedAt: new Date().toISOString(),
    dominantPathologies: pathologies,
    strengths,
    peakPerformanceWindow: peakWindow,
  };
}
