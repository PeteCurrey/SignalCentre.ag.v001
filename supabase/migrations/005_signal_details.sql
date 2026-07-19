-- ============================================================
-- Migration 005: Signal details (AI, Acuity, TC, TA)
-- Adds columns needed for the signal detail page
-- Run in Supabase SQL Editor
-- ============================================================

ALTER TABLE signals
  ADD COLUMN IF NOT EXISTS tc_consensus_score numeric,
  ADD COLUMN IF NOT EXISTS tc_alert_text      text,
  ADD COLUMN IF NOT EXISTS claude_reasoning   text,
  ADD COLUMN IF NOT EXISTS gpt_reasoning      text,
  ADD COLUMN IF NOT EXISTS grok_reasoning     text,
  ADD COLUMN IF NOT EXISTS acuity_rationale   text,
  ADD COLUMN IF NOT EXISTS acuity_confidence  numeric,
  ADD COLUMN IF NOT EXISTS atr_value          numeric,
  ADD COLUMN IF NOT EXISTS fibonacci_levels   jsonb;
