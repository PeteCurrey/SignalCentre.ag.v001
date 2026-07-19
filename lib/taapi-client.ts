// ============================================================
// lib/taapi-client.ts
// TAAPI.IO client for Technical Confluence Dashboard
// ============================================================

import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/client";

const TAAPI_KEY = process.env.TAAPI_API_KEY ?? "";
const TAAPI_BASE = "https://api.taapi.io";

export type Timeframe = "15m" | "1h" | "4h" | "1d";
export type SignalDirection = "bullish" | "bearish" | "neutral";

export interface IndicatorResult {
  name: string;
  value: string;
  signal: SignalDirection;
  score: number; // +1, -1, 0
}

export interface TimeframeConfluence {
  timeframe: Timeframe;
  scorePct: number;
  overallSignal: SignalDirection;
  indicators: IndicatorResult[];
}

export interface ConfluenceResponse {
  symbol: string;
  timeframes: TimeframeConfluence[];
  overallAlignment: {
    bullish: number;
    bearish: number;
    neutral: number;
    total: number;
    aligned: boolean;
  };
  cached: boolean;
  source: string;
}

// ── Cache Layer ──────────────────────────────────────────────

interface CacheRow {
  value: Record<string, unknown>;
  fetched_at: string;
  ttl_seconds: number;
}

async function getCached(key: string): Promise<ConfluenceResponse | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const db = createServiceClient();
    const { data, error } = await db
      .from("api_cache")
      .select("value, fetched_at, ttl_seconds")
      .eq("key", key)
      .single() as { data: CacheRow | null; error: unknown };

    if (error || !data) return null;

    const age = (Date.now() - new Date(data.fetched_at).getTime()) / 1000;
    if (age > data.ttl_seconds) return null;

    return data.value as unknown as ConfluenceResponse;
  } catch {
    return null;
  }
}

async function setCache(key: string, value: ConfluenceResponse, ttlSeconds: number): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const db = createServiceClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db.from("api_cache") as any).upsert(
      { key, value: value as any, fetched_at: new Date().toISOString(), ttl_seconds: ttlSeconds },
      { onConflict: "key" }
    );
  } catch {
    // Non-fatal
  }
}

// ── Helpers ──────────────────────────────────────────────────

function mapSymbolToTaapi(symbol: string): { exchange: string; symbol: string } {
  // Normalize EURUSD -> EUR/USD
  let normalized = symbol.replace(/[^A-Z0-9]/g, "");
  
  const cryptoBases = ["BTC", "ETH", "SOL", "BNB", "XRP", "ADA", "DOGE"];
  const isCrypto = cryptoBases.some((b) => normalized.startsWith(b));

  if (isCrypto) {
    if (!normalized.includes("USDT") && normalized.endsWith("USD")) {
      normalized = normalized.replace("USD", "USDT");
    }
    return { exchange: "binance", symbol: `${normalized.slice(0, -4)}/${normalized.slice(-4)}` }; // e.g. BTC/USDT
  }

  // Forex / Commodities / Indices default to twelvedata (which TAAPI supports well)
  if (normalized.length === 6) {
    return { exchange: "twelvedata", symbol: `${normalized.slice(0, 3)}/${normalized.slice(3)}` }; // e.g. EUR/USD
  }

  return { exchange: "twelvedata", symbol: normalized };
}

// ── TAAPI Fetcher ────────────────────────────────────────────

