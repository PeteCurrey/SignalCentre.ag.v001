// ============================================================
// lib/crypto-intelligence-client.ts
// Crypto Intelligence Hub — CoinGecko + CoinGlass data layer
// Section D — signalcentre.co.uk
// ============================================================

import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/client";

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";
const COINGLASS_BASE = "https://open-api.coinglass.com/public/v2";

const COINGECKO_KEY = process.env.COINGECKO_API_KEY ?? "";
const COINGLASS_KEY = process.env.COINGLASS_API_KEY ?? "";

// ── Symbol Maps ───────────────────────────────────────────────

export const CRYPTO_SYMBOLS = ["BTC", "ETH", "SOL"] as const;
export type CryptoSymbol = (typeof CRYPTO_SYMBOLS)[number];

const COINGECKO_IDS: Record<CryptoSymbol, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
};

const COINGLASS_SYMBOLS: Record<CryptoSymbol, string> = {
  BTC: "BTC",
  ETH: "ETH",
  SOL: "SOL",
};

// ── Types ─────────────────────────────────────────────────────

export interface FearGreedData {
  value: number; // 0-100
  label: string; // "Extreme Fear" | "Fear" | "Neutral" | "Greed" | "Extreme Greed"
}

export interface SparklinePoint {
  timestamp: number;
  price: number;
}

export interface MarketData {
  price: number;
  change24h: number;        // percent
  marketCap: number;
  btcDominance: number | null;
  fearGreed: FearGreedData;
  sparkline: SparklinePoint[];
}

export interface DerivativesData {
  fundingRate: number;      // percent, e.g. 0.01 = 0.01%
  fundingRateLabel: string;
  openInterest: number;     // USD
  openInterestChange24h: number; // percent
  longRatio: number;        // 0-1
  shortRatio: number;       // 0-1
}

export interface DCSFactor {
  name: string;
  contribution: number;     // actual raw score contribution: -2, -1, 0, +1, +2
  max: number;              // max possible absolute value
  label: string;
}

export interface CryptoIntelligenceResponse {
  symbol: CryptoSymbol;
  dcsScore: number;         // 0-100
  direction: "BULLISH" | "BEARISH" | "NEUTRAL";
  riskGrade: "A+" | "A" | "B" | "C" | "D";
  market: MarketData;
  derivatives: DerivativesData;
  dcsFactors: DCSFactor[];
  extremeFunding: boolean;
  cached: boolean;
  fetchedAt: string;
}

// ── Fear & Greed Label ────────────────────────────────────────

function getFearGreedLabel(value: number): string {
  if (value <= 20) return "Extreme Fear";
  if (value <= 40) return "Fear";
  if (value <= 60) return "Neutral";
  if (value <= 80) return "Greed";
  return "Extreme Greed";
}

// ── Composite Scoring ─────────────────────────────────────────

function computeDCS(
  change24h: number,
  fundingRate: number,
  oiChange: number,
  pricePositive: boolean,
  fearGreedValue: number
): { score: number; factors: DCSFactor[] } {
  const factors: DCSFactor[] = [];

  // 1. Price trend: +2 if positive, -2 if negative
  const priceScore = change24h >= 0 ? 2 : -2;
  factors.push({
    name: "Price Trend",
    contribution: priceScore,
    max: 2,
    label: change24h >= 0 ? "Positive 24h" : "Negative 24h",
  });

  // 2. Funding rate: >0.01% = +2 (longs paying), <-0.01% = -2 (shorts paying)
  let fundingScore = 0;
  if (fundingRate > 0.01) fundingScore = 2;
  else if (fundingRate < -0.01) fundingScore = -2;
  factors.push({
    name: "Funding Rate",
    contribution: fundingScore,
    max: 2,
    label:
      fundingRate > 0.01
        ? "Longs paying premium"
        : fundingRate < -0.01
        ? "Shorts paying premium"
        : "Neutral funding",
  });

  // 3. OI change: rising OI + rising price = +2, else 0 or -2
  let oiScore = 0;
  if (oiChange > 0 && pricePositive) oiScore = 2;
  else if (oiChange < 0 && !pricePositive) oiScore = -2;
  factors.push({
    name: "Open Interest",
    contribution: oiScore,
    max: 2,
    label:
      oiScore === 2
        ? "Rising OI + price"
        : oiScore === -2
        ? "Falling OI + price"
        : "OI divergence",
  });

  // 4. Fear & Greed: >60 = +1, <40 = -1
  let fgScore = 0;
  if (fearGreedValue > 60) fgScore = 1;
  else if (fearGreedValue < 40) fgScore = -1;
  factors.push({
    name: "Fear & Greed",
    contribution: fgScore,
    max: 1,
    label:
      fearGreedValue > 60
        ? "Greed territory"
        : fearGreedValue < 40
        ? "Fear territory"
        : "Neutral sentiment",
  });

  const rawSum = priceScore + fundingScore + oiScore + fgScore;
  // Normalise: max possible = 7, min = -7 → range 14
  const normalized = Math.round(((rawSum + 7) / 14) * 100);
  const clamped = Math.max(0, Math.min(100, normalized));

  return { score: clamped, factors };
}

