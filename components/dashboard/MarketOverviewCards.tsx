"use client";

import { useOverviewStats } from "@/hooks/useTokenData";

export default function MarketOverviewCards() {
  const { data: stats, isLoading } = useOverviewStats();

  if (isLoading || !stats) {
    return (
      <div className="stats-strip">
        {[140, 120, 100, 130].map((w, i) => (
          <div key={i} className="stats-strip-item">
            <div className="skeleton" style={{ height: 11, width: 70, marginBottom: 5 }} />
            <div className="skeleton" style={{ height: 16, width: w }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="stats-strip">
      <div className="stats-strip-item">
        <span className="stats-strip-label">Tokens Launched</span>
        <span className="stats-strip-value">{stats.totalLaunched}</span>
      </div>
      <div className="stats-strip-divider" />
      <div className="stats-strip-item">
        <span className="stats-strip-label">24H Volume</span>
        <span className={`stats-strip-value ${stats.volumeChangePositive ? "positive" : "negative"}`}>
          {stats.volume24h}
        </span>
      </div>
      <div className="stats-strip-divider" />
      <div className="stats-strip-item">
        <span className="stats-strip-label">Active Traders</span>
        <span className="stats-strip-value">{stats.activeTraders}</span>
      </div>
      <div className="stats-strip-divider" />
      <div className="stats-strip-item">
        <span className="stats-strip-label">Top Performer</span>
        <span className={`stats-strip-value ${stats.topTokenPositive ? "positive" : "negative"}`}>
          {stats.topToken} · {stats.topTokenChange}
        </span>
      </div>

      {/* Live pulse — right side */}
      <div className="stats-strip-live">
        <span className="live-dot" />
        <span className="stats-strip-label">Live</span>
      </div>
    </div>
  );
}
