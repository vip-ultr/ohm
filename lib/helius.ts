import type {
  Trade,
  Holder,
  WhaleTx,
  OHLCVPoint,
  HistoryRow,
} from "@/types";

const HELIUS_API_KEY = process.env.HELIUS_API_KEY!;
const HELIUS_BASE_URL =
  process.env.HELIUS_BASE_URL ?? "https://api.helius.xyz/v0";
const HELIUS_RPC_URL =
  process.env.HELIUS_RPC_URL ?? "https://mainnet.helius-rpc.com";

// ─── Utility helpers ──────────────────────────────────────────────
export function timeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp * 1000;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  return `${days}d`;
}

export function shortenAddr(addr: string, chars = 4): string {
  if (!addr || addr.length < chars * 2 + 3) return addr;
  return `${addr.slice(0, chars)}…${addr.slice(-chars)}`;
}

export function fmtAmount(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(2);
}

export function fmtPrice(n: number): string {
  if (n === 0) return "$0.00";
  if (n < 0.000001) return `$${n.toExponential(3)}`;
  if (n < 0.01) return `$${n.toFixed(6)}`;
  if (n < 1) return `$${n.toFixed(4)}`;
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Deterministic avatar color from mint address
export function avatarColor(address: string): string {
  const colors = [
    "#03A338", "#2563eb", "#9333ea", "#dc2626",
    "#ea580c", "#ca8a04", "#0891b2", "#be185d",
  ];
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = address.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// ─── RPC helper ───────────────────────────────────────────────────
async function rpc(method: string, params: unknown[]): Promise<unknown> {
  const res = await fetch(`${HELIUS_RPC_URL}/?api-key=${HELIUS_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: "ohm", method, params }),
    next: { revalidate: 30 },
  });
  if (!res.ok) throw new Error(`Helius RPC error: ${res.status}`);
  const json = (await res.json()) as { result?: unknown; error?: { message: string } };
  if (json.error) throw new Error(json.error.message);
  return json.result;
}

// ─── DAS API helper ───────────────────────────────────────────────
async function dasPost(method: string, params: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(`${HELIUS_RPC_URL}/?api-key=${HELIUS_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: "ohm-das", method, params }),
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`Helius DAS error: ${res.status}`);
  const json = (await res.json()) as { result?: unknown; error?: { message: string } };
  if (json.error) throw new Error(json.error.message);
  return json.result;
}

// ─── Token metadata via DAS ───────────────────────────────────────
export interface TokenMetadata {
  name: string;
  symbol: string;
  imageUrl: string | null;
  description: string;
  supply: number;
  decimals: number;
}

export async function fetchTokenMetadata(
  mintAddresses: string[]
): Promise<Record<string, TokenMetadata>> {
  const result = await dasPost("getAssetBatch", { ids: mintAddresses }) as Array<{
    id: string;
    content?: {
      metadata?: { name?: string; symbol?: string; description?: string };
      links?: { image?: string };
    };
    token_info?: { supply?: number; decimals?: number };
  }>;

  const map: Record<string, TokenMetadata> = {};
  for (const asset of result ?? []) {
    map[asset.id] = {
      name: asset.content?.metadata?.name ?? "Unknown",
      symbol: asset.content?.metadata?.symbol ?? "???",
      imageUrl: asset.content?.links?.image ?? null,
      description: asset.content?.metadata?.description ?? "",
      supply: (asset.token_info?.supply ?? 0) / Math.pow(10, asset.token_info?.decimals ?? 6),
      decimals: asset.token_info?.decimals ?? 6,
    };
  }
  return map;
}

// ─── Token holders ────────────────────────────────────────────────
export async function fetchTokenHolders(
  mintAddress: string,
  limit = 20
): Promise<Holder[]> {
  const result = await rpc("getTokenLargestAccounts", [mintAddress]) as {
    value: Array<{ address: string; amount: string; uiAmount: number | null }>
  };

  const accounts = result?.value ?? [];
  return accounts.slice(0, limit).map((acc, i) => {
    const bal = acc.uiAmount ?? 0;
    return {
      rank: i + 1,
      wallet: acc.address,
      balance: fmtAmount(bal),
      balanceRaw: bal,
      pct: "–",
      pctRaw: 0,
      value: "–",
      valueRaw: 0,
    };
  });
}

// ─── Token transactions ───────────────────────────────────────────
export async function fetchTokenTransactions(
  mintAddress: string,
  limit = 50,
  whaleThresholdSol = 10
): Promise<{ trades: Trade[]; whales: WhaleTx[] }> {
  const url = `${HELIUS_BASE_URL}/addresses/${mintAddress}/transactions?api-key=${HELIUS_API_KEY}&limit=${limit}&type=SWAP`;
  const res = await fetch(url, { next: { revalidate: 15 } });
  if (!res.ok) return { trades: [], whales: [] };

  const txs = (await res.json()) as Array<{
    signature: string;
    timestamp: number;
    type: string;
    tokenTransfers?: Array<{
      mint: string;
      toUserAccount?: string;
      fromUserAccount?: string;
      tokenAmount: number;
    }>;
    nativeTransfers?: Array<{
      amount: number;
      fromUserAccount?: string;
    }>;
    feePayer?: string;
  }>;

  const trades: Trade[] = [];
  const whales: WhaleTx[] = [];

  for (const tx of txs) {
    const transfer = tx.tokenTransfers?.find((t) => t.mint === mintAddress);
    if (!transfer) continue;

    const solTransfer = tx.nativeTransfers?.[0];
    const solValue = (solTransfer?.amount ?? 0) / 1e9;
    const isBuy = !!transfer.toUserAccount;
    const wallet = isBuy
      ? (transfer.toUserAccount ?? tx.feePayer ?? "")
      : (transfer.fromUserAccount ?? tx.feePayer ?? "");

    const trade: Trade = {
      id: tx.signature,
      time: new Date(tx.timestamp * 1000).toLocaleTimeString(),
      timestamp: tx.timestamp,
      type: isBuy ? "buy" : "sell",
      amount: fmtAmount(transfer.tokenAmount),
      amountRaw: transfer.tokenAmount,
      value: `${solValue.toFixed(3)} SOL`,
      valueRaw: solValue,
      wallet: shortenAddr(wallet),
      txHash: tx.signature,
    };

    trades.push(trade);

    if (solValue >= whaleThresholdSol) {
      whales.push({
        id: tx.signature,
        type: isBuy ? "buy" : "sell",
        wallet: shortenAddr(wallet),
        qty: fmtAmount(transfer.tokenAmount),
        qtyRaw: transfer.tokenAmount,
        value: `${solValue.toFixed(2)} SOL`,
        valueRaw: solValue,
        time: new Date(tx.timestamp * 1000).toLocaleTimeString(),
        timestamp: tx.timestamp,
        txHash: tx.signature,
      });
    }
  }

  return { trades, whales };
}

// ─── OHLCV / price history ────────────────────────────────────────
// Helius doesn't provide OHLCV natively; we construct from swap txs
export async function fetchTokenOHLCV(
  mintAddress: string,
  timeframe: "1H" | "24H" | "30D"
): Promise<OHLCVPoint[]> {
  const limitMap = { "1H": 20, "24H": 100, "30D": 200 };
  const { trades } = await fetchTokenTransactions(mintAddress, limitMap[timeframe]);

  if (trades.length === 0) return [];

  // Calculate price per token (SOL value / token amount) for each trade
  const points: OHLCVPoint[] = trades
    .sort((a, b) => a.timestamp - b.timestamp)
    .filter((t) => t.amountRaw > 0 && t.valueRaw > 0)
    .map((t) => {
      const pricePerToken = t.valueRaw / t.amountRaw; // SOL per token
      return {
        time: t.timestamp,
        open: pricePerToken,
        high: pricePerToken * 1.005,
        low: pricePerToken * 0.995,
        close: pricePerToken,
        value: pricePerToken,
      };
    });

  return points;
}

// ─── Wallet balances ──────────────────────────────────────────────
export interface WalletToken {
  mint: string;
  name: string;
  symbol: string;
  balance: number;
  decimals: number;
  logoUrl: string | null;
  priceUsd: number;
  valueUsd: number;
}

export async function fetchWalletBalances(address: string): Promise<{
  solBalance: number;
  tokens: WalletToken[];
}> {
  type DasAsset = {
    id: string;
    content?: {
      metadata?: { name?: string; symbol?: string };
      links?: { image?: string };
    };
    token_info?: {
      balance?: number;
      decimals?: number;
      price_info?: { price_per_token?: number; total_price?: number };
    };
    interface?: string;
  };

  type DasResult = { items?: DasAsset[]; total?: number };

  const [solResult, dasResult] = await Promise.allSettled([
    rpc("getBalance", [address]) as Promise<{ value: number }>,
    dasPost("getAssetsByOwner", {
      ownerAddress: address,
      page: 1,
      limit: 100,
      displayOptions: { showFungible: true, showNativeBalance: false },
    }) as Promise<DasResult>,
  ]);

  const solBalance =
    solResult.status === "fulfilled"
      ? (solResult.value as { value: number }).value / 1e9
      : 0;

  const tokens: WalletToken[] =
    dasResult.status === "fulfilled"
      ? (dasResult.value.items ?? [])
          .filter(
            (a) =>
              a.interface === "FungibleToken" ||
              a.interface === "FungibleAsset"
          )
          .map((a) => {
            const rawBalance = a.token_info?.balance ?? 0;
            const decimals = a.token_info?.decimals ?? 0;
            const balance = rawBalance / Math.pow(10, decimals);
            return {
              mint: a.id,
              name: a.content?.metadata?.name ?? a.id.slice(0, 8) + "…",
              symbol: a.content?.metadata?.symbol ?? "???",
              balance,
              decimals,
              logoUrl: a.content?.links?.image ?? null,
              priceUsd: a.token_info?.price_info?.price_per_token ?? 0,
              valueUsd: a.token_info?.price_info?.total_price ?? 0,
            };
          })
          .filter((t) => t.balance > 0)
      : [];

  return { solBalance, tokens };
}

// ─── Wallet transaction history (RPC-only — avoids api.helius.xyz) ───────────
type ParsedTx = {
  blockTime: number;
  meta?: {
    err: unknown;
    preBalances?: number[];
    postBalances?: number[];
    preTokenBalances?: Array<{
      accountIndex: number;
      mint: string;
      owner?: string;
      uiTokenAmount: { uiAmount: number | null };
    }>;
    postTokenBalances?: Array<{
      accountIndex: number;
      mint: string;
      owner?: string;
      uiTokenAmount: { uiAmount: number | null };
    }>;
  };
  transaction: {
    signatures: string[];
    message: {
      accountKeys: Array<{ pubkey: string }>;
    };
  };
};

export async function fetchWalletTransactions(
  address: string,
  limit = 30
): Promise<HistoryRow[]> {
  // Step 1: get recent signatures via RPC
  const sigs = (await rpc("getSignaturesForAddress", [
    address,
    { limit, commitment: "finalized" },
  ])) as Array<{ signature: string; blockTime: number | null; err: unknown }>;

  if (!sigs?.length) return [];

  const validSigs = sigs.filter((s) => !s.err && s.blockTime != null).slice(0, limit);
  if (!validSigs.length) return [];

  // Step 2: batch-fetch all parsed transactions in a single HTTP call
  const batchBody = validSigs.map((s, i) => ({
    jsonrpc: "2.0" as const,
    id: i,
    method: "getTransaction",
    params: [s.signature, { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 }],
  }));

  const batchRes = await fetch(`${HELIUS_RPC_URL}/?api-key=${HELIUS_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(batchBody),
    next: { revalidate: 30 },
  });

  if (!batchRes.ok) {
    console.error(`fetchWalletTransactions batch RPC error: ${batchRes.status}`);
    return [];
  }

  const batchResults = (await batchRes.json()) as Array<{
    id: number;
    result: ParsedTx | null;
    error?: { message: string };
  }>;

  // Step 3: collect all mints for one batch metadata lookup
  const mintSet = new Set<string>();
  for (const { result: tx } of batchResults) {
    if (!tx || tx.meta?.err) continue;
    for (const b of tx.meta?.preTokenBalances ?? []) mintSet.add(b.mint);
    for (const b of tx.meta?.postTokenBalances ?? []) mintSet.add(b.mint);
  }

  const mints = Array.from(mintSet);
  const metaMap: Record<string, TokenMetadata> =
    mints.length > 0 ? await fetchTokenMetadata(mints).catch(() => ({})) : {};

  // Step 4: build HistoryRow entries from per-wallet token balance deltas
  const rows: HistoryRow[] = [];
  const seen = new Set<string>();

  for (const { result: tx } of batchResults) {
    if (!tx || tx.meta?.err) continue;

    const sig = tx.transaction.signatures[0];
    const blockTime = tx.blockTime;
    const accountKeys = tx.transaction.message.accountKeys.map((k) => k.pubkey);
    const walletIdx = accountKeys.indexOf(address);

    const pre = tx.meta?.preTokenBalances ?? [];
    const post = tx.meta?.postTokenBalances ?? [];

    const postByMint = new Map(
      post.filter((b) => b.owner === address).map((b) => [b.mint, b])
    );
    const preByMint = new Map(
      pre.filter((b) => b.owner === address).map((b) => [b.mint, b])
    );

    const touchedMints = Array.from(new Set([...Array.from(postByMint.keys()), ...Array.from(preByMint.keys())]));

    for (const mint of touchedMints) {
      const key = `${sig}:${mint}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const preAmt = preByMint.get(mint)?.uiTokenAmount.uiAmount ?? 0;
      const postAmt = postByMint.get(mint)?.uiTokenAmount.uiAmount ?? 0;
      const delta = postAmt - preAmt;
      if (Math.abs(delta) < 0.000001) continue;

      const preSOL = walletIdx >= 0 ? (tx.meta?.preBalances?.[walletIdx] ?? 0) : 0;
      const postSOL = walletIdx >= 0 ? (tx.meta?.postBalances?.[walletIdx] ?? 0) : 0;
      const solDelta = Math.abs(postSOL - preSOL) / 1e9;

      const meta = metaMap[mint];

      rows.push({
        id: `${sig}:${mint}`,
        time: new Date(blockTime * 1000).toLocaleString(),
        timestamp: blockTime,
        token: meta?.name ?? shortenAddr(mint),
        ticker: meta?.symbol ?? shortenAddr(mint, 4),
        mint,
        amount: fmtAmount(Math.abs(delta)),
        amountRaw: Math.abs(delta),
        price: fmtPrice(solDelta),
        priceRaw: solDelta,
        type: delta > 0 ? "buy" : "sell",
      });
    }
  }

  return rows.slice(0, limit);
}