function getDirection(score: number): "BULLISH" | "BEARISH" | "NEUTRAL" {
  if (score >= 60) return "BULLISH";
  if (score <= 40) return "BEARISH";
  return "NEUTRAL";
}

function getRiskGrade(score: number): "A+" | "A" | "B" | "C" | "D" {
  if (score >= 80) return "A+";
  if (score >= 65) return "A";
  if (score >= 50) return "B";
  if (score >= 35) return "C";
  return "D";
}

// ── Supabase Cache ────────────────────────────────────────────

const CACHE_TTL = 300; // 5 minutes

// ── Cache Row type ───────────────────────────────────────────

interface CacheRow {
  value: Record<string, unknown>;
  fetched_at: string;
  ttl_seconds: number;
}

async function getCached(key: string): Promise<CryptoIntelligenceResponse | null> {
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
    if (age > CACHE_TTL) return null;

    return data.value as unknown as CryptoIntelligenceResponse;
  } catch {
    return null;
  }
}

async function setCached(key: string, value: CryptoIntelligenceResponse): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const db = createServiceClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db.from("api_cache") as any).upsert(
      { key, value: value as any, fetched_at: new Date().toISOString(), ttl_seconds: CACHE_TTL },
      { onConflict: "key" }
    );
  } catch {
    // non-fatal
  }
}

// ── CoinGecko Fetcher ─────────────────────────────────────────

async function fetchCoinGeckoData(
  symbol: CryptoSymbol
): Promise<{ market: MarketData | null; globalDominance: number | null }> {
  const id = COINGECKO_IDS[symbol];
  const headers: Record<string, string> = COINGECKO_KEY
    ? { "x-cg-demo-api-key": COINGECKO_KEY }
    : {};

  try {
    const [coinRes, chartRes, globalRes] = await Promise.allSettled([
      fetch(`${COINGECKO_BASE}/coins/${id}?localization=false&tickers=false&community_data=false&developer_data=false`, { headers }),
      fetch(`${COINGECKO_BASE}/coins/${id}/market_chart?vs_currency=usd&days=1&interval=hourly`, { headers }),
      symbol === "BTC"
        ? fetch(`${COINGECKO_BASE}/global`, { headers })
        : Promise.resolve(null),
    ]);

    // Parse coin data
    let price = 0;
    let change24h = 0;
    let marketCap = 0;
    let fearGreed: FearGreedData = { value: 50, label: "Neutral" };

    if (coinRes.status === "fulfilled" && coinRes.value?.ok) {
      const coin = await coinRes.value.json();
      price = coin.market_data?.current_price?.usd ?? 0;
      change24h = coin.market_data?.price_change_percentage_24h ?? 0;
      marketCap = coin.market_data?.market_cap?.usd ?? 0;
    }

    // Parse sparkline
    let sparkline: SparklinePoint[] = [];
    if (chartRes.status === "fulfilled" && chartRes.value?.ok) {
      const chart = await chartRes.value.json();
      sparkline = (chart.prices ?? []).map(([ts, p]: [number, number]) => ({
        timestamp: ts,
        price: p,
      }));
    }

    // BTC dominance from global
    let btcDominance: number | null = null;
    if (
      symbol === "BTC" &&
      globalRes.status === "fulfilled" &&
      globalRes.value !== null &&
      (globalRes.value as Response).ok
    ) {
      const globalData = await (globalRes.value as Response).json();
      btcDominance = globalData.data?.market_cap_percentage?.btc ?? null;
    }

    return {
      market: { price, change24h, marketCap, btcDominance, fearGreed, sparkline },
      globalDominance: btcDominance,
    };
  } catch {
    return { market: null, globalDominance: null };
  }
}

