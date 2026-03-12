"use client";

import { StatCard } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import type { WalletPortfolio } from "@/types";

interface BalanceCardsProps {
  portfolio?: WalletPortfolio;
  loading?: boolean;
}

export default function BalanceCards({ portfolio, loading }: BalanceCardsProps) {
  if (loading || !portfolio) {
    return (
      <div className="balances-grid">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="stat-card">
            <Skeleton style={{ height: 11, width: "50%", marginBottom: 8 }} />
            <Skeleton style={{ height: 24, width: "70%" }} />
            <Skeleton style={{ height: 10, width: "40%", marginTop: 6 }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="balances-grid">
      <StatCard
        label="Total Value"
        value={portfolio.totalUsdValue}
        sub="estimated USD"
      />
      <StatCard
        label="SOL Balance"
        value={portfolio.solBalanceFormatted}
        sub="native SOL"
      />
      <StatCard
        label="Token Holdings"
        value={String(portfolio.tokenCount)}
        sub="unique tokens"
      />
    </div>
  );
}
