/**
 * lib/bags.ts — Token data layer
 *
 * Architecture (3-source):
 *  1. Bags.fm API  (public-api-v2.bags.fm/api/v1)  → token mint list from their launchpad
 *  2. DexScreener  (free, no auth)                  → price / volume / liquidity / 24h change
 *  3. Helius DAS   (getAssetBatch)                  → name / symbol / logo / supply / decimals
 *
 * Env vars required (server-only):
 *   BAGSFM_API_KEY       — from https://dev.bags.fm
 *   BAGSFM_BASE_URL      — https://public-api-v2.bags.fm/api/v1  (default)
 *   DEXSCREENER_BASE_URL — https://api.dexscreener.com           (default)
 *   HELIUS_API_KEY / HELIUS_RPC_URL  (used via lib/helius.ts)
 */

import type { Token, OverviewStats, Timeframe } from "@/types";
import { fmtAmount, fmtPrice, timeAgo } from "./helius";

// ─── Config ───────────────────────────────────────────────────────
const BAGS_BASE =
  process.env.BAGSFM_BASE_URL ?? "https://public-api-v2.bags.fm/api/v1";
const BAGS_API_KEY = process.env.BAGSFM_API_KEY ?? "";
const DEX_BASE =
  process.env.DEXSCREENER_BASE_URL ?? "https://api.dexscreener.com";

const bagsHeaders = {
  Accept: "application/json",
  "x-api-key": BAGS_API_KEY,
};

// ─── Bags.fm API types ────────────────────────────────────────────
interface BagsPool {
  tokenMint: string;
  dbcConfigKey: string;
  dbcPoolKey: string;
  dammV2PoolKey: string | null;
}

interface BagsPoolsResponse {
  success: boolean;
  response: BagsPool[];
}

// ─── DexScreener types ────────────────────────────────────────────
// GET /tokens/v1/{chainId}/{tokenAddresses} → flat DexPair[]
// Max 30 addresses per call, 60 req/min (free tier)
interface DexPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: { address: string; name: string; symbol: string };
  quoteToken: { address: string; name: string; symbol: string };
  priceNative: string;
  priceUsd?: string;
  txns?: {
    m5?: { buys: number; sells: number };
    h1?: { buys: number; sells: number };
    h6?: { buys: number; sells: number };
    h24?: { buys: number; sells: number };
  };
  volume?: { h24?: number; h6?: number; h1?: number; m5?: number };
  priceChange?: { m5?: number; h1?: number; h6?: number; h24?: number };
  liquidity?: { usd?: number; base?: number; quote?: number };
  fdv?: number;
  marketCap?: number;
  pairCreatedAt?: number;
  info?: {
    imageUrl?: string;
    websites?: { url: string; label?: string }[];
    socials?: { type: string; url: string }[];
  };
}

// ─── Helius DAS asset type ────────────────────────────────────────
interface DasAsset {
  id: string;
  content?: {
    metadata?: { name?: string; symbol?: string; description?: string };
    links?: { image?: string };
  };
  token_info?: {
    decimals?: number;
    supply?: number;
    price_info?: { price_per_token?: number };
  };
  creators?: { address: string; share: number; verified: boolean }[];
}

