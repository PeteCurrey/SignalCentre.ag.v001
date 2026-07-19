-- ============================================================
-- Migration: Add scan_log table and updates
-- ============================================================

CREATE TABLE IF NOT EXISTS scan_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  instrument text NOT NULL,
  status text NOT NULL, -- 'success', 'failure'
  models_responded integer NOT NULL,
  error_message text,
  scanned_at timestamp with time zone DEFAULT now()
);

-- Ensure expires_at exists on signals
ALTER TABLE signals ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone;
