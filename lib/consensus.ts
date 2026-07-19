// ============================================================
// lib/consensus.ts
// Drawdown Consensus Score (DCS) Engine
// ============================================================

import type { SignalObject } from "@/lib/ai-clients";

export type AgreementLevel = "unanimous" | "majority" | "split" | "degraded";

export interface ConsensusResult {
  dcs: number; // 0-100
  direction: "bullish" | "bearish" | "neutral";
  risk_grade: "A+" | "A" | "B" | "C" | "D";
  agreement_level: AgreementLevel;
  weights_applied: Record<string, number>;
  degraded: boolean;
}

const BASE_WEIGHTS: Record<string, number> = {
  claude: 40,
  gpt: 35,
  grok: 25,
};

// Map risk grades to numeric severity for finding the "most conservative"
const RISK_SEVERITY: Record<string, number> = {
  "A+": 1,
  "A": 2,
  "B": 3,
  "C": 4,
  "D": 5,
};
const REVERSE_RISK_SEVERITY: Record<number, string> = {
  1: "A+", 2: "A", 3: "B", 4: "C", 5: "D",
};

export function computeConsensus(models: Record<string, SignalObject | null>): ConsensusResult {
  // 1. Identify successful models and normalize weights
  const activeWeights: Record<string, number> = {};
  let totalActiveWeight = 0;
  let degraded = false;

  const activeModels: Array<{ id: string; signal: SignalObject; weight: number }> = [];

  for (const [id, weight] of Object.entries(BASE_WEIGHTS)) {
    const sig = models[id];
    if (sig) {
      totalActiveWeight += weight;
      activeModels.push({ id, signal: sig, weight });
    } else {
      degraded = true; // At least one model failed
    }
  }

  if (activeModels.length === 0) {
    throw new Error("All AI models failed to return a signal.");
  }

  // Normalize weights so they sum to 1.0
  activeModels.forEach((m) => {
    activeWeights[m.id] = m.weight / totalActiveWeight;
  });

  // 2. Tally direction votes based on normalized weight
  let bullishWeight = 0;
  let bearishWeight = 0;
  let neutralWeight = 0;
  let highestRiskSeverity = 1;

  activeModels.forEach((m) => {
    if (m.signal.direction === "bullish") bullishWeight += activeWeights[m.id];
    else if (m.signal.direction === "bearish") bearishWeight += activeWeights[m.id];
    else neutralWeight += activeWeights[m.id];

    const severity = RISK_SEVERITY[m.signal.risk_grade] || 4;
    if (severity > highestRiskSeverity) highestRiskSeverity = severity;
  });

  // Determine overall direction (plurality of weighted votes)
  let overallDirection: "bullish" | "bearish" | "neutral" = "neutral";
  if (bullishWeight > bearishWeight && bullishWeight > neutralWeight) overallDirection = "bullish";
  else if (bearishWeight > bullishWeight && bearishWeight > neutralWeight) overallDirection = "bearish";

  // 3. Agreement Multiplier
  let agreement_level: AgreementLevel = "split";
  let multiplier = 0.5;

  const uniqueDirections = new Set(activeModels.map((m) => m.signal.direction));

  if (activeModels.length === 3) {
    if (uniqueDirections.size === 1) {
      agreement_level = "unanimous";
      multiplier = 1.0;
    } else if (uniqueDirections.size === 2) {
      agreement_level = "majority";
      multiplier = 0.75;
    } else {
      agreement_level = "split";
      multiplier = 0.5;
    }
  } else if (activeModels.length === 2) {
    if (uniqueDirections.size === 1) {
      agreement_level = "unanimous";
      multiplier = 1.0;
    } else {
      agreement_level = "split";
      multiplier = 0.5;
    }
  } else {
    // Only 1 model
    agreement_level = "degraded";
    multiplier = 1.0;
  }

  // 4. Compute weighted conviction (1-10 scale)
  // We only sum the conviction of the models that AGREED with the final direction.
  // Wait, the prompt says "weighted_conviction_avg". I'll calculate the weighted average across all models,
  // but if they disagree, the multiplier handles the penalty.
  let weightedConviction = 0;
  activeModels.forEach((m) => {
    weightedConviction += m.signal.conviction * activeWeights[m.id];
  });

  // 5. Compute DCS (0-100 scale)
  // Formula: weighted_conviction_avg × agreement_multiplier × 10
  let dcs = Math.round(weightedConviction * multiplier * 10);
  dcs = Math.max(0, Math.min(100, dcs));

  // 6. Most conservative risk grade
  const finalRiskGrade = REVERSE_RISK_SEVERITY[highestRiskSeverity] as "A+" | "A" | "B" | "C" | "D";

  return {
    dcs,
    direction: overallDirection,
    risk_grade: finalRiskGrade,
    agreement_level,
    weights_applied: activeWeights,
    degraded,
  };
}
