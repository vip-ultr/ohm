"use client";

import { useOverviewStats } from "@/hooks/useTokenData";
import { StatCard } from "@/components/ui/Card";

export default function MarketOverviewCards() {
  const { data: stats, isLoading } = useOverviewStats();

  if (isLoading || !stats) {
    return (
      <div className="stats-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="stat-card">
            <div className="skeleton" style={{ height: 12, width: "50%", marginBottom: 10 }} />
            <div className="skeleton" style={{ height: 24, width: "70%" }} />
            <div className="skeleton" style={{ height: 10, width: "40%", marginTop: 6 }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="stats-grid">
      <StatCard
        label="Tokens Launched"
        value={stats.totalLaunched}
        sub={`+${stats.launchedToday} today`}
      />
      <StatCard
        label="24H Volume"
        value={stats.volume24h}
        sub={stats.volumeChange}
        valueClass={stats.volumeChangePositive ? "positive" : "negative"}
      />
      <StatCard
        label="Active Traders"
        value={stats.activeTraders}
        sub="estimated"
      />
      <StatCard
        label="Top Performer"
        value={`$${stats.topToken}`}
        sub={stats.topTokenChange}
        valueClass={stats.topTokenPositive ? "positive" : "negative"}
      />
    </div>
  );
}
