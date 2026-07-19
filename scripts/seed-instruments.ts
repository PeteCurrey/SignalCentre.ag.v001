#!/usr/bin/env node
// ============================================================
// scripts/seed-instruments.ts
//
// Seeds the instruments table in Supabase.
// Run with: npx tsx scripts/seed-instruments.ts
//
// Requires SUPABASE_SERVICE_ROLE_KEY to be set in .env.local
// ============================================================

import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local
config({ path: resolve(process.cwd(), ".env.local") });

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || supabaseUrl.includes("your-project-ref")) {
  console.error("❌  NEXT_PUBLIC_SUPABASE_URL is not configured in .env.local");
  process.exit(1);
}

if (!serviceKey || serviceKey.includes("replace_me")) {
  console.error("❌  SUPABASE_SERVICE_ROLE_KEY is not configured in .env.local");
  process.exit(1);
}

const db = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const INSTRUMENTS = [
  // Forex
  { symbol: "EURUSD",  name: "Euro / US Dollar",           asset_class: "forex"       },
  { symbol: "GBPUSD",  name: "British Pound / US Dollar",  asset_class: "forex"       },
  { symbol: "USDJPY",  name: "US Dollar / Japanese Yen",   asset_class: "forex"       },
  { symbol: "USDCHF",  name: "US Dollar / Swiss Franc",    asset_class: "forex"       },
  { symbol: "AUDUSD",  name: "Australian Dollar / USD",    asset_class: "forex"       },
  { symbol: "GBPJPY",  name: "British Pound / Yen",        asset_class: "forex"       },
  // Commodities
  { symbol: "XAUUSD",  name: "Gold / US Dollar",           asset_class: "commodities" },
  { symbol: "XAGUSD",  name: "Silver / US Dollar",         asset_class: "commodities" },
  { symbol: "USOIL",   name: "WTI Crude Oil",              asset_class: "commodities" },
  // Indices
  { symbol: "US30",    name: "Dow Jones Industrial",       asset_class: "indices"     },
  { symbol: "NAS100",  name: "Nasdaq 100",                 asset_class: "indices"     },
  { symbol: "SPX500",  name: "S&P 500",                   asset_class: "indices"     },
  { symbol: "UK100",   name: "FTSE 100",                  asset_class: "indices"     },
  { symbol: "GER40",   name: "DAX 40",                    asset_class: "indices"     },
  // Crypto
  { symbol: "BTCUSD",  name: "Bitcoin / US Dollar",        asset_class: "crypto"      },
  { symbol: "ETHUSD",  name: "Ethereum / US Dollar",       asset_class: "crypto"      },
  { symbol: "SOLUSD",  name: "Solana / US Dollar",         asset_class: "crypto"      },
  { symbol: "BNBUSD",  name: "BNB / US Dollar",            asset_class: "crypto"      },
];

async function seed() {
  console.log(`\n🌱  Seeding instruments table (${INSTRUMENTS.length} records)...\n`);

  const { data, error } = await db
    .from("instruments")
    .upsert(INSTRUMENTS, { onConflict: "symbol" })
    .select();

  if (error) {
    console.error("❌  Seed failed:", error.message);
    console.error("    Code:", error.code);
    console.error("    Hint:", error.hint);
    process.exit(1);
  }

  console.log(`✅  Successfully seeded ${data?.length ?? 0} instruments:\n`);

  const byClass = INSTRUMENTS.reduce((acc, i) => {
    acc[i.asset_class] = (acc[i.asset_class] ?? []).concat(i.symbol);
    return acc;
  }, {} as Record<string, string[]>);

  for (const [cls, symbols] of Object.entries(byClass)) {
    console.log(`   ${cls.padEnd(12)} ${symbols.join(", ")}`);
  }

  console.log("\n🏁  Done.\n");
}

seed().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
