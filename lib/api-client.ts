// ============================================================
// lib/api-client.ts
// Typed wrappers for Twelve Data and Finnhub APIs
//
// Rate limits:
//   Twelve Data Basic: 800 calls/day, 8 calls/min
//   Finnhub Free:      60 calls/min
//
// Strategy:
//   All calls check Supabase api_cache first.
//   Cache TTLs are set conservatively to protect the daily limit.
//   On API error, returns last cached value if available.
// ============================================================

import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/client";

// ── Config ───────────────────────────────────────────────────
const TD_BASE  = "https://api.twelvedata.com";
const FH_BASE  = "https://finnhub.io/api/v1";

const TD_KEY = process.env.TWELVE_DATA_API_KEY ?? "";
const FH_KEY = process.env.FINNHUB_API_KEY ?? "";

// ── Shared types ─────────────────────────────────────────────

export interface ApiResponse<T> {
  symbol: string;
  timestamp: string;
  data: T;
  source: "live" | "cache" | "fallback";
  cached: boolean;
  error?: string;
}

export interface OHLCVCandle {
  datetime: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OHLCVPayload {
  candles: OHLCVCandle[];
  interval: string;
  currency: string;
}

export interface IndicatorPayload {
  rsi: {
    value: number;
    signal: "overbought" | "oversold" | "neutral";
  };
  macd: {
    macd: number;
    signal: number;
    histogram: number;
    crossover: "bullish" | "bearish" | "none";
  };
  ema20: number;
  ema50: number;
  ema200: number;
  atr: number;
  bbands: {
    upper: number;
    middle: number;
    lower: number;
    bandwidth: number;
    percentB: number;
  };
  emaAlignment: "strong_bullish" | "bullish" | "neutral" | "bearish" | "strong_bearish";
}

export interface QuotePayload {
  price: number;
  open: number;
  high: number;
  low: number;
  close: number;
  previousClose: number;
  change: number;
  changePct: number;
  volume: number;
  averageVolume: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  currency: string;
  exchange: string;
  marketStatus: "open" | "closed" | "extended";
}

export interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  source: string;
  url: string;
  image: string;
  category: string;
  datetime: number;
  related: string;
}

export interface FundamentalsPayload {
  quote: {
    currentPrice: number;
    change: number;
    changePct: number;
    high: number;
    low: number;
    open: number;
    previousClose: number;
  };
  news: NewsItem[];
}

// ── Cache layer ───────────────────────────────────────────────

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

// Explicit row shape avoids TypeScript narrowing api_cache selects to `never`
interface CacheRow {
  value: Record<string, unknown>;
  fetched_at: string;
  ttl_seconds: number;
}

async function getCached<T>(key: string): Promise<T | null> {
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

    return data.value as unknown as T;
  } catch {
    return null;
  }
}

async function setCache(key: string, value: JsonValue, ttlSeconds: number): Promise<void> {
  if (!isSupabaseConfigured()) return;

  try {
    const db = createServiceClient();
    // Cast to any to bypass strict Supabase insert typing — the schema is correct
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db.from("api_cache") as any).upsert(
      { key, value, fetched_at: new Date().toISOString(), ttl_seconds: ttlSeconds },
      { onConflict: "key" }
    );
  } catch {
    // Cache write failure is non-fatal
  }
}

