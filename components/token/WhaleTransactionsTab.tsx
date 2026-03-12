"use client";

import { useTokenWhales } from "@/hooks/useTokenData";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";

interface WhaleTransactionsTabProps {
  address: string;
  active: boolean;
}

export default function WhaleTransactionsTab({ address, active }: WhaleTransactionsTabProps) {
  const { data: whales = [], isLoading } = useTokenWhales(address, active);

  if (isLoading) return <TableSkeleton rows={6} cols={5} />;

  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Type</th>
            <th>Wallet</th>
            <th>Quantity</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {whales.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ textAlign: "center", padding: 32, color: "var(--text3)" }}>
                No whale transactions detected (threshold: 10 SOL)
              </td>
            </tr>
          ) : (
            whales.map((tx) => (
              <tr key={tx.id}>
                <td style={{ color: "var(--text3)", fontFamily: "monospace", fontSize: 12 }}>
                  {tx.time}
                </td>
                <td>
                  {tx.type === "buy" ? (
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
                  <span className="whale-tag" style={{ marginLeft: 6 }}>
                    🐋 WHALE
                  </span>
                </td>
                <td style={{ fontFamily: "monospace", fontSize: 12, color: "var(--text2)" }}>
                  {tx.wallet}
                </td>
                <td style={{ fontFamily: "monospace" }}>{tx.qty}</td>
                <td
                  style={{ fontFamily: "monospace", fontWeight: 600 }}
                  className={tx.type === "buy" ? "positive" : "negative"}
                >
                  {tx.value}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
