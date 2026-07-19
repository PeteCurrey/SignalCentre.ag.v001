import { createServerClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { getLiveQuotes } from "@/lib/market-data";
import { Signal, SignalDetail } from "@/lib/types";

export async function getActiveSignals(assetClassFilter?: string): Promise<Signal[]> {
  let signals: any[] = [];
  
  if (isSupabaseConfigured()) {
    try {
      const db = createServerClient();
      let query = db.from("signals").select("*").order("created_at", { ascending: false });
      
      if (assetClassFilter) {
        query = query.eq("asset_class", assetClassFilter);
      }
      
      const { data } = await query;
      if (data) signals = data;
    } catch (e) {
      console.error("Failed to fetch signals", e);
    }
  }

  const activeSignals = signals.filter(s => s.outcome === "pending" || !s.outcome);
  const symbols = Array.from(new Set(activeSignals.map(s => s.instrument)));
  const quotes = await getLiveQuotes(symbols);

  return activeSignals.map(s => {
    const q = quotes[s.instrument];
    return {
      id: s.id,
      instrument: s.instrument,
      assetClass: (s.asset_class?.toUpperCase() || "FOREX") as any,
      direction: (s.direction?.toUpperCase() || "NEUTRAL") as any,
      convictionScore: s.conviction || 0,
      consensusScore: s.consensus_score || 0,
      riskGrade: (s.risk_grade || "C") as any,
      timeframe: s.timeframe || "1H",
      sessionContext: s.session_context || "Active Session",
      isActive: true,
      timestamp: s.created_at || new Date().toISOString(),
      price: q?.price,
      priceChange: q?.change,
      priceChangePct: q?.changePct,
    };
  });
}

export async function getSignalDetail(instrumentSlug: string): Promise<SignalDetail | null> {
  // Try to find the active signal for this instrument
  let signalData: any = null;
  if (isSupabaseConfigured()) {
    try {
      const db = createServerClient();
      // First find all active signals, then filter by slug (easier than doing slug translation in SQL)
      const { data } = await db.from("signals").select("*").in("outcome", ["pending", null]).order("created_at", { ascending: false });
      if (data) {
        // Need to import toSlug here but since this is a server function, it's ok.
        // Or simply do a string comparison
        const targetSlug = instrumentSlug.toLowerCase();
        signalData = data.find(s => s.instrument.toLowerCase().replace(/[\/\s_]+/g, "-") === targetSlug);
      }
    } catch (e) {
      console.error("Failed to fetch signal detail", e);
    }
  }

  if (!signalData) return null;

  const quotes = await getLiveQuotes([signalData.instrument]);
  const q = quotes[signalData.instrument];

  return {
    id: signalData.id,
    instrument: signalData.instrument,
    assetClass: (signalData.asset_class?.toUpperCase() || "FOREX") as any,
    direction: (signalData.direction?.toUpperCase() || "NEUTRAL") as any,
    convictionScore: signalData.conviction || 0,
    consensusScore: signalData.consensus_score || 0,
    riskGrade: (signalData.risk_grade || "C") as any,
    timeframe: signalData.timeframe || "1H",
    sessionContext: signalData.session_context || "Active Session",
    isActive: true,
    timestamp: signalData.created_at || new Date().toISOString(),
    price: q?.price,
    priceChange: q?.change,
    priceChangePct: q?.changePct,
    
    // Default placeholder matrices since these aren't in Supabase base 'signals' yet
    confluenceMatrix: {
      rsi: 50,
      macd: 0,
      emaAlignment: 0,
      atr: 0,
      volume: 50,
      sentiment: 50,
      newsScore: 50,
      macroScore: 50,
    },
    aiResponses: [],
    opportunityZone: "N/A",
    invalidationLevel: "N/A",
    volatilityExpectation: "MODERATE",
    catalysts: [],
    riskContext: "N/A",
  };
}

export const PRICING_TIERS: import("@/lib/types").PricingTier[] = [
  {
    id: "FOUNDATION",
    name: "Foundation",
    price: 49,
    currency: "USD",
    period: "month",
    description: "Core access for individual traders.",
    features: [
      "Live Signals Feed",
      "Basic AI Consensus",
      "Standard Timeframes (4H+)",
    ],
    highlighted: false,
  },
  {
    id: "EDGE",
    name: "Edge",
    price: 149,
    currency: "USD",
    period: "month",
    description: "Advanced intelligence for active traders.",
    features: [
      "Everything in Foundation",
      "Full Confluence Matrix",
      "Intraday Timeframes (15m, 1H)",
      "Priority Alerts",
    ],
    highlighted: true,
  },
  {
    id: "FLOOR",
    name: "Floor",
    price: 499,
    currency: "USD",
    period: "month",
    description: "Institutional-grade flow and analysis.",
    features: [
      "Everything in Edge",
      "Raw AI Rationale & Logs",
      "Direct Analyst Access",
      "API Access (Coming Soon)",
    ],
    ],
    highlighted: false,
  },
];

export const ASSET_COVERAGE = [
  { class: "FOREX", count: 18, description: "Major, minor and exotic pairs with deep liquidity.", instruments: ["EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD", "USD/CAD", "NZD/USD"] },
  { class: "INDICES", count: 12, description: "Global equity benchmarks and sector indices.", instruments: ["US500", "US30", "UK100", "GER40", "JPN225", "AUS200"] },
  { class: "COMMODITIES", count: 7, description: "Energy, metals and soft commodities.", instruments: ["Gold", "Silver", "WTI Crude", "Brent Crude", "Natural Gas", "Copper"] },
  { class: "CRYPTO", count: 10, description: "Large cap digital assets with on-chain data.", instruments: ["BTC", "ETH", "SOL", "BNB", "XRP", "ADA"] },
];

export async function getMarketSummary() {
  const signals = await getActiveSignals();
  return {
    totalInstruments: signals.length,
    activeSignals: signals.length,
    highConviction: signals.filter(s => s.convictionScore >= 70).length,
    consensusDistribution: {
      aligned: signals.filter(s => s.consensusScore >= 70).length,
      mixed: signals.filter(s => s.consensusScore > 40 && s.consensusScore < 70).length,
      divergent: signals.filter(s => s.consensusScore <= 40).length,
    },
    assetBreakdown: {
      FOREX: signals.filter(s => s.assetClass === "FOREX").length,
      INDICES: signals.filter(s => s.assetClass === "INDICES").length,
      COMMODITIES: signals.filter(s => s.assetClass === "COMMODITIES").length,
      CRYPTO: signals.filter(s => s.assetClass === "CRYPTO").length,
    },
    lastUpdated: new Date().toISOString(),
  };
}
