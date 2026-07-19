-- ============================================================
-- Signal Centre: Apply ALL pending migrations manually
-- Run in Supabase SQL Editor → https://supabase.com/dashboard
-- Project: mlnvtipvbzmqcikomcxr
-- ============================================================

-- ── scan_log table (for AI engine audit trail) ───────────────
CREATE TABLE IF NOT EXISTS scan_log (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  instrument       text NOT NULL,
  status           text NOT NULL CHECK (status IN ('success', 'failure')),
  models_responded integer NOT NULL DEFAULT 0,
  error_message    text,
  scanned_at       timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scan_log_scanned_at ON scan_log (scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_scan_log_instrument ON scan_log (instrument);

-- ── signals: add expires_at if missing ───────────────────────
ALTER TABLE signals ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone;

-- ── signals: add ATR / entry / SL / TP if missing ────────────
ALTER TABLE signals
  ADD COLUMN IF NOT EXISTS atr_value  numeric,
  ADD COLUMN IF NOT EXISTS entry_price numeric,
  ADD COLUMN IF NOT EXISTS stop_loss   numeric,
  ADD COLUMN IF NOT EXISTS target_1    numeric,
  ADD COLUMN IF NOT EXISTS target_2    numeric,
  ADD COLUMN IF NOT EXISTS target_3    numeric,
  ADD COLUMN IF NOT EXISTS rr_ratio    numeric;

-- ── signals: add AI model columns if missing ─────────────────
ALTER TABLE signals
  ADD COLUMN IF NOT EXISTS claude_direction text,
  ADD COLUMN IF NOT EXISTS gpt_direction    text,
  ADD COLUMN IF NOT EXISTS grok_direction   text,
  ADD COLUMN IF NOT EXISTS catalyst_text    text;

-- ── instruments table: ensure it exists ──────────────────────
CREATE TABLE IF NOT EXISTS instruments (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol     text NOT NULL UNIQUE,
  name       text NOT NULL,
  asset_class text NOT NULL CHECK (asset_class IN ('forex', 'indices', 'commodities', 'crypto')),
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_instruments_symbol ON instruments (symbol);

-- ── Seed instruments ──────────────────────────────────────────
INSERT INTO instruments (symbol, name, asset_class) VALUES
  ('EUR/USD','Euro / US Dollar','forex'),
  ('GBP/USD','British Pound / US Dollar','forex'),
  ('USD/JPY','US Dollar / Japanese Yen','forex'),
  ('GBP/JPY','British Pound / Japanese Yen','forex'),
  ('AUD/USD','Australian Dollar / US Dollar','forex'),
  ('USD/CAD','US Dollar / Canadian Dollar','forex'),
  ('NZD/USD','New Zealand Dollar / US Dollar','forex'),
  ('USD/CHF','US Dollar / Swiss Franc','forex'),
  ('EUR/GBP','Euro / British Pound','forex'),
  ('EUR/JPY','Euro / Japanese Yen','forex'),
  ('US500','S&P 500','indices'),
  ('US30','Dow Jones','indices'),
  ('UK100','FTSE 100','indices'),
  ('GER40','DAX 40','indices'),
  ('JPN225','Nikkei 225','indices'),
  ('AUS200','ASX 200','indices'),
  ('GOLD','Gold / USD','commodities'),
  ('SILVER','Silver / USD','commodities'),
  ('USOIL','WTI Crude Oil','commodities'),
  ('UKOIL','Brent Crude Oil','commodities'),
  ('NATGAS','Natural Gas','commodities'),
  ('BTC/USD','Bitcoin / USD','crypto'),
  ('ETH/USD','Ethereum / USD','crypto'),
  ('SOL/USD','Solana / USD','crypto'),
  ('BNB/USD','Binance Coin / USD','crypto'),
  ('XRP/USD','XRP / USD','crypto')
ON CONFLICT (symbol) DO NOTHING;

-- ── Enable realtime on signals ────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE signals;
