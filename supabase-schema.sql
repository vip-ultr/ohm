-- ═══════════════════════════════════════════════════════════════════
-- Ohm Markets — Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ═══════════════════════════════════════════════════════════════════

-- ─── Users ────────────────────────────────────────────────────────
-- Synced from Privy on first login. user.id is the Privy DID
-- (e.g. "did:privy:abc123xyz")
CREATE TABLE IF NOT EXISTS users (
  id              TEXT PRIMARY KEY,           -- Privy user.id
  wallet_address  TEXT,                       -- primary wallet
  email           TEXT,
  login_type      TEXT,                       -- 'wallet' | 'email' | 'google' | 'twitter'
  preferences     JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ─── Watchlist ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS watchlist (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_address   TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, token_address)
);

-- ─── Token analytics cache ─────────────────────────────────────────
-- Reduces redundant API calls to Helius/Bags.fm for the same token
CREATE TABLE IF NOT EXISTS token_analytics (
  token_address     TEXT PRIMARY KEY,
  price             NUMERIC,
  volume_24h        NUMERIC,
  liquidity         NUMERIC,
  holders           INTEGER,
  market_cap        NUMERIC,
  price_change_24h  NUMERIC,
  raw_data          JSONB,                    -- full merged response from Bags.fm + Helius
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- ─── RLS ───────────────────────────────────────────────────────────
-- Enable Row Level Security on tables with user data
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

-- Policy: users can only see their own watchlist entries
-- NOTE: We bypass RLS from route handlers using the service role key.
-- This policy protects direct client access.
CREATE POLICY IF NOT EXISTS "Users manage own watchlist"
  ON watchlist
  FOR ALL
  USING (user_id = current_setting('app.user_id', TRUE))
  WITH CHECK (user_id = current_setting('app.user_id', TRUE));

-- ─── Indexes ───────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_token ON watchlist(token_address);
CREATE INDEX IF NOT EXISTS idx_token_analytics_updated ON token_analytics(updated_at);

-- ─── Auto-update timestamps ────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER token_analytics_updated_at
  BEFORE UPDATE ON token_analytics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
