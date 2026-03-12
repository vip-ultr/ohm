/**
 * lib/bags.ts — Token data layer
 *
 * Architecture (Helius-first):
 *  1. Helius DAS `searchAssets`  → token discovery (recently launched fungible tokens)
 *  2. Helius DAS `getAssetBatch` → name / symbol / logo / supply / decimals / price (Jupiter)
 *  3. DexScreener (free, no auth) → volume / liquidity / price-change % / pair age
 *
 * Env vars required (server-only):
 *   HELIUS_API_KEY       — from https://dev.helius.xyz
 *   HELIUS_RPC_URL       — https://mainnet.helius-rpc.com  (default)
 *   DEXSCREENER_BASE_URL — https://api.dexscreener.com    (default)
 */

import type { Token, OverviewStats, Timeframe } from "@/types";
import { fmtAmount, fmtPrice, timeAgo } from "./helius";

// ─── Config ───────────────────────────────────────────────────────
const HELIUS_RPC =
  process.env.HELIUS_RPC_URL ?? "https://mainnet.helius-rpc.com";
const HELIUS_KEY = process.env.HELIUS_API_KEY ?? "";
const DEX_BASE =
  process.env.DEXSCREENER_BASE_URL ?? "https://api.dexscreener.com";

// ─── Helius DAS types ─────────────────────────────────────────────
interface DasAsset {
  id: string;
  content?: {
    metadata?: { name?: string; symbol?: string; description?: string };
    links?: { image?: string };
  };
  token_info?: {
    decimals?: number;
    supply?: number;
    price_info?: {
      price_per_token?: number;
      currency?: string;
    };
  };
  creators?: { address: string; share: number; verified: boolean }[];
  mint_extensions?: unknown;
}

interface SearchAssetsResult {
  items: DasAsset[];
  total: number;
  limit: number;
  page: number;
}

// ─── DexScreener types ────────────────────────────────────────────
// GET /tokens/v1/{chainId}/{tokenAddresses} → flat DexPair[]
// Rate limit: 60 req/min (free tier), max 30 addresses per call
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

