-- ============================================================
-- SignalCenter.co.uk — Migration 002: Performance Tracker
-- Run in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql/new
-- ============================================================

-- ── 1. Extend signal_outcome enum with 'expired' ─────────────
-- NOTE: PostgreSQL requires committing the ALTER TYPE before using
-- the new value in the same transaction — run each block separately
-- if needed, or use the IF NOT EXISTS guard below.
ALTER TYPE signal_outcome ADD VALUE IF NOT EXISTS 'expired';

-- ── 2. Add outcome tracking columns to signals ───────────────
ALTER TABLE signals
  ADD COLUMN IF NOT EXISTS entry_price   numeric,
  ADD COLUMN IF NOT EXISTS outcome_price numeric;

-- ── 3. Add outcome tracking columns to signal_archive ────────
ALTER TABLE signal_archive
  ADD COLUMN IF NOT EXISTS entry_price   numeric,
  ADD COLUMN IF NOT EXISTS outcome_price numeric;

-- ── 4. Index for performance queries ─────────────────────────
CREATE INDEX IF NOT EXISTS idx_signals_pending
  ON signals (outcome, created_at DESC)
  WHERE outcome = 'pending';

CREATE INDEX IF NOT EXISTS idx_archive_outcome_created
  ON signal_archive (outcome, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_archive_conviction
  ON signal_archive (consensus_score DESC);

CREATE INDEX IF NOT EXISTS idx_archive_timeframe
  ON signal_archive (timeframe);

-- ── 5. View: daily performance rollup ────────────────────────
CREATE OR REPLACE VIEW signal_daily_performance AS
SELECT
  date_trunc('day', sa.created_at)::date           AS day,
  i.asset_class,
  COUNT(*)                                          AS total,
  COUNT(*) FILTER (WHERE sa.outcome = 'win')        AS wins,
  COUNT(*) FILTER (WHERE sa.outcome = 'loss')       AS losses,
  COUNT(*) FILTER (WHERE sa.outcome = 'expired')    AS expired,
  ROUND(
    COUNT(*) FILTER (WHERE sa.outcome = 'win')::numeric
    / NULLIF(
        COUNT(*) FILTER (WHERE sa.outcome IN ('win','loss')),
        0
      ) * 100,
    1
  )                                                 AS win_rate_pct
FROM signal_archive sa
JOIN instruments i ON i.id = sa.instrument_id
GROUP BY 1, 2
ORDER BY 1 DESC, 2;

COMMENT ON VIEW signal_daily_performance IS
  'Pre-rolled daily win/loss counts per asset class for the performance chart.';

-- ── 6. View: DCS accuracy buckets ────────────────────────────
CREATE OR REPLACE VIEW dcs_accuracy_buckets AS
SELECT
  (floor(consensus_score / 10) * 10)::integer       AS bucket_floor,
  (floor(consensus_score / 10) * 10 + 9)::integer   AS bucket_ceil,
  COUNT(*)                                           AS total,
  COUNT(*) FILTER (WHERE outcome = 'win')            AS wins,
  ROUND(
    COUNT(*) FILTER (WHERE outcome = 'win')::numeric
    / NULLIF(COUNT(*) FILTER (WHERE outcome IN ('win','loss')), 0)
    * 100,
    1
  )                                                  AS win_rate_pct
FROM signal_archive
WHERE outcome IN ('win', 'loss')
GROUP BY 1, 2
ORDER BY 1;

COMMENT ON VIEW dcs_accuracy_buckets IS
  'Win rate by DCS score bucket (0–9, 10–19, …, 90–99) for scatter-plot overlay.';

-- ── 7. View: instrument leaderboard ──────────────────────────
CREATE OR REPLACE VIEW instrument_leaderboard AS
SELECT
  i.symbol,
  i.name,
  i.asset_class,
  COUNT(*)                                           AS total,
  COUNT(*) FILTER (WHERE sa.outcome = 'win')         AS wins,
  ROUND(
    COUNT(*) FILTER (WHERE sa.outcome = 'win')::numeric
    / NULLIF(COUNT(*) FILTER (WHERE sa.outcome IN ('win','loss')), 0)
    * 100,
    1
  )                                                  AS win_rate_pct,
  ROUND(AVG(
    CASE
      WHEN sa.outcome_price IS NOT NULL
       AND sa.entry_price IS NOT NULL
       AND sa.entry_price <> 0
      THEN ABS(sa.outcome_price - sa.entry_price) / sa.entry_price * 100
    END
  ), 2)                                              AS avg_move_pct
FROM signal_archive sa
JOIN instruments i ON i.id = sa.instrument_id
WHERE sa.outcome IN ('win', 'loss')
GROUP BY i.id, i.symbol, i.name, i.asset_class
HAVING COUNT(*) >= 3
ORDER BY win_rate_pct DESC NULLS LAST;

COMMENT ON VIEW instrument_leaderboard IS
  'Per-instrument win rate ranking for the "best performer" stat.';
