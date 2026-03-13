"use client";

import {
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  Flame,
  Sparkles,
} from "lucide-react";
import type { HistoryRow } from "@/types";

interface HistoryTabProps {
  data?: HistoryRow[];
}

/** Format unix timestamp → "YYYY-MM-DD HH:MM" */
function formatTime(timestamp: number): string {
  const d = new Date(timestamp * 1000);
  const date = d.toLocaleDateString("en-CA"); // YYYY-MM-DD
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${date} ${time}`;
}

type TxType = HistoryRow["type"];

interface TagConfig {
  label: string;
  className: string;
  icon: React.ReactNode;
}

function getTxTag(type: TxType): TagConfig {
  switch (type) {
    case "buy":
      return { label: "BUY",     className: "tx-tag tx-tag--buy",     icon: <ArrowUpRight   size={11} /> };
    case "sell":
      return { label: "SELL",    className: "tx-tag tx-tag--sell",    icon: <ArrowDownLeft  size={11} /> };
    case "receive":
      return { label: "RECEIVE", className: "tx-tag tx-tag--receive", icon: <ArrowDownLeft  size={11} /> };
    case "send":
      return { label: "SEND",    className: "tx-tag tx-tag--send",    icon: <ArrowUpRight   size={11} /> };
    case "mint":
      return { label: "MINT",    className: "tx-tag tx-tag--mint",    icon: <Sparkles       size={11} /> };
    case "burn":
      return { label: "BURN",    className: "tx-tag tx-tag--burn",    icon: <Flame          size={11} /> };
    default:
      return { label: "TX",      className: "tx-tag tx-tag--neutral", icon: <ArrowRightLeft size={11} /> };
  }
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
            <th style={{ minWidth: 90 }}>Type</th>
            <th style={{ whiteSpace: "nowrap", minWidth: 160 }}>Time</th>
            <th style={{ minWidth: 120 }}>Token</th>
            <th style={{ textAlign: "right", minWidth: 120 }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => {
            const tag = getTxTag(row.type);
            return (
              <tr key={row.id}>
                {/* Type */}
                <td>
                  <span className={tag.className}>
                    {tag.icon}
                    {tag.label}
                  </span>
                </td>

                {/* Time */}
                <td style={{
                  color: "var(--text3)",
                  fontSize: 11,
                  fontFamily: "monospace",
                  whiteSpace: "nowrap",
                }}>
                  {formatTime(row.timestamp)}
                </td>

                {/* Token */}
                <td style={{ fontFamily: "monospace", fontSize: 12, color: "var(--text2)" }}>
                  {row.ticker || row.token}
                </td>

                {/* Amount */}
                <td style={{
                  fontFamily: "monospace",
                  fontSize: 13,
                  textAlign: "right",
                }}>
                  {row.amount}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
