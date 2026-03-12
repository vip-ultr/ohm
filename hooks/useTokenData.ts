"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  Token,
  Trade,
  Holder,
  WhaleTx,
  OHLCVPoint,
  OverviewStats,
  XMentions,
  ChartTimeframe,
  Timeframe,
} from "@/types";

const fetcher = async <T>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json() as Promise<T>;
};

// ─── Token list (home page) ────────────────────────────────────────
export function useTokenList(timeframe: Timeframe = "24H", tab = "trending") {
  return useQuery<Token[]>({
    queryKey: ["tokens", timeframe, tab],
    queryFn: () =>
      fetcher<Token[]>(`/api/tokens?timeframe=${timeframe}&tab=${tab}`),
    staleTime: 30_000,
    refetchInterval: 60_000,
    placeholderData: (prev) => prev,
  });
}

// ─── Market overview stats ─────────────────────────────────────────
export function useOverviewStats() {
  return useQuery<OverviewStats>({
    queryKey: ["overview"],
    queryFn: () => fetcher<OverviewStats>("/api/tokens/overview"),
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}

// ─── Full token analytics ──────────────────────────────────────────
export function useTokenAnalytics(address: string) {
  return useQuery<Token>({
    queryKey: ["token", address],
    queryFn: () => fetcher<Token>(`/api/token/${address}`),
    enabled: !!address,
    staleTime: 30_000,
  });
}

// ─── Trades ───────────────────────────────────────────────────────
export function useTokenTrades(address: string) {
  return useQuery<Trade[]>({
    queryKey: ["trades", address],
    queryFn: () => fetcher<Trade[]>(`/api/token/${address}/trades`),
    enabled: !!address,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

// ─── Top holders (lazy: only fetch when tab is active) ────────────
export function useTokenHolders(address: string, enabled: boolean) {
  return useQuery<Holder[]>({
    queryKey: ["holders", address],
    queryFn: () => fetcher<Holder[]>(`/api/token/${address}/holders`),
    enabled: !!address && enabled,
    staleTime: 120_000,
  });
}

// ─── Whale transactions (lazy) ────────────────────────────────────
export function useTokenWhales(address: string, enabled: boolean) {
  return useQuery<WhaleTx[]>({
    queryKey: ["whales", address],
    queryFn: () => fetcher<WhaleTx[]>(`/api/token/${address}/whales`),
    enabled: !!address && enabled,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

// ─── OHLCV price history ───────────────────────────────────────────
export function useTokenOHLCV(address: string, timeframe: ChartTimeframe) {
  return useQuery<OHLCVPoint[]>({
    queryKey: ["ohlcv", address, timeframe],
    queryFn: () =>
      fetcher<OHLCVPoint[]>(
        `/api/token/${address}/ohlcv?timeframe=${timeframe}`
      ),
    enabled: !!address,
    staleTime: 30_000,
  });
}

// ─── X / Twitter mentions ─────────────────────────────────────────
export function useXMentions(ticker: string, address?: string) {
  return useQuery<XMentions>({
    queryKey: ["xmentions", ticker],
    queryFn: () =>
      fetcher<XMentions>(
        `/api/social/${ticker}${address ? `?address=${address}` : ""}`
      ),
    enabled: !!ticker,
    staleTime: 900_000, // 15 min matches server cache
  });
}
