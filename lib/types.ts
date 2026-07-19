// ============================================================
// Signal Types — shared across all layers
// ============================================================

export type AssetClass = "FOREX" | "INDICES" | "COMMODITIES" | "CRYPTO";
export type Direction = "BULLISH" | "BEARISH" | "NEUTRAL";
export type RiskGrade = "A_PLUS" | "A" | "B" | "C" | "D";
export type AIModel = "CLAUDE" | "GPT" | "GROK" | "GEMINI";
export type SubscriptionTier = "PROFESSIONAL" | "PRO_DESK" | "INSTITUTIONAL";

export interface Signal {
  id: string;
  instrument: string;
  assetClass: AssetClass;
  direction: Direction;
  convictionScore: number; // 0–100
  consensusScore: number;  // 0–100
  riskGrade: RiskGrade;
  timeframe: string;
  sessionContext: string;
  isActive: boolean;
  timestamp: string;
  price?: number;
  priceChange?: number;
  priceChangePct?: number;
}

export interface ConfluenceMatrix {
  rsi: number;
  macd: number;
  emaAlignment: number; // -2 to +2
  atr: number;
  volume: number;       // 0–100 relative
  sentiment: number;    // 0–100
  newsScore: number;    // 0–100
  macroScore: number;   // 0–100
}

export interface AIConsensusResponse {
  model: AIModel;
  role: string;
  bias: Direction;
  rationale: string;
  confidence: number; // 0–100
  keyPoints: string[];
  concerns?: string[];
}

export interface SignalDetail extends Signal {
  confluenceMatrix: ConfluenceMatrix;
  aiResponses: AIConsensusResponse[];
  opportunityZone: string;
  invalidationLevel: string;
  volatilityExpectation: "LOW" | "MODERATE" | "HIGH" | "EXTREME";
  catalysts: string[];
  riskContext: string;
  priorBias?: string;
}

export interface MarketSummary {
  totalInstruments: number;
  activeSignals: number;
  highConviction: number;
  consensusDistribution: {
    aligned: number;
    mixed: number;
    divergent: number;
  };
  assetBreakdown: Record<AssetClass, number>;
  lastUpdated: string;
}

export interface PricingTier {
  id: SubscriptionTier;
  name: string;
  price: number;
  currency: string;
  period: "month";
  description: string;
  features: string[];
  highlighted: boolean;
}