// ─── 1. Bags.fm pool list (launchpad token mints) ─────────────────
async function fetchBagsPools(onlyMigrated = false): Promise<BagsPool[]> {
  if (!BAGS_API_KEY) {
    console.warn("BAGSFM_API_KEY not set — skipping Bags pool fetch");
    return [];
  }
  try {
    const params = onlyMigrated ? "?onlyMigrated=true" : "";
    const res = await fetch(`${BAGS_BASE}/solana/bags/pools${params}`, {
      headers: bagsHeaders,
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      console.warn(`Bags pools fetch failed: ${res.status}`);
      return [];
    }
    const data = (await res.json()) as BagsPoolsResponse;
    return data.success ? data.response : [];
  } catch (err) {
    console.error("fetchBagsPools error:", err);
    return [];
  }
}

// ─── Fetch single pool by token mint ─────────────────────────────
export async function fetchBagsPoolByMint(
  tokenMint: string
): Promise<BagsPool | null> {
  if (!BAGS_API_KEY) return null;
  try {
    const res = await fetch(
      `${BAGS_BASE}/solana/bags/pools/token-mint?tokenMint=${tokenMint}`,
      { headers: bagsHeaders, next: { revalidate: 30 } }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { success: boolean; response: BagsPool };
    return data.success ? data.response : null;
  } catch {
    return null;
  }
}

// ─── 2. DexScreener market data (price / volume / liquidity) ──────
async function fetchDexScreenerBatch(
  mints: string[]
): Promise<Map<string, DexPair>> {
  const map = new Map<string, DexPair>();
  if (!mints.length) return map;

  // Max 30 addresses per call
  const chunks: string[][] = [];
  for (let i = 0; i < mints.length; i += 30) {
    chunks.push(mints.slice(i, i + 30));
  }

  await Promise.all(
    chunks.map(async (chunk) => {
      try {
        const res = await fetch(
          `${DEX_BASE}/tokens/v1/solana/${chunk.join(",")}`,
          { headers: { Accept: "application/json" }, next: { revalidate: 30 } }
        );
        if (!res.ok) return;

        // Response is a flat DexPair[] (not { pairs: [...] })
        const pairs = (await res.json()) as DexPair[];
        if (!Array.isArray(pairs)) return;

        for (const pair of pairs) {
          const addr = pair.baseToken?.address;
          if (!addr) continue;
          // Keep the pair with the highest liquidity (most relevant market)
          const existing = map.get(addr);
          const liq = pair.liquidity?.usd ?? 0;
          if (!existing || liq > (existing.liquidity?.usd ?? 0)) {
            map.set(addr, pair);
          }
        }
      } catch (err) {
        console.error("DexScreener batch error:", err);
      }
    })
  );

  return map;
}

// ─── 3. Helius DAS metadata (name / symbol / logo / supply) ───────
async function fetchHeliusAssets(
  mints: string[]
): Promise<Map<string, DasAsset>> {
  const map = new Map<string, DasAsset>();
  if (!mints.length) return map;

  const rpcUrl = process.env.HELIUS_RPC_URL;
  const apiKey = process.env.HELIUS_API_KEY;
  if (!rpcUrl || !apiKey) return map;

  // Max 100 per getAssetBatch call
  const chunks: string[][] = [];
  for (let i = 0; i < mints.length; i += 100) {
    chunks.push(mints.slice(i, i + 100));
  }

  await Promise.all(
    chunks.map(async (chunk) => {
      try {
        const res = await fetch(`${rpcUrl}/?api-key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: "getAssetBatch",
            method: "getAssetBatch",
            params: { ids: chunk },
          }),
          next: { revalidate: 300 },
        });
        if (!res.ok) return;
        const json = (await res.json()) as { result?: DasAsset[] };
        for (const asset of json.result ?? []) {
          if (asset?.id) map.set(asset.id, asset);
        }
      } catch (err) {
        console.error("Helius getAssetBatch error:", err);
      }
    })
  );

  return map;
}

// ─── Build unified Token object ───────────────────────────────────
function buildToken(
  mint: string,
  dex: DexPair | undefined,
  asset: DasAsset | undefined,
  pool: BagsPool
): Token {
  // Metadata: DexScreener (more complete) → Helius DAS fallback
  const name =
    dex?.baseToken.name ??
    asset?.content?.metadata?.name ??
    mint.slice(0, 6) + "…";
  const ticker =
    dex?.baseToken.symbol ?? asset?.content?.metadata?.symbol ?? "???";

  const price = dex?.priceUsd ? parseFloat(dex.priceUsd) : 0;
  const change1h = dex?.priceChange?.h1 ?? 0;
  const change24h = dex?.priceChange?.h24 ?? 0;
  const volume24h = dex?.volume?.h24 ?? 0;
  const liquidity = dex?.liquidity?.usd ?? 0;
  const marketCap = dex?.marketCap ?? dex?.fdv ?? 0;
  const fdv = dex?.fdv ?? marketCap;

  // Supply from Helius DAS
  const decimals = asset?.token_info?.decimals ?? 6;
  const rawSupply = asset?.token_info?.supply ?? 0;
  const supply = rawSupply / Math.pow(10, decimals);

  // Logo: DexScreener > Helius DAS
  const logoUrl =
    dex?.info?.imageUrl ?? asset?.content?.links?.image ?? null;

  // Socials from DexScreener
  const twitter = dex?.info?.socials?.find((s) => s.type === "twitter")?.url;
  const website = dex?.info?.websites?.[0]?.url;

  // Age from DexScreener pairCreatedAt (epoch ms)
  const ageTimestamp = dex?.pairCreatedAt
    ? Math.floor(dex.pairCreatedAt / 1000)
    : 0;
  const ageHours = ageTimestamp
    ? (Date.now() - ageTimestamp * 1000) / 3600000
    : 999;

  // Migrated to DAMM v2?
  const isMigrated = pool.dammV2PoolKey !== null;

  return {
    id: mint,
    address: mint,
    name,
    ticker,
    price,
    priceFormatted: fmtPrice(price),
    change1h,
    change24h,
    change7d: 0,
    change30d: 0,
    age: ageTimestamp ? timeAgo(ageTimestamp) : "–",
    ageTimestamp,
    marketCap,
    marketCapFormatted: marketCap ? `$${fmtAmount(marketCap)}` : "–",
    volume24h,
    volume24hFormatted: volume24h ? `$${fmtAmount(volume24h)}` : "–",
    liquidity,
    liquidityFormatted: liquidity ? `$${fmtAmount(liquidity)}` : "–",
    holders: 0,
    supply,
    supplyFormatted: supply ? fmtAmount(supply) : "–",
    fdv,
    fdvFormatted: fdv ? `$${fmtAmount(fdv)}` : "–",
    fees: 0,
    feesFormatted: "–",
    logoUrl,
    isNew: ageHours < 24,
    isHot: change24h > 50,
    socials: { twitter, website },
    launchpad: "bags.fm",
    description: asset?.content?.metadata?.description,
    creator: asset?.creators?.[0]?.address,
    isMigrated,
  };
}

// ─── Main export: fetch token list ───────────────────────────────
export async function fetchLaunchpadTokens({
  timeframe = "24H",
  page = 1,
  limit = 50,
  tab = "trending",
}: {
  timeframe?: Timeframe | string;
  page?: number;
  limit?: number;
  tab?: string;
} = {}): Promise<Token[]> {
  try {
    // 1. Get launchpad token list from Bags.fm
    const pools = await fetchBagsPools();

    if (!pools.length) {
      console.warn("No Bags pools returned — falling back to mock data");
      return getMockTokens();
    }

    // Paginate
    const start = (page - 1) * limit;
    const paginated = pools.slice(start, start + limit);
    const mints = paginated.map((p) => p.tokenMint);

    // 2. Parallel: DexScreener prices + Helius metadata
    const [dexMap, assetMap] = await Promise.all([
      fetchDexScreenerBatch(mints),
      fetchHeliusAssets(mints),
    ]);

    // 3. Build Token objects
    let tokens = paginated.map((pool) =>
      buildToken(
        pool.tokenMint,
        dexMap.get(pool.tokenMint),
        assetMap.get(pool.tokenMint),
        pool
      )
    );

    // 4. Sort by tab
    if (tab === "new") {
      tokens = tokens.sort((a, b) => b.ageTimestamp - a.ageTimestamp);
    } else {
      tokens = tokens.sort((a, b) => b.volume24h - a.volume24h);
    }

    void timeframe;
    return tokens;
  } catch (err) {
    console.error("fetchLaunchpadTokens error:", err);
    return getMockTokens();
  }
}

// ─── Fetch single token by address ───────────────────────────────
export async function fetchTokenByAddress(
  address: string
): Promise<Token | null> {
  try {
    const [pool, dexMap, assetMap] = await Promise.all([
      fetchBagsPoolByMint(address),
      fetchDexScreenerBatch([address]),
      fetchHeliusAssets([address]),
    ]);

    const fakePool: BagsPool = pool ?? {
      tokenMint: address,
      dbcConfigKey: "",
      dbcPoolKey: "",
      dammV2PoolKey: null,
    };

    return buildToken(
      address,
      dexMap.get(address),
      assetMap.get(address),
      fakePool
    );
  } catch (err) {
    console.error("fetchTokenByAddress error:", err);
    return null;
  }
}

// ─── Overview stats ───────────────────────────────────────────────
export async function fetchOverviewStats(): Promise<OverviewStats> {
  try {
    const tokens = await fetchLaunchpadTokens({ limit: 50 });
    const todayCutoff = Date.now() - 86400000;

    const launchedToday = tokens.filter(
      (t) => t.ageTimestamp * 1000 > todayCutoff
    ).length;

    const totalVolume = tokens.reduce((sum, t) => sum + t.volume24h, 0);
    const topToken = [...tokens].sort((a, b) => b.change24h - a.change24h)[0];
    const activeTraders = Math.floor(
      tokens.reduce((sum, t) => sum + t.holders, 0) * 0.1
    );

    return {
      totalLaunched: fmtAmount(tokens.length),
      launchedToday: String(launchedToday),
      volume24h: `$${fmtAmount(totalVolume)}`,
      volumeChange: "+12.4%",
      volumeChangePositive: true,
      activeTraders: fmtAmount(activeTraders),
      topToken: topToken?.ticker ?? "–",
      topTokenChange: topToken ? `+${topToken.change24h.toFixed(1)}%` : "–",
      topTokenPositive: (topToken?.change24h ?? 0) > 0,
    };
  } catch {
    return {
      totalLaunched: "–",
      launchedToday: "–",
      volume24h: "–",
      volumeChange: "–",
      volumeChangePositive: true,
      activeTraders: "–",
      topToken: "–",
      topTokenChange: "–",
      topTokenPositive: true,
    };
  }
}

// ─── Mock data (fallback when BAGSFM_API_KEY not configured) ──────
function getMockTokens(): Token[] {
  const now = Date.now();
  const mocks = [
    {
      address: "So11111111111111111111111111111111111111112",
      name: "Wrapped SOL", ticker: "SOL",
      price: 148.32, change1h: 0.8, change24h: 3.2,
      marketCap: 68_000_000_000, volume24h: 2_100_000_000, liquidity: 450_000_000,
      supply: 460_000_000, ageTimestamp: 1584316800,
    },
    {
      address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      name: "USD Coin", ticker: "USDC",
      price: 1.0, change1h: 0.01, change24h: 0.02,
      marketCap: 32_000_000_000, volume24h: 8_500_000_000, liquidity: 1_200_000_000,
      supply: 32_000_000_000, ageTimestamp: 1619827200,
    },
    {
      address: "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr",
      name: "PopCat", ticker: "POPCAT",
      price: 0.000432, change1h: 12.4, change24h: 87.3,
      marketCap: 4_320_000, volume24h: 890_000, liquidity: 125_000,
      supply: 10_000_000_000,
      ageTimestamp: Math.floor((now - 6 * 3600000) / 1000),
    },
    {
      address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
      name: "Bonk", ticker: "BONK",
      price: 0.0000234, change1h: -2.1, change24h: 5.6,
      marketCap: 1_560_000_000, volume24h: 125_000_000, liquidity: 45_000_000,
      supply: 66_666_666_666_666, ageTimestamp: 1671926400,
    },
    {
      address: "HVbpJAQGNpkgBaYBZQBR1t7yFdvaYVp2vCQQfKKEN4tM",
      name: "Ohm Token", ticker: "OHM",
      price: 0.00847, change1h: 4.2, change24h: 32.1,
      marketCap: 847_000, volume24h: 234_000, liquidity: 89_000,
      supply: 100_000_000,
      ageTimestamp: Math.floor((now - 2 * 3600000) / 1000),
    },
  ];

  return mocks.map((m) => {
    const pool: BagsPool = {
      tokenMint: m.address,
      dbcConfigKey: "",
      dbcPoolKey: "",
      dammV2PoolKey: null,
    };
    return buildToken(
      m.address,
      {
        chainId: "solana", dexId: "raydium", pairAddress: "", url: "",
        baseToken: { address: m.address, name: m.name, symbol: m.ticker },
        quoteToken: { address: "", name: "USDC", symbol: "USDC" },
        priceNative: "0", priceUsd: String(m.price),
        priceChange: { h1: m.change1h, h24: m.change24h },
        volume: { h24: m.volume24h },
        liquidity: { usd: m.liquidity },
        marketCap: m.marketCap, fdv: m.marketCap,
        pairCreatedAt: m.ageTimestamp * 1000,
      } as DexPair,
      undefined,
      pool
    );
  });
}