// ── HTTP helper ───────────────────────────────────────────────

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    next: { revalidate: 0 }, // Always fetch fresh (cache managed by us)
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText} — ${url}`);
  }

  const json = await res.json();

  // Twelve Data error format
  if (json?.status === "error") {
    throw new Error(`[Twelve Data] ${json.message ?? "Unknown error"}`);
  }

  return json as T;
}

// ── EMA alignment helper ─────────────────────────────────────

function classifyEmaAlignment(
  price: number,
  ema20: number,
  ema50: number,
  ema200: number
): IndicatorPayload["emaAlignment"] {
  const above20 = price > ema20;
  const above50 = price > ema50;
  const above200 = price > ema200;
  const ordered = ema20 > ema50 && ema50 > ema200;
  const invertedOrder = ema20 < ema50 && ema50 < ema200;

  if (above20 && above50 && above200 && ordered) return "strong_bullish";
  if (above20 && above50 && above200) return "bullish";
  if (!above20 && !above50 && !above200 && invertedOrder) return "strong_bearish";
  if (!above20 && !above50 && !above200) return "bearish";
  return "neutral";
}

// ── Twelve Data — OHLCV ──────────────────────────────────────

/**
 * Fetch OHLCV candlestick data from Twelve Data.
 * Cached for 60 seconds.
 */
export async function fetchOHLCV(
  symbol: string,
  interval: "1min" | "5min" | "15min" | "30min" | "1h" | "4h" | "1day" | "1week" = "1h",
  outputSize: number = 50
): Promise<ApiResponse<OHLCVPayload>> {
  if (!TD_KEY) {
    return {
      symbol,
      timestamp: new Date().toISOString(),
      data: { candles: [], interval, currency: "USD" },
      source: "fallback",
      cached: false,
      error: "TWELVE_DATA_API_KEY not configured",
    };
  }

  const cacheKey = `td:ohlcv:${symbol}:${interval}`;
  const TTL = 60; // 1 minute

  // Check cache first
  const cached = await getCached<OHLCVPayload>(cacheKey);
  if (cached) {
    return { symbol, timestamp: new Date().toISOString(), data: cached, source: "cache", cached: true };
  }

  try {
    const url = `${TD_BASE}/time_series?symbol=${symbol}&interval=${interval}&outputsize=${outputSize}&apikey=${TD_KEY}`;
    const raw = await fetchJson<{
      meta: { symbol: string; interval: string; currency: string };
      values: Array<{ datetime: string; open: string; high: string; low: string; close: string; volume: string }>;
    }>(url);

    const payload: OHLCVPayload = {
      interval: raw.meta.interval,
      currency: raw.meta.currency,
      candles: raw.values.map((v) => ({
        datetime: v.datetime,
        open: parseFloat(v.open),
        high: parseFloat(v.high),
        low: parseFloat(v.low),
        close: parseFloat(v.close),
        volume: parseInt(v.volume, 10),
      })),
    };

    await setCache(cacheKey, payload as unknown as JsonValue, TTL);

    return { symbol, timestamp: new Date().toISOString(), data: payload, source: "live", cached: false };
  } catch (err) {
    const stale = await getCached<OHLCVPayload>(cacheKey);
    return {
      symbol,
      timestamp: new Date().toISOString(),
      data: stale ?? { candles: [], interval, currency: "USD" },
      source: stale ? "cache" : "fallback",
      cached: !!stale,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ── Twelve Data — Technical Indicators ───────────────────────

/**
 * Fetch all technical indicators in one consolidated payload.
 * Makes individual calls for each indicator and combines them.
 * Cached for 120 seconds (conserves daily quota).
 */
export async function fetchIndicators(
  symbol: string,
  interval: "1h" | "4h" | "1day" = "4h"
): Promise<ApiResponse<IndicatorPayload>> {
  if (!TD_KEY) {
    return {
      symbol,
      timestamp: new Date().toISOString(),
      data: buildFallbackIndicators(),
      source: "fallback",
      cached: false,
      error: "TWELVE_DATA_API_KEY not configured",
    };
  }

  const cacheKey = `td:indicators:${symbol}:${interval}`;
  const TTL = 120; // 2 minutes — indicators change slowly

  const cached = await getCached<IndicatorPayload>(cacheKey);
  if (cached) {
    return { symbol, timestamp: new Date().toISOString(), data: cached, source: "cache", cached: true };
  }

  try {
    const base = `${TD_BASE}`;
    const p = `symbol=${symbol}&interval=${interval}&apikey=${TD_KEY}`;

    // Parallel calls — Twelve Data allows batching on paid plans
    // On Basic, we make concurrent calls (within the 8/min rate limit for this batch)
    const [rsiRaw, macdRaw, ema20Raw, ema50Raw, ema200Raw, atrRaw, bbandsRaw, quoteRaw] =
      await Promise.all([
        fetchJson<{ values: Array<{ rsi: string }> }>(`${base}/rsi?${p}&time_period=14`),
        fetchJson<{ values: Array<{ macd: string; macd_signal: string; macd_hist: string }> }>(`${base}/macd?${p}&fast_period=12&slow_period=26&signal_period=9`),
        fetchJson<{ values: Array<{ ema: string }> }>(`${base}/ema?${p}&time_period=20`),
        fetchJson<{ values: Array<{ ema: string }> }>(`${base}/ema?${p}&time_period=50`),
        fetchJson<{ values: Array<{ ema: string }> }>(`${base}/ema?${p}&time_period=200`),
        fetchJson<{ values: Array<{ atr: string }> }>(`${base}/atr?${p}&time_period=14`),
        fetchJson<{ values: Array<{ upper_band: string; middle_band: string; lower_band: string }> }>(`${base}/bbands?${p}&time_period=20&sd=2`),
        fetchJson<{ close: string }>(`${base}/price?${p}`),
      ]);

    const rsiValue  = parseFloat(rsiRaw.values[0].rsi);
    const macdValue = parseFloat(macdRaw.values[0].macd);
    const macdSig   = parseFloat(macdRaw.values[0].macd_signal);
    const macdHist  = parseFloat(macdRaw.values[0].macd_hist);
    const ema20     = parseFloat(ema20Raw.values[0].ema);
    const ema50     = parseFloat(ema50Raw.values[0].ema);
    const ema200    = parseFloat(ema200Raw.values[0].ema);
    const atr       = parseFloat(atrRaw.values[0].atr);
    const bbUpper   = parseFloat(bbandsRaw.values[0].upper_band);
    const bbMiddle  = parseFloat(bbandsRaw.values[0].middle_band);
    const bbLower   = parseFloat(bbandsRaw.values[0].lower_band);
    const price     = parseFloat(quoteRaw.close);

    const bbBandwidth = ((bbUpper - bbLower) / bbMiddle) * 100;
    const bbPercentB  = (price - bbLower) / (bbUpper - bbLower);

    // Previous MACD histogram to detect crossover
    const prevMacdHist = parseFloat(macdRaw.values[1]?.macd_hist ?? "0");

    const payload: IndicatorPayload = {
      rsi: {
        value: rsiValue,
        signal: rsiValue >= 70 ? "overbought" : rsiValue <= 30 ? "oversold" : "neutral",
      },
      macd: {
        macd: macdValue,
        signal: macdSig,
        histogram: macdHist,
        crossover:
          macdHist > 0 && prevMacdHist <= 0 ? "bullish" :
          macdHist < 0 && prevMacdHist >= 0 ? "bearish" : "none",
      },
      ema20,
      ema50,
      ema200,
      atr,
      bbands: {
        upper: bbUpper,
        middle: bbMiddle,
        lower: bbLower,
        bandwidth: bbBandwidth,
        percentB: bbPercentB,
      },
      emaAlignment: classifyEmaAlignment(price, ema20, ema50, ema200),
    };

    await setCache(cacheKey, payload as unknown as JsonValue, TTL);

    return { symbol, timestamp: new Date().toISOString(), data: payload, source: "live", cached: false };
  } catch (err) {
    const stale = await getCached<IndicatorPayload>(cacheKey);
    return {
      symbol,
      timestamp: new Date().toISOString(),
      data: stale ?? buildFallbackIndicators(),
      source: stale ? "cache" : "fallback",
      cached: !!stale,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

function buildFallbackIndicators(): IndicatorPayload {
  return {
    rsi: { value: 50, signal: "neutral" },
    macd: { macd: 0, signal: 0, histogram: 0, crossover: "none" },
    ema20: 0,
    ema50: 0,
    ema200: 0,
    atr: 0,
    bbands: { upper: 0, middle: 0, lower: 0, bandwidth: 0, percentB: 0.5 },
    emaAlignment: "neutral",
  };
}

// ── Twelve Data — Quote ───────────────────────────────────────

/**
 * Fetch current quote data.
 * Cached for 30 seconds — higher priority freshness for price display.
 */
export async function fetchQuote(symbol: string): Promise<ApiResponse<QuotePayload>> {
  if (!TD_KEY) {
    return {
      symbol,
      timestamp: new Date().toISOString(),
      data: buildFallbackQuote(),
      source: "fallback",
      cached: false,
      error: "TWELVE_DATA_API_KEY not configured",
    };
  }

  const cacheKey = `td:quote:${symbol}`;
  const TTL = 30;

  const cached = await getCached<QuotePayload>(cacheKey);
  if (cached) {
    return { symbol, timestamp: new Date().toISOString(), data: cached, source: "cache", cached: true };
  }

  try {
    const url = `${TD_BASE}/quote?symbol=${symbol}&apikey=${TD_KEY}`;
    const raw = await fetchJson<{
      symbol: string;
      name: string;
      exchange: string;
      currency: string;
      datetime: string;
      open: string;
      high: string;
      low: string;
      close: string;
      previous_close: string;
      change: string;
      percent_change: string;
      volume: string;
      average_volume: string;
      fifty_two_week: { low: string; high: string };
      is_market_open: boolean;
    }>(url);

    const payload: QuotePayload = {
      price: parseFloat(raw.close),
      open: parseFloat(raw.open),
      high: parseFloat(raw.high),
      low: parseFloat(raw.low),
      close: parseFloat(raw.close),
      previousClose: parseFloat(raw.previous_close),
      change: parseFloat(raw.change),
      changePct: parseFloat(raw.percent_change),
      volume: parseInt(raw.volume, 10),
      averageVolume: parseInt(raw.average_volume, 10),
      fiftyTwoWeekHigh: parseFloat(raw.fifty_two_week.high),
      fiftyTwoWeekLow: parseFloat(raw.fifty_two_week.low),
      currency: raw.currency,
      exchange: raw.exchange,
      marketStatus: raw.is_market_open ? "open" : "closed",
    };

    await setCache(cacheKey, payload as unknown as JsonValue, TTL);

    return { symbol, timestamp: new Date().toISOString(), data: payload, source: "live", cached: false };
  } catch (err) {
    const stale = await getCached<QuotePayload>(cacheKey);
    return {
      symbol,
      timestamp: new Date().toISOString(),
      data: stale ?? buildFallbackQuote(),
      source: stale ? "cache" : "fallback",
      cached: !!stale,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

function buildFallbackQuote(): QuotePayload {
  return {
    price: 0, open: 0, high: 0, low: 0, close: 0, previousClose: 0,
    change: 0, changePct: 0, volume: 0, averageVolume: 0,
    fiftyTwoWeekHigh: 0, fiftyTwoWeekLow: 0,
    currency: "USD", exchange: "—", marketStatus: "closed",
  };
}

// ── Finnhub — Quote ───────────────────────────────────────────

/**
 * Fetch live price confirmation from Finnhub.
 * Cached for 30 seconds.
 */
export async function fetchFinnhubQuote(
  symbol: string
): Promise<{ currentPrice: number; change: number; changePct: number; high: number; low: number; open: number; previousClose: number } | null> {
  if (!FH_KEY) return null;

  const cacheKey = `fh:quote:${symbol}`;
  const TTL = 30;

  const cached = await getCached<ReturnType<typeof fetchFinnhubQuote> extends Promise<infer T> ? NonNullable<T> : never>(cacheKey);
  if (cached) return cached;

  try {
    // Finnhub uses different symbol formats — convert EURUSD → OANDA:EUR_USD for forex
    const fhSymbol = normalizeFinnhubSymbol(symbol);
    const url = `${FH_BASE}/quote?symbol=${fhSymbol}&token=${FH_KEY}`;
    const raw = await fetchJson<{ c: number; d: number; dp: number; h: number; l: number; o: number; pc: number }>(url);

    const data = {
      currentPrice: raw.c,
      change: raw.d,
      changePct: raw.dp,
      high: raw.h,
      low: raw.l,
      open: raw.o,
      previousClose: raw.pc,
    };

    await setCache(cacheKey, data as unknown as JsonValue, TTL);
    return data;
  } catch {
    return null;
  }
}

// ── Finnhub — News ────────────────────────────────────────────

/**
 * Fetch relevant market news from Finnhub.
 * Category is inferred from asset class.
 * Cached for 300 seconds (5 minutes) — news doesn't change rapidly.
 */
export async function fetchFinnhubNews(
  symbol: string,
  category: "forex" | "crypto" | "general" | "merger" = "general",
  limit: number = 5
): Promise<NewsItem[]> {
  if (!FH_KEY) return [];

  const cacheKey = `fh:news:${category}:${symbol}`;
  const TTL = 300;

  const cached = await getCached<NewsItem[]>(cacheKey);
  if (cached) return cached;

  try {
    const url = `${FH_BASE}/news?category=${category}&token=${FH_KEY}`;
    const raw = await fetchJson<Array<{
      id: number;
      headline: string;
      summary: string;
      source: string;
      url: string;
      image: string;
      category: string;
      datetime: number;
      related: string;
    }>>(url);

    const news: NewsItem[] = raw
      .filter((item) => {
        // Filter to items mentioning the base currency or instrument
        const base = symbol.slice(0, 3).toUpperCase();
        return (
          item.related?.toUpperCase().includes(base) ||
          item.headline?.toUpperCase().includes(base) ||
          !item.related // Include general items
        );
      })
      .slice(0, limit)
      .map((item) => ({
        id: String(item.id),
        headline: item.headline,
        summary: item.summary,
        source: item.source,
        url: item.url,
        image: item.image,
        category: item.category,
        datetime: item.datetime,
        related: item.related,
      }));

    await setCache(cacheKey, news as unknown as JsonValue, TTL);
    return news;
  } catch {
    return [];
  }
}

// ── Fundamentals (combined) ───────────────────────────────────

/**
 * Fetch combined fundamentals: Finnhub quote + news.
 */
export async function fetchFundamentals(
  symbol: string,
  newsCategory: "forex" | "crypto" | "general" = "general"
): Promise<ApiResponse<FundamentalsPayload>> {
  const cacheKey = `fh:fundamentals:${symbol}`;
  const TTL = 60;

  const cached = await getCached<FundamentalsPayload>(cacheKey);
  if (cached) {
    return { symbol, timestamp: new Date().toISOString(), data: cached, source: "cache", cached: true };
  }

  if (!FH_KEY) {
    return {
      symbol,
      timestamp: new Date().toISOString(),
      data: { quote: { currentPrice: 0, change: 0, changePct: 0, high: 0, low: 0, open: 0, previousClose: 0 }, news: [] },
      source: "fallback",
      cached: false,
      error: "FINNHUB_API_KEY not configured",
    };
  }

  try {
    const [quote, news] = await Promise.all([
      fetchFinnhubQuote(symbol),
      fetchFinnhubNews(symbol, newsCategory),
    ]);

    const payload: FundamentalsPayload = {
      quote: quote ?? { currentPrice: 0, change: 0, changePct: 0, high: 0, low: 0, open: 0, previousClose: 0 },
      news,
    };

    await setCache(cacheKey, payload as unknown as JsonValue, TTL);

    return { symbol, timestamp: new Date().toISOString(), data: payload, source: "live", cached: false };
  } catch (err) {
    const stale = await getCached<FundamentalsPayload>(cacheKey);
    return {
      symbol,
      timestamp: new Date().toISOString(),
      data: stale ?? { quote: { currentPrice: 0, change: 0, changePct: 0, high: 0, low: 0, open: 0, previousClose: 0 }, news: [] },
      source: stale ? "cache" : "fallback",
      cached: !!stale,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ── Symbol normalisation ─────────────────────────────────────

/**
 * Normalise symbols for Finnhub's expected format.
 * Forex: EURUSD → OANDA:EUR_USD
 * Crypto: BTCUSD → BINANCE:BTCUSDT
 * Indices/Commodities: pass through (Finnhub uses different tickers)
 */
function normalizeFinnhubSymbol(symbol: string): string {
  const forexPairs = ["EURUSD","GBPUSD","USDJPY","USDCHF","AUDUSD","NZDUSD","USDCAD","GBPJPY","EURJPY","EURGBP"];
  if (forexPairs.includes(symbol)) {
    const base = symbol.slice(0, 3);
    const quote = symbol.slice(3);
    return `OANDA:${base}_${quote}`;
  }
  if (symbol === "BTCUSD") return "BINANCE:BTCUSDT";
  if (symbol === "ETHUSD") return "BINANCE:ETHUSDT";
  if (symbol === "SOLUSD") return "BINANCE:SOLUSDT";
  return symbol;
}

// ── Rate limit tracker (in-memory, per-process) ───────────────
// Twelve Data Basic: 8 calls/min, 800 calls/day
// This prevents runaway calling during dev

const rateLimiter = {
  minuteCount: 0,
  minuteReset: Date.now() + 60_000,
  dayCount: 0,
  dayReset: Date.now() + 86_400_000,

  check(): { allowed: boolean; reason?: string } {
    const now = Date.now();
    if (now > this.minuteReset) {
      this.minuteCount = 0;
      this.minuteReset = now + 60_000;
    }
    if (now > this.dayReset) {
      this.dayCount = 0;
      this.dayReset = now + 86_400_000;
    }
    if (this.minuteCount >= 8) {
      return { allowed: false, reason: `Rate limit: 8 calls/min reached. Resets in ${Math.ceil((this.minuteReset - now) / 1000)}s` };
    }
    if (this.dayCount >= 780) { // 780 of 800 — keep 20 in reserve
      return { allowed: false, reason: "Daily quota nearly exhausted (780/800 calls used)" };
    }
    this.minuteCount++;
    this.dayCount++;
    return { allowed: true };
  },

  getStatus() {
    return {
      minuteUsed: this.minuteCount,
      minuteLimit: 8,
      dayUsed: this.dayCount,
      dayLimit: 800,
    };
  },
};

export { rateLimiter };
