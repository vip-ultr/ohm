/**
 * lib/solscan.ts
 * Solscan Pro API v1/v2 wrapper — wallet detail, token balances, transfer history.
 * Docs: https://pro-api.solscan.io/pro-api-docs/v2.0
 * Requires SOLSCAN_API_KEY in .env.local (server-only, no NEXT_PUBLIC_)
 */
import type { HistoryRow } from "@/types";

const SOLSCAN_KEY  = process.env.SOLSCAN_API_KEY ?? "";
const BASE         = "https://pro-api.solscan.io";
const SOL_MINT     = "So11111111111111111111111111111111111111112";

function authHeaders() {
  return { token: SOLSCAN_KEY };
}

// Reuse formatting helpers inline (avoids circular dep with lib/helius)
function fmtAmt(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)         return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(4);
}

function shortenMint(addr: string): string {
  if (!addr || addr.length < 10) return addr ?? "";
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

// ─── Types ────────────────────────────────────────────────────────

export interface SolscanAccountDetail {
  lamports: number;
  solBalance: number; // lamports / 1e9
  accountType: string;
}

export interface SolscanToken {
  mint: string;
  name: string;
  symbol: string;
  logoUrl: string | null;
  balance: number;
  decimals: number;
  priceUsd: number;
  valueUsd: number;
}

// ─── 1. Account Detail — SOL balance ─────────────────────────────

export async function fetchSolscanAccountDetail(
  address: string
): Promise<SolscanAccountDetail> {
  const res = await fetch(
    `${BASE}/v2.0/account/detail?address=${address}`,
    { headers: authHeaders(), next: { revalidate: 30 } }
  );
  if (!res.ok) throw new Error(`Solscan account/detail ${res.status}`);
  const json = await res.json() as { data?: Record<string, unknown> };
  const d = json.data ?? {};
  const lamports = Number(d.lamports ?? 0);
  return {
    lamports,
    solBalance: lamports / 1e9,
    accountType: String(d.type ?? "unknown"),
  };
}

// ─── 2. Account Tokens — SPL balances + prices ───────────────────

export async function fetchSolscanTokens(
  address: string
): Promise<SolscanToken[]> {
  const res = await fetch(
    `${BASE}/v1.0/account/tokens?account=${address}`,
    { headers: authHeaders(), next: { revalidate: 30 } }
  );
  if (!res.ok) return [];

  const raw = await res.json() as unknown;
  // v1 returns array directly or wrapped { data: [] }
  const data: Record<string, unknown>[] = Array.isArray(raw)
    ? (raw as Record<string, unknown>[])
    : ((raw as { data?: Record<string, unknown>[] }).data ?? []);

  return data
    .filter((t) => {
      const amt = (t.tokenAmount as { uiAmount?: number } | undefined)?.uiAmount ?? 0;
      return amt > 0;
    })
    .map((t) => {
      const amt = (t.tokenAmount as { uiAmount?: number } | undefined)?.uiAmount ?? 0;
      return {
        mint:     String(t.tokenAddress ?? ""),
        name:     String(t.tokenName ?? t.tokenSymbol ?? `${String(t.tokenAddress ?? "").slice(0, 8)}…`),
        symbol:   String(t.tokenSymbol ?? "???"),
        logoUrl:  t.tokenIcon ? String(t.tokenIcon) : null,
        balance:  amt,
        decimals: Number(t.decimals ?? 0),
        priceUsd: Number(t.priceUsdt ?? 0),
        valueUsd: Number(t.valueUsdt ?? 0),
      };
    });
}

// ─── 3. Transfer History → HistoryRow[] ──────────────────────────

// Maps Solscan activity_type + flow to our HistoryRow type
function mapTxType(
  activityType: string,
  flow: string
): HistoryRow["type"] {
  switch (activityType) {
    case "SPL_BURN":       return "burn";
    case "SPL_MINT":       return "mint";
    case "SYSTEM_TRANSFER":
    case "SPL_TRANSFER":
    default:
      return flow === "in" ? "receive" : "send";
  }
}

// Build a token symbol lookup from transfers to enrich ticker/token fields
async function fetchTokenSymbolMap(
  mints: string[]
): Promise<Map<string, { symbol: string; name: string }>> {
  const map = new Map<string, { symbol: string; name: string }>();
  if (!mints.length) return map;

  // Solscan v2 token meta: GET /v2.0/token/meta?address=
  // Batch: call in parallel (max 20 at once)
  const unique = Array.from(new Set(mints)).slice(0, 20);
  const results = await Promise.allSettled(
    unique.map((mint) =>
      fetch(`${BASE}/v2.0/token/meta?address=${mint}`, {
        headers: authHeaders(),
        next: { revalidate: 3600 },
      }).then((r) => (r.ok ? r.json() : null))
    )
  );

  for (let i = 0; i < unique.length; i++) {
    const r = results[i];
    if (r.status === "fulfilled" && r.value) {
      const d = (r.value as { data?: { symbol?: string; name?: string } }).data;
      if (d) {
        map.set(unique[i], {
          symbol: d.symbol ?? shortenMint(unique[i]),
          name:   d.name   ?? shortenMint(unique[i]),
        });
      }
    }
  }
  return map;
}

export async function fetchSolscanTransfers(
  address: string,
  pageSize = 40
): Promise<HistoryRow[]> {
  // Fetch all activity types (SPL_TRANSFER, SPL_BURN, SPL_MINT, SYSTEM_TRANSFER)
  const res = await fetch(
    `${BASE}/v2.0/account/transfer?address=${address}&page=1&page_size=${pageSize}&sort_by=block_time&sort_order=desc`,
    { headers: authHeaders(), next: { revalidate: 30 } }
  );
  if (!res.ok) return [];

  const json = await res.json() as { data?: Record<string, unknown>[] };
  const data = json.data ?? [];

  // Collect unique token mints for metadata enrichment
  const mints = data
    .map((tx) => String(tx.token_address ?? ""))
    .filter((m) => m && m !== SOL_MINT);

  const symbolMap = await fetchTokenSymbolMap(mints);

  const rows: HistoryRow[] = data.map((tx) => {
    const activityType = String(tx.activity_type ?? "SPL_TRANSFER");
    const flow         = String(tx.flow ?? "out");
    const decimals     = Number(tx.token_decimals ?? 9);
    const rawAmt       = Number(tx.amount ?? 0);
    const actualAmt    = rawAmt / Math.pow(10, decimals);
    const mintAddr     = String(tx.token_address ?? "");
    const isSOL        = mintAddr === SOL_MINT;

    const meta = symbolMap.get(mintAddr);
    const ticker = isSOL ? "SOL" : (meta?.symbol ?? shortenMint(mintAddr));
    const name   = isSOL ? "Solana" : (meta?.name   ?? shortenMint(mintAddr));

    const blockTime = Number(tx.block_time ?? 0);

    return {
      id:        String(tx.trans_id ?? Math.random().toString(36)),
      time:      new Date(blockTime * 1000).toLocaleString(),
      timestamp: blockTime,
      token:     name,
      ticker,
      mint:      mintAddr,
      amount:    fmtAmt(actualAmt),
      amountRaw: actualAmt,
      price:     "",   // no historical price from Solscan transfers endpoint
      priceRaw:  0,
      type:      mapTxType(activityType, flow),
    };
  });

  // Sort newest first
  return rows.sort((a, b) => b.timestamp - a.timestamp);
}