// ── Fear & Greed Fetcher ─────────────────────────────────────
// Uses the public alternative.me Fear & Greed API (no key needed)

async function fetchFearGreed(): Promise<FearGreedData> {
  try {
    const res = await fetch("https://api.alternative.me/fng/?limit=1");
    if (!res.ok) throw new Error("FG fetch failed");
    const json = await res.json();
    const value = parseInt(json.data?.[0]?.value ?? "50", 10);
    return { value, label: getFearGreedLabel(value) };
  } catch {
    return { value: 50, label: "Neutral" };
  }
}

// ── CoinGlass Fetcher ─────────────────────────────────────────

async function fetchCoinGlassData(symbol: CryptoSymbol): Promise<DerivativesData | null> {
  const cgSymbol = COINGLASS_SYMBOLS[symbol];
  const headers: Record<string, string> = COINGLASS_KEY
    ? { "coinglassSecret": COINGLASS_KEY }
    : {};

  try {
    const [fundingRes, oiRes, lsRes] = await Promise.allSettled([
      fetch(`${COINGLASS_BASE}/funding?symbol=${cgSymbol}`, { headers }),
      fetch(`${COINGLASS_BASE}/open_interest?symbol=${cgSymbol}`, { headers }),
      fetch(`${COINGLASS_BASE}/long_short?symbol=${cgSymbol}&period=0`, { headers }),
    ]);

    let fundingRate = 0;
    let openInterest = 0;
    let openInterestChange24h = 0;
    let longRatio = 0.5;
    let shortRatio = 0.5;

    if (fundingRes.status === "fulfilled" && fundingRes.value?.ok) {
      const json = await fundingRes.value.json();
      // Average funding rate across exchanges
      const rates: number[] = (json.data ?? []).map((d: { fundingRate?: number; rate?: number }) =>
        (d.fundingRate ?? d.rate ?? 0) * 100
      );
      if (rates.length > 0) {
        fundingRate = rates.reduce((a: number, b: number) => a + b, 0) / rates.length;
      }
    }

    if (oiRes.status === "fulfilled" && oiRes.value?.ok) {
      const json = await oiRes.value.json();
      const oiData = json.data?.[0] ?? {};
      openInterest = oiData.openInterest ?? 0;
      openInterestChange24h = oiData.h24Change ?? oiData.change24h ?? 0;
    }

    if (lsRes.status === "fulfilled" && lsRes.value?.ok) {
      const json = await lsRes.value.json();
      const lsData = json.data ?? {};
      longRatio = lsData.longRatio ?? lsData.longAccount ?? 0.5;
      shortRatio = 1 - longRatio;
    }

    const fundingLabel =
      fundingRate > 0.01
        ? "Longs paying premium — market leaning bullish"
        : fundingRate < -0.01
        ? "Shorts paying premium — market leaning bearish"
        : "Balanced funding — no strong directional bias";

    return {
      fundingRate,
      fundingRateLabel: fundingLabel,
      openInterest,
      openInterestChange24h,
      longRatio,
      shortRatio,
    };
  } catch {
    return null;
  }
}

// ── Mock Data Fallback ────────────────────────────────────────

