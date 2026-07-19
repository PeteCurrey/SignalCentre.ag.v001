-- ============================================================
-- SignalCenter.co.uk — Supabase Schema
-- Version: 1.0.0
-- Run this in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql/new
-- ============================================================

-- ── Extensions ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Enums ───────────────────────────────────────────────────
create type asset_class as enum ('forex', 'indices', 'commodities', 'crypto');
create type signal_direction as enum ('bullish', 'bearish', 'neutral');
create type signal_outcome as enum ('pending', 'win', 'loss');

-- ============================================================
-- instruments
-- Master list of tracked instruments
-- ============================================================
create table if not exists instruments (
  id            uuid primary key default uuid_generate_v4(),
  symbol        text not null unique,          -- e.g. "EURUSD", "XAUUSD"
  name          text not null,                 -- e.g. "Euro / US Dollar"
  asset_class   asset_class not null,
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

comment on table instruments is 'Master registry of all tracked market instruments.';

create index idx_instruments_asset_class on instruments(asset_class);
create index idx_instruments_active     on instruments(active);

-- ============================================================
-- signals
-- Live and recent signals (rolling ~7 days)
-- ============================================================
create table if not exists signals (
  id              uuid primary key default uuid_generate_v4(),
  instrument_id   uuid not null references instruments(id) on delete cascade,

  -- Direction & scoring
  direction       signal_direction not null,
  conviction      integer not null check (conviction between 0 and 100),
  consensus_score integer not null check (consensus_score between 0 and 100),
  risk_grade      text not null check (risk_grade in ('A+','A','B','C','D')),

  -- Context
  timeframe       text not null,               -- e.g. 'H4', 'D1'
  session         text,                        -- e.g. 'London Open'
  source          text not null default 'system', -- 'system' | 'manual' | 'api'

  -- Opportunity framework
  entry_zone      text,                        -- e.g. '1.0800 – 1.0820'
  sl              text,                        -- Stop loss level
  tp              text,                        -- Take profit level

  -- Lifecycle
  created_at      timestamptz not null default now(),
  expires_at      timestamptz,
  outcome         signal_outcome not null default 'pending',

  -- AI Consensus Metadata
  metadata        jsonb
);

comment on table signals is 'Live signal feed — rolling window, archived to signal_archive on expiry.';

create index idx_signals_instrument  on signals(instrument_id);
create index idx_signals_direction   on signals(direction);
create index idx_signals_conviction  on signals(conviction desc);
create index idx_signals_created_at  on signals(created_at desc);
create index idx_signals_outcome     on signals(outcome);

-- ============================================================
-- signal_archive
-- Historical signal store — mirrors signals schema
-- Populated by a Supabase scheduled function or app trigger
-- ============================================================
create table if not exists signal_archive (
  id              uuid primary key default uuid_generate_v4(),
  original_id     uuid not null,               -- references the original signals.id
  instrument_id   uuid not null references instruments(id),

  direction       signal_direction not null,
  conviction      integer not null,
  consensus_score integer not null,
  risk_grade      text not null,
  timeframe       text not null,
  session         text,
  source          text not null default 'system',
  entry_zone      text,
  sl              text,
  tp              text,

  created_at      timestamptz not null,
  expires_at      timestamptz,
  outcome         signal_outcome not null,
  archived_at     timestamptz not null default now(),

  -- AI Consensus Metadata
  metadata        jsonb
);

comment on table signal_archive is 'Immutable historical record of all resolved signals for performance analysis.';

create index idx_archive_instrument  on signal_archive(instrument_id);
create index idx_archive_outcome     on signal_archive(outcome);
create index idx_archive_created_at  on signal_archive(created_at desc);
create index idx_archive_original_id on signal_archive(original_id);

-- ============================================================
-- api_cache
-- Key-value store for external API responses
-- TTL enforced at application layer (ttl_seconds)
-- ============================================================
create table if not exists api_cache (
  key         text primary key,                -- e.g. 'td:ohlcv:EURUSD:1h'
  value       jsonb not null,
  fetched_at  timestamptz not null default now(),
  ttl_seconds integer not null default 60
);

comment on table api_cache is 'Server-side cache for Twelve Data and Finnhub API responses.';

create index idx_cache_fetched_at on api_cache(fetched_at);

-- ============================================================
-- Row Level Security
-- ============================================================

-- instruments — publicly readable, service role for writes
alter table instruments enable row level security;
create policy "instruments_public_read"
  on instruments for select using (true);

-- signals — publicly readable, service role for writes
alter table signals enable row level security;
create policy "signals_public_read"
  on signals for select using (true);

-- signal_archive — publicly readable, service role for writes
alter table signal_archive enable row level security;
create policy "signal_archive_public_read"
  on signal_archive for select using (true);

-- api_cache — server-only (service role key required)
alter table api_cache enable row level security;
-- No public read policy — only service role can access

-- ============================================================
-- Utility Functions
-- ============================================================

-- Archive and delete expired signals
create or replace function archive_expired_signals()
returns void
language plpgsql
security definer
as $$
begin
  -- Copy expired pending signals to archive
  insert into signal_archive (
    original_id, instrument_id, direction, conviction, consensus_score,
    risk_grade, timeframe, session, source, entry_zone, sl, tp,
    created_at, expires_at, outcome, metadata
  )
  select
    id, instrument_id, direction, conviction, consensus_score,
    risk_grade, timeframe, session, source, entry_zone, sl, tp,
    created_at, expires_at, outcome, metadata
  from signals
  where expires_at < now()
    and outcome = 'pending';

  -- Update pending expired signals to 'loss' in archive (conservative default)
  update signal_archive
  set outcome = 'loss'
  where outcome = 'pending'
    and expires_at < now();

  -- Remove expired signals from live table
  delete from signals where expires_at < now();
end;
$$;

-- Clean stale cache entries
create or replace function purge_stale_cache()
returns void
language plpgsql
security definer
as $$
begin
  delete from api_cache
  where fetched_at + (ttl_seconds || ' seconds')::interval < now();
end;
$$;

-- ============================================================
-- Seed — Instruments
-- ============================================================
insert into instruments (symbol, name, asset_class) values
  ('EURUSD',  'Euro / US Dollar',          'forex'),
  ('GBPUSD',  'British Pound / US Dollar', 'forex'),
  ('USDJPY',  'US Dollar / Japanese Yen',  'forex'),
  ('USDCHF',  'US Dollar / Swiss Franc',   'forex'),
  ('AUDUSD',  'Australian Dollar / USD',   'forex'),
  ('GBPJPY',  'British Pound / Yen',       'forex'),
  ('XAUUSD',  'Gold / US Dollar',          'commodities'),
  ('XAGUSD',  'Silver / US Dollar',        'commodities'),
  ('USOIL',   'WTI Crude Oil',             'commodities'),
  ('US30',    'Dow Jones Industrial',      'indices'),
  ('NAS100',  'Nasdaq 100',               'indices'),
  ('SPX500',  'S&P 500',                  'indices'),
  ('UK100',   'FTSE 100',                 'indices'),
  ('GER40',   'DAX 40',                   'indices'),
  ('BTCUSD',  'Bitcoin / US Dollar',       'crypto'),
  ('ETHUSD',  'Ethereum / US Dollar',      'crypto'),
  ('SOLUSD',  'Solana / US Dollar',        'crypto'),
  ('BNBUSD',  'BNB / US Dollar',           'crypto')
on conflict (symbol) do nothing;