export async function fetchTechnicalConfluence(symbol: string): Promise<ConfluenceResponse> {
  const cacheKey = `taapi:confluence:${symbol}`;
  
  // 1. Check cache
  const cached = await getCached(cacheKey);
  if (cached) {
    return { ...cached, cached: true, source: "cache" };
  }

  // 2. Map symbol
  const target = mapSymbolToTaapi(symbol);
  const timeframes: Timeframe[] = ["15m", "1h", "4h", "1d"];

  // Fallback / Mock generator if no API key
  if (!TAAPI_KEY || TAAPI_KEY === "your_taapi_api_key") {
    const mock = generateMockConfluence(symbol);
    return { ...mock, cached: false, source: "mock" };
  }

  try {
    // 3. Fetch from TAAPI Bulk Endpoint (Parallel requests per timeframe to ensure compatibility)
    const promises = timeframes.map(async (tf) => {
      const payload = {
        secret: TAAPI_KEY,
        construct: {
          exchange: target.exchange,
          symbol: target.symbol,
          interval: tf,
          indicators: [
            { indicator: "rsi" },
            { indicator: "macd" },
            { indicator: "ema", optInTimePeriod: 20, id: "ema20" },
            { indicator: "ema", optInTimePeriod: 50, id: "ema50" },
            { indicator: "atr" },
            { indicator: "bbands" },
            { indicator: "stochrsi" },
            { indicator: "price" } // Needed for BBands/EMA relative scoring
          ]
        }
      };

      const res = await fetch(`${TAAPI_BASE}/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error(`TAAPI HTTP ${res.status}`);
      const data = await res.json();
      return { tf, data: data.data };
    });

    const results = await Promise.all(promises);

    // 4. Parse and Score
    const scoredTimeframes = results.map((result) => parseTaapiResult(result.tf, result.data));

    // 5. Aggregate
    let bullishCount = 0;
    let bearishCount = 0;
    let neutralCount = 0;

    scoredTimeframes.forEach((tf) => {
      if (tf.overallSignal === "bullish") bullishCount++;
      else if (tf.overallSignal === "bearish") bearishCount++;
      else neutralCount++;
    });

    const response: ConfluenceResponse = {
      symbol,
      timeframes: scoredTimeframes,
      overallAlignment: {
        bullish: bullishCount,
        bearish: bearishCount,
        neutral: neutralCount,
        total: timeframes.length,
        aligned: bullishCount === timeframes.length || bearishCount === timeframes.length,
      },
      cached: false,
      source: "live"
    };

    // Cache for 60s
    await setCache(cacheKey, response, 60);
    return response;

  } catch (error) {
    console.error("[TAAPI Error]", error);
    // Return stale cache if available, else mock
    const stale = await getCached(cacheKey);
    if (stale) return { ...stale, cached: true, source: "stale-cache" };
    return { ...generateMockConfluence(symbol), cached: false, source: "error-fallback" };
  }
}

// ── Scoring Logic ────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseTaapiResult(timeframe: Timeframe, data: any): TimeframeConfluence {
  const indicators: IndicatorResult[] = [];
  let totalScore = 0;

  try {
    // TAAPI bulk returns an array of objects ordered by the requested indicators
    // Or key-value map if IDs were provided. We assume array based on TAAPI bulk specs.
    // If it's an array of results matching the construct array:
    const getVal = (idOrIndex: string | number) => {
      if (Array.isArray(data)) {
        const item = data.find(d => d.id === idOrIndex) || data[idOrIndex as number];
        return item?.result || item || {};
      }
      return data[idOrIndex] || {};
    };

    const rsi = getVal(0).value ?? 50;
    const macd = getVal(1);
    const ema20 = getVal("ema20").value ?? getVal(2).value ?? 0;
    const ema50 = getVal("ema50").value ?? getVal(3).value ?? 0;
    const atr = getVal(4).value ?? 0;
    const bbands = getVal(5);
    const stochrsi = getVal(6);
    const price = getVal(7).value ?? ema20; // Fallback to ema if price fails

    // 1. RSI
    let rsiSig: SignalDirection = "neutral";
    if (rsi > 55) rsiSig = "bullish";
    if (rsi < 45) rsiSig = "bearish";
    indicators.push({ name: "RSI(14)", value: rsi.toFixed(2), signal: rsiSig, score: rsiSig === "bullish" ? 1 : rsiSig === "bearish" ? -1 : 0 });

    // 2. MACD
    const macdVal = macd.valueMACD ?? 0;
    const macdSigVal = macd.valueMACDSignal ?? 0;
    let mSig: SignalDirection = "neutral";
    if (macdVal > macdSigVal && macdVal > 0) mSig = "bullish";
    if (macdVal < macdSigVal && macdVal < 0) mSig = "bearish";
    indicators.push({ name: "MACD(12,26)", value: macdVal.toFixed(4), signal: mSig, score: mSig === "bullish" ? 1 : mSig === "bearish" ? -1 : 0 });

    // 3. EMA(20)
    let e20Sig: SignalDirection = "neutral";
    if (price > ema20) e20Sig = "bullish";
    if (price < ema20) e20Sig = "bearish";
    indicators.push({ name: "EMA(20)", value: ema20.toFixed(4), signal: e20Sig, score: e20Sig === "bullish" ? 1 : e20Sig === "bearish" ? -1 : 0 });

    // 4. EMA(50)
    let e50Sig: SignalDirection = "neutral";
    if (price > ema50) e50Sig = "bullish";
    if (price < ema50) e50Sig = "bearish";
    indicators.push({ name: "EMA(50)", value: ema50.toFixed(4), signal: e50Sig, score: e50Sig === "bullish" ? 1 : e50Sig === "bearish" ? -1 : 0 });

    // 5. ATR (Neutral by default, just represents volatility)
    indicators.push({ name: "ATR(14)", value: atr.toFixed(4), signal: "neutral", score: 0 });

    // 6. BBands
    const upper = bbands.valueUpperBand ?? 0;
    const lower = bbands.valueLowerBand ?? 0;
    const middle = bbands.valueMiddleBand ?? 0;
    let bbSig: SignalDirection = "neutral";
    if (price > middle && price < upper) bbSig = "bullish";
    if (price < middle && price > lower) bbSig = "bearish";
    indicators.push({ name: "BBands(20,2)", value: middle.toFixed(4), signal: bbSig, score: bbSig === "bullish" ? 1 : bbSig === "bearish" ? -1 : 0 });

    // 7. StochRSI
    const fastK = stochrsi.valueFastK ?? 50;
    const fastD = stochrsi.valueFastD ?? 50;
    let stSig: SignalDirection = "neutral";
    if (fastK > fastD && fastK < 80) stSig = "bullish";
    if (fastK < fastD && fastK > 20) stSig = "bearish";
    indicators.push({ name: "StochRSI", value: fastK.toFixed(2), signal: stSig, score: stSig === "bullish" ? 1 : stSig === "bearish" ? -1 : 0 });

    // Calculate timeframe score
    indicators.forEach(i => totalScore += i.score);
    
    // Max score is 6 (ATR is 0)
    // Map from [-6, +6] to [0%, 100%]
    const maxScore = 6;
    let scorePct = Math.round(((totalScore + maxScore) / (maxScore * 2)) * 100);
    // clamp
    scorePct = Math.max(0, Math.min(100, scorePct));

    let overallSignal: SignalDirection = "neutral";
    if (scorePct >= 66) overallSignal = "bullish";
    else if (scorePct <= 33) overallSignal = "bearish";

    return { timeframe, scorePct, overallSignal, indicators };

  } catch (err) {
    // If parsing fails, return a safe fallback
    console.error("Parse error in TAAPI result", err);
    return { timeframe, scorePct: 50, overallSignal: "neutral", indicators: [] };
  }
}

// ── Mock Generator ─────────────────────────────────────────────

function generateMockConfluence(symbol: string): ConfluenceResponse {
  const isBullish = Math.random() > 0.5;
  const timeframes: Timeframe[] = ["15m", "1h", "4h", "1d"];
  
  const tfData = timeframes.map((tf) => {
    // Generate realistic looking mock values
    const pct = isBullish ? 60 + Math.random() * 35 : 10 + Math.random() * 30;
    const os = pct >= 66 ? "bullish" : pct <= 33 ? "bearish" : "neutral";
    
    const mkInd = (name: string, val: string, sc: number) => ({
      name, value: val,
      signal: sc > 0 ? "bullish" : sc < 0 ? "bearish" : "neutral" as SignalDirection,
      score: sc
    });

    const b = isBullish ? 1 : -1;

    return {
      timeframe: tf,
      scorePct: Math.round(pct),
      overallSignal: os as SignalDirection,
      indicators: [
        mkInd("RSI(14)", (isBullish ? 62.4 : 38.1).toString(), b),
        mkInd("MACD(12,26)", (isBullish ? 0.004 : -0.002).toString(), b),
        mkInd("EMA(20)", "1.0845", b),
        mkInd("EMA(50)", "1.0820", b),
        mkInd("ATR(14)", "0.0012", 0),
        mkInd("BBands(20,2)", "1.0830", b),
        mkInd("StochRSI", (isBullish ? 82.1 : 15.4).toString(), b),
      ]
    };
  });

  const bullishCount = tfData.filter(t => t.overallSignal === "bullish").length;
  const bearishCount = tfData.filter(t => t.overallSignal === "bearish").length;

  return {
    symbol,
    timeframes: tfData,
    overallAlignment: {
      bullish: bullishCount,
      bearish: bearishCount,
      neutral: 4 - bullishCount - bearishCount,
      total: 4,
      aligned: bullishCount === 4 || bearishCount === 4,
    },
    cached: false,
    source: "mock"
  };
}
