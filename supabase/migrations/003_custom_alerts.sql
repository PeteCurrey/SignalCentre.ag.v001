-- ============================================================
-- SignalCenter.co.uk — Migration 003: Custom Alerts (Floor Tier)
-- Run in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql/new
-- ============================================================

-- ── 1. alerts table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alerts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  instrument text NOT NULL,
  condition_type text NOT NULL CHECK (condition_type IN ('dcs_above', 'direction_change', 'new_pattern', 'price_level')),
  threshold numeric,
  active boolean DEFAULT true,
  last_triggered_at timestamp with time zone,
  notification_channels text[] DEFAULT '{"browser"}'::text[],
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alerts_active_user ON alerts (active, user_id);

-- ── 2. notifications table ───────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  alert_id uuid REFERENCES alerts(id) ON DELETE CASCADE,
  message text NOT NULL,
  signal_id text,
  sent_at timestamp with time zone DEFAULT now(),
  read_at timestamp with time zone,
  delivery_status jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications (user_id, read_at) WHERE read_at IS NULL;

-- ── 3. push_subscriptions table ──────────────────────────────
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_subs_user ON push_subscriptions (user_id);

-- ── 4. user_webhooks table ───────────────────────────────────
CREATE TABLE IF NOT EXISTS user_webhooks (
  user_id text PRIMARY KEY,
  url text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);
