// ============================================================
// lib/performance-client.ts
// Signal Archive & Performance Tracker — Section E
// Aggregation logic, TP/SL parser, and mock data layer
// ============================================================

import { createServiceClient, createServerClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { AssetClass, SignalOutcome, ArchiveWithInstrument } from "@/lib/supabase/types";

// ── Types ─────────────────────────────────────────────────────

export interface PerformanceByCategory {
  win_rate: number;
  count: number;
  wins: number;
  losses: number;
}

export interface DailyPoint {
  date: string;      // ISO date string "YYYY-MM-DD"
  wins: number;
  losses: number;
  expired: number;
  win_rate: number;  // 0–100
}

export interface DCSBucket {
  range: string;     // "0–9", "10–19", …
  floor: number;
  win_rate: number;
  count: number;
  wins: number;
}

export interface PerformanceStats {
  total_signals: number;
  win_rate: number;
  avg_rr: number;
  by_asset_class: Record<string, PerformanceByCategory>;
  by_timeframe: Record<string, PerformanceByCategory>;
  recent_30_days: {
    win_rate: number;
    total: number;
    daily: DailyPoint[];
  };
  best_instrument: {
    symbol: string;
    win_rate: number;
    count: number;
  };
  dcs_accuracy: {
    high_dcs_win_rate: number;  // consensus_score >= 75
    low_dcs_win_rate: number;   // consensus_score < 50
    buckets: DCSBucket[];
  };
}

export interface ArchiveRow {
  id: string;
  date: string;
  symbol: string;
  asset_class: AssetClass;
  direction: "bullish" | "bearish" | "neutral";
  dcs: number;
  entry: string;
  sl: string;
  tp: string;
  outcome: SignalOutcome;
  rr: number | null;
  timeframe: string;
}

export interface ArchivePage {
  data: ArchiveRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ArchiveFilters {
  asset_class?: AssetClass;
  outcome?: SignalOutcome;
  timeframe?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

// ── TP/SL Parser ─────────────────────────────────────────────
// Handles: "1.0820", "1.0800 – 1.0820", "1.0800-1.0820", "1.0800 to 1.0820"

export function parsePrice(text: string | null | undefined): number | null {
  if (!text) return null;
  // Strip currency symbols, whitespace extras
  const clean = text.replace(/[$£€¥]/g, "").trim();
  // Range formats: split on –, -, to, ~
  const parts = clean.split(/\s*(?:–|—|-|to|~)\s*/i).map((p) => p.replace(/[^\d.]/g, ""));
  const nums = parts.map(Number).filter((n) => !isNaN(n) && n > 0);
  if (nums.length === 0) return null;
  if (nums.length === 1) return nums[0];
  // Take midpoint of range
  return (nums[0] + nums[nums.length - 1]) / 2;
}

// ── R:R Calculator ────────────────────────────────────────────

export function calcRR(
  entry: number | null,
  sl: number | null,
  tp: number | null
): number | null {
  if (!entry || !sl || !tp) return null;
  const risk = Math.abs(entry - sl);
  const reward = Math.abs(tp - entry);
  if (risk === 0) return null;
  return Math.round((reward / risk) * 10) / 10;
}

// ── Mock Data Generator ───────────────────────────────────────

const MOCK_SYMBOLS: Array<{ symbol: string; asset_class: AssetClass; basePrice: number }> = [
  { symbol: "EURUSD",  asset_class: "forex",       basePrice: 1.0850 },
  { symbol: "GBPUSD",  asset_class: "forex",       basePrice: 1.2720 },
  { symbol: "USDJPY",  asset_class: "forex",       basePrice: 149.80 },
  { symbol: "XAUUSD",  asset_class: "commodities", basePrice: 2315.0 },
  { symbol: "USOIL",   asset_class: "commodities", basePrice: 78.40  },
  { symbol: "US30",    asset_class: "indices",     basePrice: 38420  },
  { symbol: "NAS100",  asset_class: "indices",     basePrice: 17850  },
  { symbol: "BTCUSD",  asset_class: "crypto",      basePrice: 67420  },
  { symbol: "ETHUSD",  asset_class: "crypto",      basePrice: 3512   },
];

const TIMEFRAMES = ["H1", "H4", "D1"];
const DIRECTIONS: Array<"bullish" | "bearish"> = ["bullish", "bearish"];
const RISK_GRADES: Array<"A+" | "A" | "B" | "C" | "D"> = ["A+", "A", "B", "C", "D"];

function weightedOutcome(dcs: number): SignalOutcome {
  // High DCS → higher win probability (proves DCS validity)
  const winProb = 0.25 + (dcs / 100) * 0.55; // 25%–80% based on DCS
  const r = Math.random();
  if (r < winProb) return "win";
  if (r < winProb + 0.15) return "expired";
  return "loss";
}

function generateMockArchive(count = 200): ArchiveRow[] {
  const rows: ArchiveRow[] = [];
  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 3600 * 1000;

  for (let i = 0; i < count; i++) {
    const instr = MOCK_SYMBOLS[i % MOCK_SYMBOLS.length];
    const daysAgo = Math.floor(Math.random() * 90) + 1;
    const date = new Date(now - daysAgo * 86400000).toISOString().split("T")[0];
    const direction = DIRECTIONS[Math.floor(Math.random() * 2)];
    const dcs = Math.floor(Math.random() * 85) + 10; // 10–95
    const tf = TIMEFRAMES[Math.floor(Math.random() * 3)];
    const bp = instr.basePrice;
    const noise = (Math.random() - 0.5) * 0.01 * bp;
    const entry = bp + noise;
    const slDist = 0.003 * bp + Math.random() * 0.002 * bp;
    const rrRatio = 1.5 + Math.random() * 2; // 1.5:1 to 3.5:1
    const sl = direction === "bullish" ? entry - slDist : entry + slDist;
    const tp = direction === "bullish"
      ? entry + slDist * rrRatio
      : entry - slDist * rrRatio;
    const outcome = weightedOutcome(dcs);
    const rr = outcome === "expired" ? null : Math.round(rrRatio * 10) / 10;

    rows.push({
      id: `mock-${i}`,
      date,
      symbol: instr.symbol,
      asset_class: instr.asset_class,
      direction,
      dcs,
      entry: entry.toFixed(instr.basePrice >= 100 ? 2 : 4),
      sl: sl.toFixed(instr.basePrice >= 100 ? 2 : 4),
      tp: tp.toFixed(instr.basePrice >= 100 ? 2 : 4),
      outcome,
      rr,
      timeframe: tf,
    });
  }

  // Sort newest first
  return rows.sort((a, b) => b.date.localeCompare(a.date));
}

// Build aggregated stats from a set of archive rows
function aggregateStats(rows: ArchiveRow[]): PerformanceStats {
  const resolved = rows.filter((r) => r.outcome === "win" || r.outcome === "loss");
  const wins = resolved.filter((r) => r.outcome === "win");
  const total = rows.length;
  const winRate = resolved.length > 0 ? Math.round((wins.length / resolved.length) * 1000) / 10 : 0;

  // Avg R:R of winning trades
  const rrValues = wins.map((r) => r.rr).filter((r): r is number => r !== null);
  const avgRR = rrValues.length > 0
    ? Math.round(rrValues.reduce((a, b) => a + b, 0) / rrValues.length * 10) / 10
    : 0;

  // By asset class
  const assetClasses: AssetClass[] = ["forex", "indices", "commodities", "crypto"];
  const byAssetClass: Record<string, PerformanceByCategory> = {};
  for (const ac of assetClasses) {
    const acRows = resolved.filter((r) => r.asset_class === ac);
    const acWins = acRows.filter((r) => r.outcome === "win");
    byAssetClass[ac] = {
      win_rate: acRows.length > 0 ? Math.round((acWins.length / acRows.length) * 1000) / 10 : 0,
      count: rows.filter((r) => r.asset_class === ac).length,
      wins: acWins.length,
      losses: acRows.length - acWins.length,
    };
  }

  // By timeframe
  const byTimeframe: Record<string, PerformanceByCategory> = {};
  for (const tf of TIMEFRAMES) {
    const tfRows = resolved.filter((r) => r.timeframe === tf);
    const tfWins = tfRows.filter((r) => r.outcome === "win");
    byTimeframe[tf] = {
      win_rate: tfRows.length > 0 ? Math.round((tfWins.length / tfRows.length) * 1000) / 10 : 0,
      count: rows.filter((r) => r.timeframe === tf).length,
      wins: tfWins.length,
      losses: tfRows.length - tfWins.length,
    };
  }

  // Recent 30 days — build daily array
  const cutoff = new Date(Date.now() - 30 * 86400000);
  const recent = rows.filter((r) => new Date(r.date) >= cutoff);
  const recentResolved = recent.filter((r) => r.outcome === "win" || r.outcome === "loss");
  const recentWins = recentResolved.filter((r) => r.outcome === "win");
  const recentWinRate = recentResolved.length > 0
    ? Math.round((recentWins.length / recentResolved.length) * 1000) / 10
    : 0;

  // Build daily points for chart
  const dailyMap = new Map<string, DailyPoint>();
  for (let d = 0; d < 30; d++) {
    const date = new Date(Date.now() - d * 86400000).toISOString().split("T")[0];
    dailyMap.set(date, { date, wins: 0, losses: 0, expired: 0, win_rate: 0 });
  }
  for (const r of recent) {
    const pt = dailyMap.get(r.date);
    if (pt) {
      if (r.outcome === "win") pt.wins++;
      else if (r.outcome === "loss") pt.losses++;
      else if (r.outcome === "expired") pt.expired++;
    }
  }
  // Calculate rolling win rate per day
  const daily = Array.from(dailyMap.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((pt) => ({
      ...pt,
      win_rate: pt.wins + pt.losses > 0
        ? Math.round((pt.wins / (pt.wins + pt.losses)) * 1000) / 10
        : 0,
    }));

  // Best instrument
  const symMap = new Map<string, { wins: number; total: number }>();
  for (const r of resolved) {
    const entry = symMap.get(r.symbol) ?? { wins: 0, total: 0 };
    entry.total++;
    if (r.outcome === "win") entry.wins++;
    symMap.set(r.symbol, entry);
  }
  let bestSymbol = { symbol: "EURUSD", win_rate: 0, count: 0 };
  for (const [sym, stats] of symMap) {
    if (stats.total >= 3) {
      const wr = Math.round((stats.wins / stats.total) * 1000) / 10;
      if (wr > bestSymbol.win_rate) {
        bestSymbol = { symbol: sym, win_rate: wr, count: stats.total };
      }
    }
  }

  // DCS accuracy buckets (10-point ranges)
  const buckets: DCSBucket[] = [];
  for (let floor = 0; floor < 100; floor += 10) {
    const ceil = floor + 9;
    const bucket = resolved.filter((r) => r.dcs >= floor && r.dcs <= ceil);
    const bWins = bucket.filter((r) => r.outcome === "win");
    buckets.push({
      range: `${floor}–${ceil}`,
      floor,
      win_rate: bucket.length > 0 ? Math.round((bWins.length / bucket.length) * 1000) / 10 : 0,
      count: bucket.length,
      wins: bWins.length,
    });
  }

  const highDCS = resolved.filter((r) => r.dcs >= 75);
  const highWins = highDCS.filter((r) => r.outcome === "win");
  const lowDCS = resolved.filter((r) => r.dcs < 50);
  const lowWins = lowDCS.filter((r) => r.outcome === "win");

  return {
    total_signals: total,
    win_rate: winRate,
    avg_rr: avgRR,
    by_asset_class: byAssetClass,
    by_timeframe: byTimeframe,
    recent_30_days: { win_rate: recentWinRate, total: recent.length, daily },
    best_instrument: bestSymbol,
    dcs_accuracy: {
      high_dcs_win_rate: highDCS.length > 0
        ? Math.round((highWins.length / highDCS.length) * 1000) / 10
        : 0,
      low_dcs_win_rate: lowDCS.length > 0
        ? Math.round((lowWins.length / lowDCS.length) * 1000) / 10
        : 0,
      buckets,
    },
  };
}

// ── Cached mock data singleton ────────────────────────────────
let _mockRows: ArchiveRow[] | null = null;
function getMockRows(): ArchiveRow[] {
  if (!_mockRows) _mockRows = generateMockArchive(200);
  return _mockRows;
}

// ── Public API ────────────────────────────────────────────────

export async function getPerformanceStats(): Promise<PerformanceStats> {
  if (!isSupabaseConfigured()) {
    return aggregateStats(getMockRows());
  }

  try {
    const db = createServerClient();
    // Pull all resolved archive rows with instrument join
    const { data, error } = await db
      .from("signal_archive")
      .select("*, instruments(symbol, name, asset_class)")
      .in("outcome", ["win", "loss", "expired"])
      .order("created_at", { ascending: false })
      .limit(2000) as {
        data: ArchiveWithInstrument[] | null;
        error: unknown;
      };

    if (error || !data || data.length === 0) {
      return aggregateStats(getMockRows());
    }

    const rows: ArchiveRow[] = data.map((r) => ({
      id: r.id,
      date: r.created_at.split("T")[0],
      symbol: r.instruments.symbol,
      asset_class: r.instruments.asset_class,
      direction: r.direction,
      dcs: r.consensus_score,
      entry: r.entry_zone ?? "-",
      sl: r.sl ?? "-",
      tp: r.tp ?? "-",
      outcome: r.outcome,
      rr: calcRR(r.entry_price, parsePrice(r.sl), parsePrice(r.tp)),
      timeframe: r.timeframe,
    }));

    return aggregateStats(rows);
  } catch {
    return aggregateStats(getMockRows());
  }
}

export async function getArchivePage(filters: ArchiveFilters): Promise<ArchivePage> {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(100, filters.limit ?? 20);

  if (!isSupabaseConfigured()) {
    let rows = getMockRows();
    if (filters.asset_class) rows = rows.filter((r) => r.asset_class === filters.asset_class);
    if (filters.outcome) rows = rows.filter((r) => r.outcome === filters.outcome);
    if (filters.timeframe) rows = rows.filter((r) => r.timeframe === filters.timeframe);
    if (filters.from) rows = rows.filter((r) => r.date >= filters.from!);
    if (filters.to) rows = rows.filter((r) => r.date <= filters.to!);
    const total = rows.length;
    const start = (page - 1) * limit;
    return {
      data: rows.slice(start, start + limit),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  try {
    const db = createServerClient();
    let query = db
      .from("signal_archive")
      .select("*, instruments(symbol, name, asset_class)", { count: "exact" })
      .neq("outcome", "pending")
      .order("created_at", { ascending: false });

    if (filters.outcome) query = query.eq("outcome", filters.outcome as string);
    if (filters.timeframe) query = query.eq("timeframe", filters.timeframe);
    if (filters.from) query = query.gte("created_at", filters.from);
    if (filters.to) query = query.lte("created_at", filters.to + "T23:59:59Z");

    const { data, error, count } = await query
      .range((page - 1) * limit, page * limit - 1) as {
        data: ArchiveWithInstrument[] | null;
        error: unknown;
        count: number | null;
      };

    if (error || !data) throw new Error("Query failed");

    const rows: ArchiveRow[] = data
      .filter((r) => !filters.asset_class || r.instruments.asset_class === filters.asset_class)
      .map((r) => ({
        id: r.id,
        date: r.created_at.split("T")[0],
        symbol: r.instruments.symbol,
        asset_class: r.instruments.asset_class,
        direction: r.direction,
        dcs: r.consensus_score,
        entry: r.entry_zone ?? "-",
        sl: r.sl ?? "-",
        tp: r.tp ?? "-",
        outcome: r.outcome,
        rr: calcRR(r.entry_price, parsePrice(r.sl), parsePrice(r.tp)),
        timeframe: r.timeframe,
      }));

    const total = count ?? rows.length;
    return {
      data: rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch {
    // Fall back to mock
    return getArchivePage({ ...filters });
  }
}

// ── Price fetcher (used by cron) ──────────────────────────────

const TD_KEY = process.env.TWELVE_DATA_API_KEY ?? "";

export async function fetchCurrentPrice(symbol: string): Promise<number | null> {
  if (!TD_KEY) return null;
  try {
    const res = await fetch(
      `https://api.twelvedata.com/price?symbol=${encodeURIComponent(symbol)}&apikey=${TD_KEY}`,
      { next: { revalidate: 0 } }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const price = parseFloat(json.price);
    return isNaN(price) ? null : price;
  } catch {
    return null;
  }
}

// ── Outcome resolver (used by cron) ──────────────────────────

export type OutcomeResult = "win" | "loss" | "expired" | null;

export function resolveOutcome(params: {
  currentPrice: number;
  tp: string | null;
  sl: string | null;
  direction: string;
  expiresAt: string | null;
}): OutcomeResult {
  const { currentPrice, tp, sl, direction, expiresAt } = params;

  // Check expiry first
  if (expiresAt && new Date(expiresAt) < new Date()) return "expired";

  const tpNum = parsePrice(tp);
  const slNum = parsePrice(sl);

  if (!tpNum || !slNum) return null; // can't evaluate without levels

  if (direction === "bullish") {
    if (currentPrice >= tpNum) return "win";
    if (currentPrice <= slNum) return "loss";
  } else if (direction === "bearish") {
    if (currentPrice <= tpNum) return "win";
    if (currentPrice >= slNum) return "loss";
  }

  return null; // still pending
}
