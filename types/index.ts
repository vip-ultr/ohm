// ─── TOKEN ────────────────────────────────────────────────────────
export interface Token {
  id: string;
  address: string;
  name: string;
  ticker: string;
  price: number;
  priceFormatted: string;
  change1h: number;
  change24h: number;
  change7d: number;
  change30d: number;
  age: string;
  ageTimestamp: number;
  marketCap: number;
  marketCapFormatted: string;
  volume24h: number;
  volume24hFormatted: string;
  liquidity: number;
  liquidityFormatted: string;
  holders: number;
  supply: number;
  supplyFormatted: string;
  fdv: number;
  fdvFormatted: string;
  fees: number;
  feesFormatted: string;
  logoUrl: string | null;
  isNew: boolean;
  isHot: boolean;
  socials: {
    twitter?: string;
    telegram?: string;
    discord?: string;
    website?: string;
  };
  launchpad: "bags.fm" | string;
  description?: string;
  creator?: string;
  isMigrated?: boolean; // true when pool has graduated to DAMM v2
}

// ─── TRADE ────────────────────────────────────────────────────────
export interface Trade {
  id: string;
  time: string;
  timestamp: number;
  type: "buy" | "sell";
  amount: string;
  amountRaw: number;
  value: string;
  valueRaw: number;
  wallet: string;
  txHash?: string;
}

// ─── HOLDER ───────────────────────────────────────────────────────
export interface Holder {
  rank: number;
  wallet: string;
  balance: string;
  balanceRaw: number;
  pct: string;
  pctRaw: number;
  value: string;
  valueRaw: number;
}

// ─── WHALE TRANSACTION ────────────────────────────────────────────
export interface WhaleTx {
  id: string;
  type: "buy" | "sell";
  wallet: string;
  qty: string;
  qtyRaw: number;
  value: string;
  valueRaw: number;
  time: string;
  timestamp: number;
  txHash?: string;
}

// ─── OHLCV (chart data) ───────────────────────────────────────────
export interface OHLCVPoint {
  time: number; // unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  value?: number; // for area series, = close price
}

// ─── WALLET / PORTFOLIO ───────────────────────────────────────────
export interface WalletPortfolio {
  address: string;
  solBalance: number;
  solBalanceFormatted: string;
  totalUsdValue: string;
  totalUsdRaw: number;
  tokenCount: number;
  holdings: HoldingRow[];
  history: HistoryRow[];
}

export interface HoldingRow {
  token: string;
  ticker: string;
  mint: string;
  balance: string;
  balanceRaw: number;
  value: string;
  valueRaw: number;
  price: string;
  priceRaw: number;
  logoUrl?: string | null;
}

export interface HistoryRow {
  id: string;
  time: string;
  timestamp: number;
  token: string;
  ticker: string;
  mint: string;
  amount: string;
  amountRaw: number;
  price: string;
  priceRaw: number;
  type: "buy" | "sell" | "send" | "receive" | "mint" | "burn";
}

// ─── MARKET OVERVIEW ──────────────────────────────────────────────
export interface OverviewStats {
  totalLaunched: string;
  launchedToday: string;
  volume24h: string;
  volumeChange: string;
  volumeChangePositive: boolean;
  activeTraders: string;
  topToken: string;
  topTokenChange: string;
  topTokenPositive: boolean;
}

// ─── X / TWITTER MENTIONS ─────────────────────────────────────────
export interface XMentions {
  count: number;
  recent: XTweet[];
  cached?: boolean;
}

export interface XTweet {
  id: string;
  text: string;
  author: string;
  timestamp: string;
}

// ─── WATCHLIST ────────────────────────────────────────────────────
export interface WatchlistItem {
  tokenAddress: string;
  addedAt: string;
}

// ─── API RESPONSES ────────────────────────────────────────────────
export interface ApiError {
  error: string;
  status?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  hasMore: boolean;
}

// ─── TIMEFRAME ────────────────────────────────────────────────────
export type Timeframe = "1H" | "24H" | "7D" | "30D";
export type ChartTimeframe = "1H" | "24H" | "30D";

// ─── FILTER TABS ──────────────────────────────────────────────────
export type DashboardTab = "trending" | "new" | "watchlist";
export type TokenPageTab = "trades" | "holders" | "whales";
export type ProfileTab = "holdings" | "history";
