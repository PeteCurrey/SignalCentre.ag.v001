// ============================================================
// lib/supabase/types.ts
// Database type definitions matching schema.sql + migration 002
// Auto-generate from Supabase CLI with:
//   npx supabase gen types typescript --project-id <id> > lib/supabase/types.ts
// ============================================================

export type AssetClass = "forex" | "indices" | "commodities" | "crypto";
export type SignalDirection = "bullish" | "bearish" | "neutral";
export type SignalOutcome = "pending" | "win" | "loss" | "expired";
export type RiskGrade = "A+" | "A" | "B" | "C" | "D";

export interface Database {
  public: {
    Tables: {
      instruments: {
        Row: {
          id: string;
          symbol: string;
          name: string;
          asset_class: AssetClass;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          symbol: string;
          name: string;
          asset_class: AssetClass;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          symbol?: string;
          name?: string;
          asset_class?: AssetClass;
          active?: boolean;
        };
      };

      signals: {
        Row: {
          id: string;
          instrument_id: string;
          direction: SignalDirection;
          conviction: number;
          consensus_score: number;
          risk_grade: RiskGrade;
          timeframe: string;
          session: string | null;
          source: string;
          entry_zone: string | null;
          sl: string | null;
          tp: string | null;
          created_at: string;
          expires_at: string | null;
          outcome: SignalOutcome;
          entry_price: number | null;
          outcome_price: number | null;
          metadata: Record<string, unknown> | null;
          tc_consensus_score: number | null;
          tc_alert_text: string | null;
          claude_reasoning: string | null;
          gpt_reasoning: string | null;
          grok_reasoning: string | null;
          acuity_rationale: string | null;
          acuity_confidence: number | null;
          atr_value: number | null;
          fibonacci_levels: Record<string, number> | null;
        };
        Insert: {
          id?: string;
          instrument_id: string;
          direction: SignalDirection;
          conviction: number;
          consensus_score: number;
          risk_grade: RiskGrade;
          timeframe: string;
          session?: string | null;
          source?: string;
          entry_zone?: string | null;
          sl?: string | null;
          tp?: string | null;
          created_at?: string;
          expires_at?: string | null;
          outcome?: SignalOutcome;
          entry_price?: number | null;
          outcome_price?: number | null;
          metadata?: Record<string, unknown> | null;
        };
        Update: {
          direction?: SignalDirection;
          conviction?: number;
          consensus_score?: number;
          risk_grade?: RiskGrade;
          timeframe?: string;
          session?: string | null;
          entry_zone?: string | null;
          sl?: string | null;
          tp?: string | null;
          expires_at?: string | null;
          outcome?: SignalOutcome;
          entry_price?: number | null;
          outcome_price?: number | null;
          metadata?: Record<string, unknown> | null;
        };
      };

      signal_archive: {
        Row: {
          id: string;
          original_id: string;
          instrument_id: string;
          direction: SignalDirection;
          conviction: number;
          consensus_score: number;
          risk_grade: RiskGrade;
          timeframe: string;
          session: string | null;
          source: string;
          entry_zone: string | null;
          sl: string | null;
          tp: string | null;
          created_at: string;
          expires_at: string | null;
          outcome: SignalOutcome;
          archived_at: string;
          entry_price: number | null;
          outcome_price: number | null;
          metadata: Record<string, unknown> | null;
        };
        Insert: Omit<Database["public"]["Tables"]["signal_archive"]["Row"], "id" | "archived_at">;
        Update: Partial<Database["public"]["Tables"]["signal_archive"]["Insert"]>;
      };

      api_cache: {
        Row: {
          key: string;
          value: Record<string, unknown>;
          fetched_at: string;
          ttl_seconds: number;
        };
        Insert: {
          key: string;
          value: Record<string, unknown>;
          fetched_at?: string;
          ttl_seconds?: number;
        };
        Update: {
          value?: Record<string, unknown>;
          fetched_at?: string;
          ttl_seconds?: number;
        };
      };
      alerts: {
        Row: {
          id: string;
          user_id: string;
          instrument: string;
          condition_type: "dcs_above" | "direction_change" | "new_pattern" | "price_level";
          threshold: number | null;
          active: boolean;
          last_triggered_at: string | null;
          notification_channels: ("email" | "webhook" | "browser")[];
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          instrument: string;
          condition_type: "dcs_above" | "direction_change" | "new_pattern" | "price_level";
          threshold?: number | null;
          active?: boolean;
          last_triggered_at?: string | null;
          notification_channels?: ("email" | "webhook" | "browser")[];
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["alerts"]["Insert"]>;
      };

      notifications: {
        Row: {
          id: string;
          user_id: string;
          alert_id: string | null;
          message: string;
          signal_id: string | null;
          sent_at: string;
          read_at: string | null;
          delivery_status: Record<string, unknown> | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          alert_id?: string | null;
          message: string;
          signal_id?: string | null;
          sent_at?: string;
          read_at?: string | null;
          delivery_status?: Record<string, unknown> | null;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
      };

      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["push_subscriptions"]["Insert"]>;
      };

      user_webhooks: {
        Row: {
          user_id: string;
          url: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          url: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_webhooks"]["Insert"]>;
      };
    };
    Functions: {
      archive_expired_signals: { Args: Record<never, never>; Returns: void };
      purge_stale_cache: { Args: Record<never, never>; Returns: void };
    };
    Enums: {
      asset_class: AssetClass;
      signal_direction: SignalDirection;
      signal_outcome: SignalOutcome;
    };
  };
}

// ── Convenience row types ────────────────────────────────────
export type Instrument = Database["public"]["Tables"]["instruments"]["Row"];
export type Signal     = Database["public"]["Tables"]["signals"]["Row"];
export type Archive    = Database["public"]["Tables"]["signal_archive"]["Row"];
export type ApiCache   = Database["public"]["Tables"]["api_cache"]["Row"];
export type Alert      = Database["public"]["Tables"]["alerts"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];

// ── Joined types (signals + instrument) ─────────────────────
export interface SignalWithInstrument extends Signal {
  instruments: Pick<Instrument, "symbol" | "name" | "asset_class">;
}

// ── Joined archive type ───────────────────────────────────────
export interface ArchiveWithInstrument extends Archive {
  instruments: Pick<Instrument, "symbol" | "name" | "asset_class">;
}
