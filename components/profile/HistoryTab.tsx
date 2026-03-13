"use client";

import { ArrowUpRight, ArrowDownLeft } from "lucide-react";
import type { HistoryRow } from "@/types";

interface HistoryTabProps {
  data?: HistoryRow[];
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
      <table className="data-table" style={{ tableLayout: "fixed" }}>
        <colgroup>
          <col style={{ width: "170px" }} />
          <col style={{ width: "80px" }} />
          <col style={{ width: "160px" }} />
          <col style={{ width: "120px" }} />
          <col />
        </colgroup>
        <thead>
          <tr>
            <th>Time</th>
            <th>Type</th>
            <th>Token</th>
            <th>Amount</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.id}>
              <td style={{ color: "var(--text3)", fontSize: 11, fontFamily: "monospace", whiteSpace: "nowrap" }}>
                {row.time}
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
              <td style={{ fontFamily: "monospace", fontSize: 12, color: "var(--text2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {row.ticker || row.token}
              </td>
              <td style={{ fontFamily: "monospace", fontSize: 13 }}>{row.amount}</td>
              <td style={{ fontFamily: "monospace", fontSize: 13, color: "var(--green)" }}>{row.price}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
