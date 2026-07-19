// ============================================================
// lib/supabase/client.ts
// Supabase client factory — three modes:
//   browser()      — anon key, used in client components
//   server()       — anon key, used in server components / API routes
//   serviceRole()  — service role key, used for privileged writes
// ============================================================

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Validate config at module load time (server only)
function assertSupabaseConfig() {
  if (!supabaseUrl || supabaseUrl.includes("your-project-ref")) {
    throw new Error(
      "[Supabase] NEXT_PUBLIC_SUPABASE_URL is not configured. " +
        "Add your project URL to .env.local"
    );
  }
  if (!supabaseAnonKey || supabaseAnonKey.includes("replace_me")) {
    throw new Error(
      "[Supabase] NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured."
    );
  }
}

/** Anon client — respects Row Level Security. Safe for public reads. */
export function createBrowserClient() {
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
}

/** Server client — anon key, used in Server Components and API routes. */
export function createServerClient() {
  assertSupabaseConfig();
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });
}

/** Service role client — bypasses RLS. Only for trusted server-side writes. */
export function createServiceClient() {
  assertSupabaseConfig();
  if (!supabaseServiceKey || supabaseServiceKey.includes("replace_me")) {
    throw new Error(
      "[Supabase] SUPABASE_SERVICE_ROLE_KEY is not configured. " +
        "Required for privileged operations."
    );
  }
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Returns true if Supabase is configured with real credentials */
export function isSupabaseConfigured(): boolean {
  return (
    !!supabaseUrl &&
    !supabaseUrl.includes("your-project-ref") &&
    !!supabaseAnonKey &&
    !supabaseAnonKey.includes("replace_me")
  );
}
