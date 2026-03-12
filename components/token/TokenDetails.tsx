"use client";

import { useTokenAnalytics } from "@/hooks/useTokenData";
import { StatCard } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

interface TokenDetailsProps {
  address: string;
}

export default function TokenDetails({ address }: TokenDetailsProps) {
  const { data: token, isLoading } = useTokenAnalytics(address);

  if (isLoading || !token) {
    return (
      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="stat-card">
            <Skeleton style={{ height: 11, width: "50%", marginBottom: 8 }} />
            <Skeleton style={{ height: 20, width: "70%" }} />
          </div>
        ))}
      </div>
    );
  }

  const stats = [
    { label: "Price", value: token.priceFormatted, sub: undefined },
    {
      label: "24H Change",
      value: `${token.change24h >= 0 ? "+" : ""}${token.change24h.toFixed(2)}%`,
      valueClass: token.change24h >= 0 ? "positive" : "negative",
    },
    { label: "Market Cap", value: token.marketCapFormatted },
    { label: "FDV", value: token.fdvFormatted },
    { label: "24H Volume", value: token.volume24hFormatted },
    { label: "Liquidity", value: token.liquidityFormatted },
    { label: "Holders", value: token.holders.toLocaleString() },
    { label: "Supply", value: token.supplyFormatted },
  ];

  return (
    <div
      className="stats-grid"
      style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 24 }}
    >
      {stats.map((s) => (
        <StatCard
          key={s.label}
          label={s.label}
          value={s.value}
          valueClass={"valueClass" in s ? s.valueClass : undefined}
        />
      ))}
    </div>
  );
}
