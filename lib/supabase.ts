import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

// Client-side singleton (uses anon key, respects RLS)
let _browser: ReturnType<typeof createClient> | null = null;
export function getSupabaseBrowser() {
  if (!_browser) {
    _browser = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _browser;
}

// Server-side client (uses service role key, bypasses RLS)
// Only call this in API route handlers (server-side)
export function createServerSupabaseClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// ─── Helper types ─────────────────────────────────────────────────
export interface DbUser {
  id: string;
  wallet_address: string | null;
  email: string | null;
  login_type: string;
  preferences: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface DbWatchlistItem {
  id: string;
  user_id: string;
  token_address: string;
  created_at: string;
}

export interface DbTokenAnalytics {
  token_address: string;
  price: number | null;
  volume_24h: number | null;
  liquidity: number | null;
  holders: number | null;
  market_cap: number | null;
  price_change_24h: number | null;
  raw_data: Record<string, unknown> | null;
  updated_at: string;
}
