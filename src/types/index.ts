export type AssetClass = "equity" | "crypto" | "forex";
export type Direction = "long" | "short";
export type TradeStatus = "open" | "closed" | "cancelled";
export type EmotionalState =
  | "calm"
  | "anxious"
  | "greedy"
  | "fearful"
  | "neutral";

// Matches OpenAPI Trade schema
export interface Trade {
  tradeId: string;
  userId: string;
  sessionId: string;
  asset: string;
  assetClass: AssetClass;
  direction: Direction;
  entryPrice: number;
  exitPrice: number | null;
  quantity: number;
  entryAt: string;
  exitAt: string | null;
  status: TradeStatus;
  outcome?: "win" | "loss" | null;
  pnl?: number | null;
  planAdherence: number | null;
  emotionalState: EmotionalState | null;
  entryRationale: string | null;
  revengeFlag?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Matches OpenAPI SessionSummary schema
export interface SessionSummary {
  sessionId: string;
  userId: string;
  date: string;
  notes: string | null;
  tradeCount: number;
  winRate: number;
  totalPnl: number;
  trades: Trade[];
}

// Matches OpenAPI DebriefInput schema
export interface DebriefInput {
  overallMood: EmotionalState;
  keyMistake: string | null;
  keyLesson: string | null;
  planAdherenceRating: number;
  willReviewTomorrow: boolean;
}

// Matches OpenAPI BehavioralMetrics schema
export interface BehavioralMetrics {
  userId: string;
  granularity: "hourly" | "daily" | "rolling30d";
  from: string;
  to: string;
  planAdherenceScore: number;
  sessionTiltIndex: number;
  winRateByEmotionalState: Record<
    string,
    { wins: number; losses: number; winRate: number }
  >;
  revengeTrades: number;
  overtradingEvents: number;
  timeseries: TimeseriesBucket[];
}

export interface TimeseriesBucket {
  bucket: string;
  tradeCount: number;
  winRate: number;
  pnl: number;
  avgPlanAdherence: number;
}

// Matches OpenAPI BehavioralProfile schema
export interface BehavioralProfile {
  userId: string;
  generatedAt: string;
  dominantPathologies: PathologyEntry[];
  strengths: string[];
  peakPerformanceWindow: {
    startHour: number;
    endHour: number;
    winRate: number;
  } | null;
}

export interface PathologyEntry {
  pathology: string;
  confidence: number;
  evidenceSessions: string[];
  evidenceTrades: string[];
}

// Internal type for heatmap (derived from timeseries)
export interface DailyMetric {
  date: string;
  tradeCount: number;
  winRate: number;
  avgPlanAdherence: number;
  totalPnl: number;
  qualityScore: number;
}
