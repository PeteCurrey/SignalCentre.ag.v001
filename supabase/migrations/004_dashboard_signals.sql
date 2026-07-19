-- ============================================================
-- Migration 004: Dashboard signals extended schema
-- Adds columns needed for the full signal card UI
-- Run in Supabase SQL Editor
-- ============================================================

-- Add extended columns to signals table
ALTER TABLE signals
  ADD COLUMN IF NOT EXISTS stop_loss     numeric,
  ADD COLUMN IF NOT EXISTS target_1      numeric,
  ADD COLUMN IF NOT EXISTS target_2      numeric,
  ADD COLUMN IF NOT EXISTS target_3      numeric,
  ADD COLUMN IF NOT EXISTS rr_ratio      numeric,
  ADD COLUMN IF NOT EXISTS claude_direction text CHECK (claude_direction IN ('bullish','bearish','neutral')),
  ADD COLUMN IF NOT EXISTS gpt_direction   text CHECK (gpt_direction   IN ('bullish','bearish','neutral')),
  ADD COLUMN IF NOT EXISTS grok_direction  text CHECK (grok_direction  IN ('bullish','bearish','neutral')),
  ADD COLUMN IF NOT EXISTS catalyst_text   text,
  ADD COLUMN IF NOT EXISTS asset_class     text,
  ADD COLUMN IF NOT EXISTS instrument      text;

-- Watchlist table
CREATE TABLE IF NOT EXISTS user_watchlist (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     text NOT NULL,
  signal_id   text NOT NULL,
  instrument  text,
  created_at  timestamp with time zone DEFAULT now(),
  UNIQUE (user_id, signal_id)
);

CREATE INDEX IF NOT EXISTS idx_watchlist_user ON user_watchlist (user_id);

-- Enable realtime on signals
ALTER PUBLICATION supabase_realtime ADD TABLE signals;