function getMockData(symbol: CryptoSymbol): CryptoIntelligenceResponse {
  const seeds: Record<CryptoSymbol, { price: number; change: number; fg: number; fr: number; oi: number; ls: number }> = {
    BTC: { price: 67_420, change: 2.34, fg: 68, fr: 0.0125, oi: 28_400_000_000, ls: 0.54 },
    ETH: { price: 3_512, change: -0.87, fg: 61, fr: 0.0082, oi: 11_200_000_000, ls: 0.49 },
    SOL: { price: 182.4, change: 4.12, fg: 72, fr: 0.0198, oi: 2_800_000_000, ls: 0.57 },
  };

  const s = seeds[symbol];

  // Generate mock sparkline (24 hourly points)
  const now = Date.now();
  const sparkline: SparklinePoint[] = Array.from({ length: 24 }, (_, i) => {
    const noise = (Math.sin(i * 0.8) * 0.02 + (Math.random() - 0.5) * 0.01) * s.price;
    return {
      timestamp: now - (23 - i) * 3_600_000,
      price: s.price + noise,
    };
  });

  const fearGreed: FearGreedData = { value: s.fg, label: getFearGreedLabel(s.fg) };

  const { score, factors } = computeDCS(
    s.change,
    s.fr,
    5.2, // mock OI change
    s.change > 0,
    s.fg
  );

  return {
    symbol,
    dcsScore: score,
    direction: getDirection(score),
    riskGrade: getRiskGrade(score),
    market: {
      price: s.price,
      change24h: s.change,
      marketCap: s.price * (symbol === "BTC" ? 19_700_000 : symbol === "ETH" ? 120_000_000 : 450_000_000),
      btcDominance: symbol === "BTC" ? 52.4 : null,
      fearGreed,
      sparkline,
    },
    derivatives: {
      fundingRate: s.fr,
      fundingRateLabel:
        s.fr > 0.01
          ? "Longs paying premium — market leaning bullish"
          : s.fr < -0.01
          ? "Shorts paying premium — market leaning bearish"
          : "Balanced funding — no strong directional bias",
      openInterest: s.oi,
      openInterestChange24h: 5.2,
      longRatio: s.ls,
      shortRatio: 1 - s.ls,
    },
    dcsFactors: factors,
    extremeFunding: Math.abs(s.fr) > 0.05,
    cached: false,
    fetchedAt: new Date().toISOString(),
  };
}

// ── Main Fetch Function ───────────────────────────────────────

export async function fetchCryptoIntelligence(
  symbol: CryptoSymbol
): Promise<CryptoIntelligenceResponse> {
  const cacheKey = `crypto-intelligence:${symbol}`;

  // Check cache
  const cached = await getCached(cacheKey);
  if (cached) return { ...cached, cached: true };

  // No API keys → return mock data
  if (!COINGECKO_KEY && !COINGLASS_KEY) {
    const mock = getMockData(symbol);
    return mock;
  }

  try {
    // Fetch all data in parallel
    const [cgData, cglass, fearGreed] = await Promise.allSettled([
      fetchCoinGeckoData(symbol),
      fetchCoinGlassData(symbol),
      fetchFearGreed(),
    ]);

    const marketRaw = cgData.status === "fulfilled" ? cgData.value.market : null;
    const derivatives =
      cglass.status === "fulfilled" && cglass.value !== null
        ? cglass.value
        : getMockData(symbol).derivatives;

    const fg =
      fearGreed.status === "fulfilled"
        ? fearGreed.value
        : { value: 50, label: "Neutral" as const };

    // Merge fear & greed into market
    const market = marketRaw
      ? { ...marketRaw, fearGreed: fg }
      : { ...getMockData(symbol).market, fearGreed: fg };

    const { score, factors } = computeDCS(
      market.change24h,
      derivatives.fundingRate,
      derivatives.openInterestChange24h,
      market.change24h > 0,
      fg.value
    );

    const result: CryptoIntelligenceResponse = {
      symbol,
      dcsScore: score,
      direction: getDirection(score),
      riskGrade: getRiskGrade(score),
      market,
      derivatives,
      dcsFactors: factors,
      extremeFunding: Math.abs(derivatives.fundingRate) > 0.05,
      cached: false,
      fetchedAt: new Date().toISOString(),
    };

    await setCached(cacheKey, result);
    return result;
  } catch {
    return getMockData(symbol);
  }
}
