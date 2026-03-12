"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTokenList } from "@/hooks/useTokenData";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useWallet } from "@/hooks/useWallet";
import { TokenAvatar } from "@/components/ui/TokenAvatar";
import { TableSkeleton } from "@/components/ui/Skeleton";
import TimeframeFilter from "./TimeframeFilter";
import LaunchpadSelector from "./LaunchpadSelector";
import type { Token, Timeframe, DashboardTab } from "@/types";
import { Star, TrendingUp, Zap, RefreshCw } from "lucide-react";

const TABS: { id: DashboardTab; label: string; icon?: React.ReactNode }[] = [
  { id: "trending", label: "Trending", icon: <TrendingUp size={13} /> },
  { id: "new", label: "New", icon: <Zap size={13} /> },
  { id: "watchlist", label: "Watchlist", icon: <Star size={13} /> },
];

interface TokenTableProps {
  initialData?: Token[];
}

export default function TokenTable({ initialData }: TokenTableProps) {
  const router = useRouter();
  const [tab, setTab] = useState<DashboardTab>("trending");
  const [timeframe, setTimeframe] = useState<Timeframe>("24H");
  const [launchpad, setLaunchpad] = useState("bags.fm");

  const { user } = useWallet();
  const { isWatched, toggle } = useWatchlist(user?.id);

  const { data: tokens = initialData ?? [], isLoading, refetch } = useTokenList(timeframe, tab);

  const changeKey = timeframe === "1H"
    ? "change1h"
    : timeframe === "7D"
      ? "change7d"
      : timeframe === "30D"
        ? "change30d"
        : "change24h";

  const displayTokens =
    tab === "watchlist"
      ? tokens.filter((t) => isWatched(t.address))
      : tokens;

  return (
    <div>
      {/* Controls row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", gap: 4 }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`tab-item ${tab === t.id ? "active" : ""}`}
              onClick={() => setTab(t.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderBottom: "none",
                borderRadius: 8,
                background: tab === t.id ? "var(--green-subtle)" : "var(--bg3)",
                color: tab === t.id ? "var(--green)" : "var(--text3)",
                border: `1px solid ${tab === t.id ? "var(--green)" : "var(--border)"}`,
              }}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <LaunchpadSelector value={launchpad} onChange={setLaunchpad} />
          <TimeframeFilter value={timeframe} onChange={setTimeframe} />
          <button className="btn-icon" onClick={() => refetch()} title="Refresh">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={10} cols={5} />
      ) : (
        <div className="token-table-wrap">
          <table className="token-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Token</th>
                <th>Price</th>
                <th>Age</th>
                <th>{timeframe} Change</th>
                <th>Market Cap</th>
                <th>Volume 24H</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {displayTokens.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: 40, color: "var(--text3)" }}>
                    {tab === "watchlist" ? "No tokens in watchlist" : "No tokens found"}
                  </td>
                </tr>
              ) : (
                displayTokens.map((token, i) => {
                  const change = token[changeKey as keyof Token] as number;
                  const positive = change >= 0;

                  return (
                    <tr
                      key={token.address}
                      onClick={() => router.push(`/token/${token.address}`)}
                    >
                      <td style={{ color: "var(--text3)", width: 40 }}>{i + 1}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <TokenAvatar
                            name={token.name}
                            ticker={token.ticker}
                            address={token.address}
                            logoUrl={token.logoUrl}
                            size="sm"
                          />
                          <div>
                            <div style={{ fontWeight: 600 }}>{token.ticker}</div>
                            <div style={{ fontSize: 12, color: "var(--text3)" }}>
                              {token.name}
                            </div>
                          </div>
                          {token.isNew && <span className="new-badge">NEW</span>}
                          {token.isHot && <span className="hot-badge">🔥</span>}
                        </div>
                      </td>
                      <td style={{ fontFamily: "var(--font-mono, monospace)", fontWeight: 600 }}>
                        {token.priceFormatted}
                      </td>
                      <td style={{ color: "var(--text3)" }}>{token.age}</td>
                      <td className={positive ? "positive" : "negative"}>
                        {positive ? "+" : ""}
                        {change.toFixed(1)}%
                      </td>
                      <td>{token.marketCapFormatted}</td>
                      <td style={{ color: "var(--text2)" }}>{token.volume24hFormatted}</td>
                      <td>
                        <button
                          className="btn-icon"
                          style={{ padding: 4 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggle(token.address);
                          }}
                          title={isWatched(token.address) ? "Remove from watchlist" : "Add to watchlist"}
                        >
                          <Star
                            size={14}
                            fill={isWatched(token.address) ? "var(--green)" : "none"}
                            color={isWatched(token.address) ? "var(--green)" : "var(--text3)"}
                          />
                        </button>
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