// ─── Helius DAS RPC helper ────────────────────────────────────────
async function dasPost(
  method: string,
  params: Record<string, unknown>,
  revalidate = 60
): Promise<unknown> {
  if (!HELIUS_KEY) return null;
  const res = await fetch(`${HELIUS_RPC}/?api-key=${HELIUS_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: "ohm", method, params }),
    next: { revalidate },
  });
  if (!res.ok) throw new Error(`Helius DAS ${method} error: ${res.status}`);
  const json = (await res.json()) as {
    result?: unknown;
    error?: { message: string };
  };
  if (json.error) throw new Error(json.error.message);
  return json.result;
}

// ─── 1. Token discovery via searchAssets ─────────────────────────
// Returns recently created fungible tokens on Solana.
// `showFungibleExtensions: true` includes token_info.price_info (Jupiter).
async function searchFungibleTokens(
  page = 1,
  limit = 50
): Promise<DasAsset[]> {
  if (!HELIUS_KEY) {
    console.warn("HELIUS_API_KEY not set — falling back to mock data");
    return [];
  }
  try {
    const result = (await dasPost(
      "searchAssets",
      {
        tokenType: "fungible",
        sortBy: { sortBy: "created", sortDirection: "desc" },
        limit,
        page,
        options: {
          showFungibleExtensions: true,
        },
      },
      30
    )) as SearchAssetsResult | null;

    return result?.items ?? [];
  } catch (err) {
    console.error("searchAssets error:", err);
    return [];
  }
}

// ─── 2. Batch metadata + price from getAssetBatch ─────────────────
async function fetchHeliusAssets(
  mints: string[]
): Promise<Map<string, DasAsset>> {
  const map = new Map<string, DasAsset>();
  if (!mints.length || !HELIUS_KEY) return map;

  // Max 100 per call (Helius limit)
  const chunks: string[][] = [];
  for (let i = 0; i < mints.length; i += 100) {
    chunks.push(mints.slice(i, i + 100));
  }

  await Promise.all(
    chunks.map(async (chunk) => {
      try {
        const result = (await dasPost(
          "getAssetBatch",
          {
            ids: chunk,
            options: { showFungibleExtensions: true },
          },
          300
        )) as DasAsset[] | null;

        for (const asset of result ?? []) {
          if (asset?.id) map.set(asset.id, asset);
        }
      } catch (err) {
        console.error("getAssetBatch error:", err);
      }
    })
  );

  return map;
}

// ─── 3. DexScreener market data (volume / liquidity / change) ─────
async function fetchDexScreenerBatch(
  mints: string[]
): Promise<Map<string, DexPair>> {
  const map = new Map<string, DexPair>();
  if (!mints.length) return map;

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
          // Keep pair with highest liquidity (best market)
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

// ─── Build unified Token object ───────────────────────────────────
function buildToken(
  mint: string,
  asset: DasAsset | undefined,
  dex: DexPair | undefined
): Token {
  // Metadata: prefer DexScreener names (more complete), fall back to Helius DAS
  const name =
    dex?.baseToken.name ??
    asset?.content?.metadata?.name ??
    mint.slice(0, 6) + "…";
  const ticker =
    dex?.baseToken.symbol ??
    asset?.content?.metadata?.symbol ??
    "???";

  // Price: prefer DexScreener (live DEX price), fall back to Helius/Jupiter price_info
  const dexPrice = dex?.priceUsd ? parseFloat(dex.priceUsd) : 0;
  const heliusPrice = asset?.token_info?.price_info?.price_per_token ?? 0;
  const price = dexPrice || heliusPrice;

  // Price changes from DexScreener
  const change1h = dex?.priceChange?.h1 ?? 0;
  const change24h = dex?.priceChange?.h24 ?? 0;

  // Volume / liquidity from DexScreener
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
    launchpad: "helius",
    description: asset?.content?.metadata?.description,
    creator: asset?.creators?.[0]?.address,
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
    // 1. Discover recently launched fungible tokens via Helius searchAssets
    const assets = await searchFungibleTokens(page, limit);

    if (!assets.length) {
      console.warn("searchAssets returned no results — falling back to mock data");
      return getMockTokens();
    }

    const mints = assets.map((a) => a.id);

    // 2. Parallel: DexScreener market data (assets already have Helius data)
    const dexMap = await fetchDexScreenerBatch(mints);

    // 3. Build token objects (asset already fetched from searchAssets)
    const assetMap = new Map(assets.map((a) => [a.id, a]));
    let tokens = mints.map((mint) =>
      buildToken(mint, assetMap.get(mint), dexMap.get(mint))
    );

    // 4. Sort by tab
    if (tab === "new") {
      tokens = tokens.sort((a, b) => b.ageTimestamp - a.ageTimestamp);
    } else {
      // trending = highest 24h volume
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
    const [assetMap, dexMap] = await Promise.all([
      fetchHeliusAssets([address]),
      fetchDexScreenerBatch([address]),
    ]);

    return buildToken(address, assetMap.get(address), dexMap.get(address));
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

// ─── Mock data (fallback when HELIUS_API_KEY not set) ─────────────
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
      supply: 10_000_000_000, ageTimestamp: Math.floor((now - 6 * 3600000) / 1000),
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
      supply: 100_000_000, ageTimestamp: Math.floor((now - 2 * 3600000) / 1000),
    },
  ];

  return mocks.map((m) =>
    buildToken(
      m.address,
      {
        id: m.address,
        content: {
          metadata: { name: m.name, symbol: m.ticker },
        },
        token_info: { supply: m.supply, decimals: 0 },
      } as DasAsset,
      {
        chainId: "solana",
        dexId: "raydium",
        pairAddress: "",
        baseToken: { address: m.address, name: m.name, symbol: m.ticker },
        quoteToken: { address: "", name: "USDC", symbol: "USDC" },
        priceNative: "0",
        priceUsd: String(m.price),
        priceChange: { h1: m.change1h, h24: m.change24h },
        volume: { h24: m.volume24h },
        liquidity: { usd: m.liquidity },
        marketCap: m.marketCap,
        fdv: m.marketCap,
        pairCreatedAt: m.ageTimestamp * 1000,
      } as DexPair
    )
  );
}
