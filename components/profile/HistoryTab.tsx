"use client";

import { ArrowUpRight, ArrowDownLeft } from "lucide-react";
import type { HistoryRow } from "@/types";

interface HistoryTabProps {
  data?: HistoryRow[];
}

function shortTime(timestamp: number): string {
  const d = new Date(timestamp * 1000);
  const now = new Date();
  const isSameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (isSameDay) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }
  return (
    d.toLocaleDateString([], { month: "short", day: "numeric" }) +
    " " +
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
}

export default function HistoryTab({ data = [] }: HistoryTabProps) {
  if (data.length === 0) {
    return (
      <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text3)" }}>
        No transaction history found
      </div>
    );
  }

  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th style={{ whiteSpace: "nowrap", minWidth: 160 }}>Time</th>
            <th style={{ minWidth: 80 }}>Type</th>
            <th style={{ minWidth: 120 }}>Token</th>
            <th style={{ textAlign: "right", minWidth: 110 }}>Amount</th>
            <th style={{ textAlign: "right", minWidth: 110 }}>Value</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.id}>
              <td style={{ color: "var(--text3)", fontSize: 11, fontFamily: "monospace", whiteSpace: "nowrap" }}>
                {shortTime(row.timestamp)}
              </td>
              <td>
                {row.type === "buy" ? (
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
              <td style={{ fontFamily: "monospace", fontSize: 12, color: "var(--text2)" }}>
                {row.ticker || row.token}
              </td>
              <td style={{ fontFamily: "monospace", fontSize: 13, textAlign: "right" }}>
                {row.amount}
              </td>
              <td style={{
                fontFamily: "monospace",
                fontSize: 13,
                textAlign: "right",
                color: row.type === "buy" ? "var(--green)" : "var(--red)",
              }}>
                {row.price}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
