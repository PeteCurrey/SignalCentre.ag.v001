// ============================================================
// lib/autochartist-client.ts
// Autochartist REST API Client with Mock Fallback
// ============================================================

import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/client";

const APP_ID = process.env.AUTOCHARTIST_APP_ID ?? "";
const API_KEY = process.env.AUTOCHARTIST_API_KEY ?? "";
const BASE_URL = "https://api.autochartist.com/v1"; // Example base URL

export type Direction = "bullish" | "bearish";

export interface AutochartistPattern {
  id: string;
  pattern_type: string;
  direction: Direction;
  quality_score: number; // 1-5
  formation_start: string; // ISO date
  formation_end: string;   // ISO date
  predicted_direction: Direction;
  forecast_price: number;
  time_remaining: string; // e.g. "12h 30m"
}

export interface AutochartistKeyLevel {
  id: string;
  level_type: "support" | "resistance";
  price: number;
  strength: number; // 1-5
}

interface CacheRow {
  value: Record<string, unknown>;
  fetched_at: string;
  ttl_seconds: number;
}

// ── Cache Layer ──────────────────────────────────────────────

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

async function setCache(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const db = createServiceClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db.from("api_cache") as any).upsert(
      { key, value: value as any, fetched_at: new Date().toISOString(), ttl_seconds: ttlSeconds },
      { onConflict: "key" }
    );
  } catch {
    // Ignore
  }
}

// ── Fetchers ─────────────────────────────────────────────────

export async function fetchAutochartistPatterns(symbol: string): Promise<AutochartistPattern[]> {
  const cacheKey = `ac:patterns:${symbol}`;
  const cached = await getCached<AutochartistPattern[]>(cacheKey);
  if (cached) return cached;

  if (!APP_ID || APP_ID.includes("your_autochartist") || !API_KEY) {
    const mock = generateMockPatterns(symbol);
    // Cache mock data to prevent changing patterns on every reload
    await setCache(cacheKey, mock, 300); 
    return mock;
  }

  try {
    // Example Autochartist REST call
    const res = await fetch(`${BASE_URL}/patterns?symbol=${symbol}&app_id=${APP_ID}&api_key=${API_KEY}`);
    if (!res.ok) throw new Error(`Autochartist API error: ${res.status}`);
    const data = await res.json();
    
    // Map response to our internal type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const patterns: AutochartistPattern[] = data.map((p: any) => ({
      id: p.id,
      pattern_type: p.name,
      direction: p.type === "bullish" ? "bullish" : "bearish",
      quality_score: Math.max(1, Math.min(5, p.quality)),
      formation_start: p.start_time,
      formation_end: p.end_time,
      predicted_direction: p.type === "bullish" ? "bullish" : "bearish",
      forecast_price: parseFloat(p.target_price),
      time_remaining: p.time_to_target ?? "N/A",
    }));

    await setCache(cacheKey, patterns, 300); // Cache for 5 minutes
    return patterns;
  } catch (err) {
    console.error("[Autochartist] Fetch patterns failed:", err);
    return generateMockPatterns(symbol);
  }
}

export async function fetchAutochartistKeyLevels(symbol: string, currentPrice: number): Promise<AutochartistKeyLevel[]> {
  const cacheKey = `ac:keylevels:${symbol}`;
  const cached = await getCached<AutochartistKeyLevel[]>(cacheKey);
  if (cached) return cached;

  if (!APP_ID || APP_ID.includes("your_autochartist") || !API_KEY) {
    const mock = generateMockKeyLevels(currentPrice);
    await setCache(cacheKey, mock, 300);
    return mock;
  }

  try {
    const res = await fetch(`${BASE_URL}/keylevels?symbol=${symbol}&app_id=${APP_ID}&api_key=${API_KEY}`);
    if (!res.ok) throw new Error(`Autochartist API error: ${res.status}`);
    const data = await res.json();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const levels: AutochartistKeyLevel[] = data.map((l: any) => ({
      id: l.id,
      level_type: l.type === "support" ? "support" : "resistance",
      price: parseFloat(l.price),
      strength: Math.max(1, Math.min(5, l.significance)),
    }));

    await setCache(cacheKey, levels, 300);
    return levels;
  } catch (err) {
    console.error("[Autochartist] Fetch key levels failed:", err);
    return generateMockKeyLevels(currentPrice);
  }
}

// ── Mock Generators ──────────────────────────────────────────

function generateMockPatterns(symbol: string): AutochartistPattern[] {
  // Use symbol length to deterministically pick bullish or bearish for stability during dev
  const isBullish = symbol.length % 2 === 0;
  const now = new Date();
  
  return [
    {
      id: `patt-${symbol}-1`,
      pattern_type: isBullish ? "Ascending Triangle" : "Head and Shoulders",
      direction: isBullish ? "bullish" : "bearish",
      quality_score: 4,
      formation_start: new Date(now.getTime() - 86400000 * 2).toISOString(),
      formation_end: new Date(now.getTime() - 3600000).toISOString(),
      predicted_direction: isBullish ? "bullish" : "bearish",
      forecast_price: isBullish ? 1.1050 : 1.0520, // Arbitrary prices, will be relative in real data
      time_remaining: "18h 45m",
    },
    {
      id: `patt-${symbol}-2`,
      pattern_type: isBullish ? "Channel Up" : "Double Top",
      direction: isBullish ? "bullish" : "bearish",
      quality_score: 3,
      formation_start: new Date(now.getTime() - 86400000 * 5).toISOString(),
      formation_end: new Date(now.getTime() - 7200000).toISOString(),
      predicted_direction: isBullish ? "bullish" : "bearish",
      forecast_price: isBullish ? 1.0980 : 1.0610,
      time_remaining: "1d 4h",
    }
  ];
}

function generateMockKeyLevels(currentPrice: number): AutochartistKeyLevel[] {
  // Generate levels relative to the current price so the ladder always looks realistic
  const pip = currentPrice < 10 ? 0.0001 : currentPrice < 1000 ? 0.01 : 1;
  
  return [
    { id: "r2", level_type: "resistance", price: currentPrice + (pip * 85), strength: 5 },
    { id: "r1", level_type: "resistance", price: currentPrice + (pip * 35), strength: 3 },
    { id: "s1", level_type: "support",    price: currentPrice - (pip * 25), strength: 4 },
    { id: "s2", level_type: "support",    price: currentPrice - (pip * 60), strength: 2 },
  ];
}
