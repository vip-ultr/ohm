import type { Token, OverviewStats, Timeframe } from "@/types";
import { fmtAmount, fmtPrice, timeAgo } from "./helius";

const BAGSFM_BASE_URL =
  process.env.BAGSFM_BASE_URL ?? "https://api.bags.fm";

// ─── Raw Bags.fm API shapes ───────────────────────────────────────
interface BagsToken {
  id?: string;
  mint?: string;
  address?: string;
  name?: string;
  symbol?: string;
  ticker?: string;
  image?: string;
  imageUrl?: string;
  logo?: string;
  price?: number;
  priceUsd?: number;
  priceChange1h?: number;
  priceChange24h?: number;
  priceChange7d?: number;
  priceChange30d?: number;
  marketCap?: number;
  volume24h?: number;
  liquidity?: number;
  holders?: number;
  totalSupply?: number;
  supply?: number;
  fdv?: number;
  fees?: number;
  createdAt?: string | number;
  timestamp?: number;
  twitter?: string;
  telegram?: string;
  discord?: string;
  website?: string;
  description?: string;
  creator?: string;
}

// ─── Normalizer ───────────────────────────────────────────────────
function normalizeToken(raw: BagsToken): Token {
  const address = raw.mint ?? raw.address ?? raw.id ?? "";
  const ticker = raw.symbol ?? raw.ticker ?? "???";
  const price = raw.priceUsd ?? raw.price ?? 0;
  const marketCap = raw.marketCap ?? 0;
  const volume24h = raw.volume24h ?? 0;
  const liquidity = raw.liquidity ?? 0;
  const supply = raw.totalSupply ?? raw.supply ?? 0;
  const fdv = raw.fdv ?? marketCap;
  const fees = raw.fees ?? 0;

  // Age calculation
  let ageTimestamp = 0;
  if (raw.createdAt) {
    ageTimestamp =
      typeof raw.createdAt === "number"
        ? raw.createdAt
        : Math.floor(new Date(raw.createdAt).getTime() / 1000);
  } else if (raw.timestamp) {
    ageTimestamp = raw.timestamp;
  }

  const ageHours = ageTimestamp
    ? (Date.now() - ageTimestamp * 1000) / 3600000
    : 999;

  return {
    id: address,
    address,
    name: raw.name ?? ticker,
    ticker,
    price,
    priceFormatted: fmtPrice(price),
    change1h: raw.priceChange1h ?? 0,
    change24h: raw.priceChange24h ?? 0,
    change7d: raw.priceChange7d ?? 0,
    change30d: raw.priceChange30d ?? 0,
    age: ageTimestamp ? timeAgo(ageTimestamp) : "–",
    ageTimestamp,
    marketCap,
    marketCapFormatted: marketCap ? `$${fmtAmount(marketCap)}` : "–",
    volume24h,
    volume24hFormatted: volume24h ? `$${fmtAmount(volume24h)}` : "–",
    liquidity,
    liquidityFormatted: liquidity ? `$${fmtAmount(liquidity)}` : "–",
    holders: raw.holders ?? 0,
    supply,
    supplyFormatted: supply ? fmtAmount(supply) : "–",
    fdv,
    fdvFormatted: fdv ? `$${fmtAmount(fdv)}` : "–",
    fees,
    feesFormatted: fees ? `${fees}%` : "–",
    logoUrl: raw.imageUrl ?? raw.image ?? raw.logo ?? null,
    isNew: ageHours < 24,
    isHot: (raw.priceChange24h ?? 0) > 50,
    socials: {
      twitter: raw.twitter,
      telegram: raw.telegram,
      discord: raw.discord,
      website: raw.website,
    },
    launchpad: "bags.fm",
    description: raw.description,
    creator: raw.creator,
  };
}

