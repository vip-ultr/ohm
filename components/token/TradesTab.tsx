"use client";

import { useTokenTrades } from "@/hooks/useTokenData";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { CopyButton } from "@/components/ui/CopyButton";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";

export default function TradesTab({ address }: { address: string }) {
  const { data: trades = [], isLoading } = useTokenTrades(address);

  if (isLoading) return <TableSkeleton rows={8} cols={5} />;

  return (
    <div>
      <div className="orb-tab-subheader">
        <span className="orb-tab-subheader-label">Recent transactions</span>
        <div className="orb-live-badge">
          <span className="live-dot" />
          Live
        </div>
      </div>
      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Amount</th>
              <th>Value</th>
              <th>Time</th>
              <th>Signature</th>
            </tr>
          </thead>
          <tbody>
            {trades.length === 0 ? (
              <tr><td colSpan={5} className="table-empty">No recent trades</td></tr>
            ) : (
              trades.map((trade) => {
                const isBuy = trade.type === "buy";
                return (
                  <tr key={trade.id} className={isBuy ? "row-buy" : "row-sell"}>
                    <td>
                      <span className={`trade-type-badge ${isBuy ? "buy" : "sell"}`}>
                        {isBuy ? <ArrowUpRight size={12} /> : <ArrowDownLeft size={12} />}
                        Swap
                      </span>
                    </td>
                    <td className="td-mono">{trade.amount}</td>
                    <td className="td-mono">{trade.value}</td>
                    <td className="td-time">{trade.time}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span className="td-mono td-muted">{trade.wallet}</span>
                        <CopyButton text={trade.wallet} size={12} />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
