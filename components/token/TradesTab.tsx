"use client";

import { useTokenTrades } from "@/hooks/useTokenData";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";

interface TradesTabProps {
  address: string;
}

export default function TradesTab({ address }: TradesTabProps) {
  const { data: trades = [], isLoading } = useTokenTrades(address);

  if (isLoading) return <TableSkeleton rows={8} cols={5} />;

  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Type</th>
            <th>Amount</th>
            <th>Value</th>
            <th>Wallet</th>
          </tr>
        </thead>
        <tbody>
          {trades.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ textAlign: "center", padding: 32, color: "var(--text3)" }}>
                No recent trades
              </td>
            </tr>
          ) : (
            trades.map((trade) => (
              <tr key={trade.id}>
                <td style={{ color: "var(--text3)", fontFamily: "monospace", fontSize: 12 }}>
                  {trade.time}
                </td>
                <td>
                  {trade.type === "buy" ? (
                    <span className="buy-tag">
                      <ArrowUpRight size={11} />
                      BUY
                    </span>
                  ) : (
                    <span className="sell-tag">
                      <ArrowDownLeft size={11} />
                      SELL
                    </span>
                  )}
                </td>
                <td style={{ fontFamily: "monospace" }}>{trade.amount}</td>
                <td style={{ fontFamily: "monospace" }}>{trade.value}</td>
                <td style={{ fontFamily: "monospace", color: "var(--text3)", fontSize: 12 }}>
                  {trade.wallet}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