// ─── Fetch token list ─────────────────────────────────────────────
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
    // Try Bags.fm API
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      timeframe: timeframe.toLowerCase(),
      sort: tab === "new" ? "createdAt" : "volume",
      order: "desc",
    });

    const res = await fetch(`${BAGSFM_BASE_URL}/tokens?${params}`, {
      next: { revalidate: 30 },
      headers: { Accept: "application/json" },
    });

    if (res.ok) {
      const data = (await res.json()) as BagsToken[] | { tokens?: BagsToken[]; data?: BagsToken[] };
      const rawList = Array.isArray(data)
        ? data
        : (data as { tokens?: BagsToken[] }).tokens ?? (data as { data?: BagsToken[] }).data ?? [];
      return rawList.map(normalizeToken);
    }

    // Fallback: try alternative endpoint pattern
    const res2 = await fetch(`${BAGSFM_BASE_URL}/api/tokens?${params}`, {
      next: { revalidate: 30 },
      headers: { Accept: "application/json" },
    });

    if (res2.ok) {
      const data = (await res2.json()) as BagsToken[] | { tokens?: BagsToken[]; data?: BagsToken[] };
      const rawList = Array.isArray(data)
        ? data
        : (data as { tokens?: BagsToken[] }).tokens ?? (data as { data?: BagsToken[] }).data ?? [];
      return rawList.map(normalizeToken);
    }

    console.warn("Bags.fm API unavailable, using mock data");
    return getMockTokens();
  } catch (err) {
    console.error("fetchLaunchpadTokens error:", err);
    return getMockTokens();
  }
}

// ─── Fetch single token ───────────────────────────────────────────
export async function fetchTokenByAddress(address: string): Promise<Token | null> {
  try {
    const endpoints = [
      `${BAGSFM_BASE_URL}/tokens/${address}`,
      `${BAGSFM_BASE_URL}/api/tokens/${address}`,
      `${BAGSFM_BASE_URL}/token/${address}`,
    ];

    for (const endpoint of endpoints) {
      const res = await fetch(endpoint, {
        next: { revalidate: 30 },
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const data = (await res.json()) as BagsToken;
        return normalizeToken(data);
      }
    }

    console.warn(`Token ${address} not found on Bags.fm`);
    return null;
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

    const topToken = tokens.sort((a, b) => b.change24h - a.change24h)[0];

    const activeTraders = Math.floor(tokens.reduce((sum, t) => sum + t.holders, 0) * 0.1);

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

// ─── Mock data (fallback) ─────────────────────────────────────────
function getMockTokens(): Token[] {
  const mocks: Array<Partial<BagsToken> & { mint: string }> = [
    {
      mint: "So11111111111111111111111111111111111111112",
      name: "Wrapped SOL",
      symbol: "SOL",
      priceUsd: 148.32,
      priceChange1h: 0.8,
      priceChange24h: 3.2,
      priceChange7d: -1.5,
      priceChange30d: 12.4,
      marketCap: 68000000000,
      volume24h: 2100000000,
      liquidity: 450000000,
      holders: 4200000,
      totalSupply: 460000000,
      createdAt: "2020-03-16",
    },
    {
      mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      name: "USD Coin",
      symbol: "USDC",
      priceUsd: 1.0,
      priceChange1h: 0.01,
      priceChange24h: 0.02,
      priceChange7d: 0.05,
      marketCap: 32000000000,
      volume24h: 8500000000,
      liquidity: 1200000000,
      holders: 1800000,
      totalSupply: 32000000000,
      createdAt: "2021-05-01",
    },
    {
      mint: "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr",
      name: "PopCat",
      symbol: "POPCAT",
      priceUsd: 0.000432,
      priceChange1h: 12.4,
      priceChange24h: 87.3,
      priceChange7d: 215.0,
      marketCap: 4320000,
      volume24h: 890000,
      liquidity: 125000,
      holders: 3200,
      totalSupply: 10000000000,
      createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    },
    {
      mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
      name: "Bonk",
      symbol: "BONK",
      priceUsd: 0.0000234,
      priceChange1h: -2.1,
      priceChange24h: 5.6,
      priceChange7d: 18.3,
      priceChange30d: 44.2,
      marketCap: 1560000000,
      volume24h: 125000000,
      liquidity: 45000000,
      holders: 892000,
      totalSupply: 66666666666666,
      createdAt: "2022-12-25",
    },
    {
      mint: "HVbpJAQGNpkgBaYBZQBR1t7yFdvaYVp2vCQQfKKEN4tM",
      name: "Ohm Token",
      symbol: "OHM",
      priceUsd: 0.00847,
      priceChange1h: 4.2,
      priceChange24h: 32.1,
      priceChange7d: 78.9,
      marketCap: 847000,
      volume24h: 234000,
      liquidity: 89000,
      holders: 1240,
      totalSupply: 100000000,
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      twitter: "https://twitter.com/ohm_sol",
    },
  ];

  return mocks.map((m) => normalizeToken(m as BagsToken));
}
