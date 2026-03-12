"use client";

import { TrendingUp, Users, BarChart2 } from "lucide-react";
import { useTokenAnalytics } from "@/hooks/useTokenData";
import { Skeleton } from "@/components/ui/Skeleton";

export default function TokenDetails({ address }: { address: string }) {
  const { data: token, isLoading } = useTokenAnalytics(address);

  if (isLoading || !token) {
    return (
      <div className="token-stat-boxes">
        {[1, 2, 3].map((i) => (
          <div key={i} className="token-stat-box">
            <div className="token-stat-box-header">
              <Skeleton style={{ height: 11, width: 80 }} />
              <Skeleton style={{ height: 18, width: 50, borderRadius: 0 }} />
            </div>
            <Skeleton style={{ height: 36, width: "60%", marginTop: 8 }} />
          </div>
        ))}
      </div>
    );
  }

  const priceUp = token.change24h >= 0;

  return (
    <div className="token-stat-boxes">
      <div className="token-stat-box">
        <div className="token-stat-box-header">
          <TrendingUp size={13} color="var(--text3)" />
          <span className="token-stat-box-label">Price</span>
          <span className={`token-stat-box-badge ${priceUp ? "up" : "down"}`}>
            {priceUp ? "+" : ""}{token.change24h.toFixed(2)}% 24H
          </span>
        </div>
        <div className="token-stat-box-value">{token.priceFormatted}</div>
      </div>

      <div className="token-stat-box">
        <div className="token-stat-box-header">
          <Users size={13} color="var(--text3)" />
          <span className="token-stat-box-label">Holders</span>
        </div>
        <div className="token-stat-box-value">{token.holders.toLocaleString()}</div>
      </div>

      <div className="token-stat-box">
        <div className="token-stat-box-header">
          <BarChart2 size={13} color="var(--text3)" />
          <span className="token-stat-box-label">24H Volume</span>
        </div>
        <div className="token-stat-box-value">{token.volume24hFormatted}</div>
      </div>
    </div>
  );
}
