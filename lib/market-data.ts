import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/client";

const TD_BASE = "https://api.twelvedata.com";
const TD_KEY = process.env.TWELVE_DATA_API_KEY ?? "";

export interface LiveQuote {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
  timestamp: string;
}

export interface BatchQuoteResponse {
  [symbol: string]: LiveQuote;
}

/**
 * Normalises a Signal Centre symbol to a Twelve Data symbol.
 * E.g., XAU/USD -> XAU/USD (Twelve Data usually accepts standard pairs).
 * For indices like UK100, we may need specific mapping.
 */
function mapSymbol(symbol: string): string {
  const map: Record<string, string> = {
    "UK100": "UK100", 
    "US500": "SPX",
    "US30": "DJI",
    "GER40": "DAX",
    "WTI Crude": "WTI",
    "Brent Crude": "BRENT",
    "Natural Gas": "NG",
    "Copper": "COPPER",
  };
  return map[symbol] || symbol;
}

function unmapSymbol(tdSymbol: string, originalSymbols: string[]): string {
  for (const s of originalSymbols) {
    if (mapSymbol(s) === tdSymbol) return s;
  }
  return tdSymbol;
}

export async function getLiveQuotes(symbols: string[]): Promise<BatchQuoteResponse> {
  if (!symbols || symbols.length === 0) return {};
  
  // Deduplicate and map
  const uniqueSymbols = Array.from(new Set(symbols));
  const mappedSymbols = uniqueSymbols.map(mapSymbol).join(",");
  
  const cacheKey = `td:batch_quotes:${mappedSymbols}`;
  const TTL = 60; // 60 seconds caching

  if (isSupabaseConfigured()) {
    try {
      const db = createServiceClient();
      const { data } = await (db
        .from("api_cache")
        .select("value, fetched_at")
        .eq("key", cacheKey)
        .single() as any);
        
      if (data) {
        const age = (Date.now() - new Date(data.fetched_at).getTime()) / 1000;
        if (age <= TTL) {
          return data.value as BatchQuoteResponse;
        }
      }
    } catch (e) {
      console.warn("Failed to read from api_cache", e);
    }
  }

  if (!TD_KEY) {
    console.warn("TWELVE_DATA_API_KEY not configured. Returning empty quotes.");
    return {};
  }

  try {
    const url = `${TD_BASE}/quote?symbol=${mappedSymbols}&apikey=${TD_KEY}`;
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) throw new Error(`Twelve Data returned ${res.status}`);
    
    const json = await res.json();
    
    if (json.status === "error") {
      throw new Error(`[Twelve Data] ${json.message}`);
    }

    const result: BatchQuoteResponse = {};
    
    // If only one symbol was requested, Twelve Data doesn't nest under symbol keys
    if (uniqueSymbols.length === 1) {
      if (json.symbol) {
        result[uniqueSymbols[0]] = {
          symbol: uniqueSymbols[0],
          price: parseFloat(json.close || "0"),
          change: parseFloat(json.change || "0"),
          changePct: parseFloat(json.percent_change || "0"),
          timestamp: new Date().toISOString(),
        };
      }
    } else {
      for (const [tdSymbol, data] of Object.entries<any>(json)) {
        if (data && data.symbol) {
          const original = unmapSymbol(tdSymbol, uniqueSymbols);
          result[original] = {
            symbol: original,
            price: parseFloat(data.close || "0"),
            change: parseFloat(data.change || "0"),
            changePct: parseFloat(data.percent_change || "0"),
            timestamp: new Date().toISOString(),
          };
        }
      }
    }

    // Write to cache
    if (isSupabaseConfigured()) {
      try {
        const db = createServiceClient();
        await (db.from("api_cache") as any).upsert({
          key: cacheKey,
          value: result,
          fetched_at: new Date().toISOString(),
          ttl_seconds: TTL,
        });
      } catch (e) {
        console.warn("Failed to write to api_cache", e);
      }
    }

    return result;
  } catch (error) {
    console.error("Error in getLiveQuotes:", error);
    return {}; // Graceful degradation
  }
}
