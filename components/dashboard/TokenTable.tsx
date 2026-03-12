"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTokenList } from "@/hooks/useTokenData";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useWallet } from "@/hooks/useWallet";
import { TokenAvatar } from "@/components/ui/TokenAvatar";
import { TableSkeleton } from "@/components/ui/Skeleton";
import TimeframeFilter from "./TimeframeFilter";
import type { Token, Timeframe, DashboardTab } from "@/types";
import { Star, TrendingUp, Zap, RefreshCw, ExternalLink } from "lucide-react";

const TABS: { id: DashboardTab; label: string; icon?: React.ReactNode }[] = [
  { id: "trending", label: "Trending", icon: <TrendingUp size={13} /> },
  { id: "new",      label: "New",      icon: <Zap size={13} /> },
  { id: "watchlist",label: "Watchlist",icon: <Star size={13} /> },
];

interface TokenTableProps {
  initialData?: Token[];
}

export default function TokenTable({ initialData }: TokenTableProps) {
  const router = useRouter();
  const [tab, setTab] = useState<DashboardTab>("trending");
  const [timeframe, setTimeframe] = useState<Timeframe>("24H");

  const { user } = useWallet();
  const { isWatched, toggle } = useWatchlist(user?.id);
  const { data: tokens = initialData ?? [], isLoading, refetch } = useTokenList(timeframe, tab);

  const changeKey =
    timeframe === "1H"  ? "change1h"  :
    timeframe === "7D"  ? "change7d"  :
    timeframe === "30D" ? "change30d" : "change24h";

  const displayTokens =
    tab === "watchlist" ? tokens.filter((t) => isWatched(t.address)) : tokens;

  return (
    <div className="token-table-section">

      {/* ── Tab bar ─────────────────────────────────────── */}
      <div className="orb-tabs-bar">
        <div className="orb-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`orb-tab ${tab === t.id ? "active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        <button className="orb-refresh-btn" onClick={() => refetch()} title="Refresh">
          <RefreshCw size={13} />
        </button>
      </div>

      {/* ── Stats + Timeframe row ────────────────────────── */}
      <div className="orb-meta-row">
        <span className="orb-meta-label">
          {displayTokens.length > 0
            ? `${displayTokens.length} tokens`
            : "No tokens"}
        </span>
        <TimeframeFilter value={timeframe} onChange={setTimeframe} />
      </div>

      {/* ── Table ───────────────────────────────────────── */}
      {isLoading ? (
        <TableSkeleton rows={10} cols={7} />
      ) : (
        <div className="token-table-wrap">
          <table className="token-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}></th>
                <th style={{ width: 40 }}>#</th>
                <th>Token</th>
                <th>Price</th>
                <th>{timeframe} Change</th>
                <th>Market Cap</th>
                <th>Volume 24H</th>
                <th style={{ width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {displayTokens.length === 0 ? (
                <tr>
                  <td colSpan={8} className="table-empty">
                    {tab === "watchlist" ? "No tokens in watchlist yet" : "No tokens found"}
                  </td>
                </tr>
              ) : (
                displayTokens.map((token, i) => {
                  const change = token[changeKey as keyof Token] as number;
                  const positive = change >= 0;
                  const jupiterUrl = `https://jup.ag/swap/SOL-${token.address}`;

                  return (
                    <tr
                      key={token.address}
                      onClick={() => router.push(`/token/${token.address}`)}
                    >
                      {/* Star */}
                      <td className="td-star">
                        <button
                          className="star-btn"
                          onClick={(e) => { e.stopPropagation(); toggle(token.address); }}
                          title={isWatched(token.address) ? "Remove from watchlist" : "Watch"}
                        >
                          <Star
                            size={14}
                            fill={isWatched(token.address) ? "var(--green)" : "none"}
                            color={isWatched(token.address) ? "var(--green)" : "var(--text4)"}
                          />
                        </button>
                      </td>

                      {/* Rank */}
                      <td className="td-rank">{i + 1}</td>

                      {/* Token */}
                      <td className="td-token">
                        <div className="token-cell">
                          <TokenAvatar
                            name={token.name}
                            ticker={token.ticker}
                            address={token.address}
                            logoUrl={token.logoUrl}
                            size="sm"
                          />
                          <div className="token-cell-info">
                            <div className="token-cell-ticker">
                              {token.ticker}
                              {token.isNew && <span className="new-badge">NEW</span>}
                              {token.isHot && <span className="hot-badge">🔥</span>}
                            </div>
                            <div className="token-cell-name">{token.name}</div>
                          </div>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="td-price">{token.priceFormatted}</td>

                      {/* Change */}
                      <td className={`td-change ${positive ? "positive" : "negative"}`}>
                        {positive ? "+" : ""}{change.toFixed(2)}%
                      </td>

                      {/* Market Cap */}
                      <td className="td-mcap">{token.marketCapFormatted}</td>

                      {/* Volume */}
                      <td className="td-vol">{token.volume24hFormatted}</td>

                      {/* Buy */}
                      <td className="td-buy">
                        <a
                          href={jupiterUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="buy-btn"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Buy <ExternalLink size={10} />
                        </a>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
