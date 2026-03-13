"use client";

import { TokenAvatar } from "@/components/ui/TokenAvatar";
import type { HoldingRow } from "@/types";

interface HoldingsTabProps {
  data?: HoldingRow[];
}

export default function HoldingsTab({ data = [] }: HoldingsTabProps) {
  if (data.length === 0) {
    return (
      <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text3)" }}>
        No token holdings found
      </div>
    );
  }

  // Sort by USD value descending
  const sorted = [...data].sort((a, b) => b.valueRaw - a.valueRaw);

  return (
    <div className="data-table-wrap">
      <table className="data-table" style={{ tableLayout: "fixed" }}>
        <colgroup>
          <col style={{ width: "220px" }} />
          <col style={{ width: "140px" }} />
          <col style={{ width: "130px" }} />
          <col />
        </colgroup>
        <thead>
          <tr>
            <th>Token</th>
            <th style={{ textAlign: "right" }}>Balance</th>
            <th style={{ textAlign: "right" }}>Price</th>
            <th style={{ textAlign: "right" }}>Value</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((holding) => (
            <tr key={holding.mint}>
              <td>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <TokenAvatar
                    name={holding.token}
                    ticker={holding.ticker}
                    address={holding.mint}
                    logoUrl={holding.logoUrl}
                    size="sm"
                  />
                  <div style={{ overflow: "hidden" }}>
                    <div style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {holding.ticker}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "monospace" }}>
                      {holding.mint.slice(0, 8)}…
                    </div>
                  </div>
                </div>
              </td>
              <td style={{ fontFamily: "monospace", textAlign: "right", color: "var(--text2)" }}>
                {holding.balance}
              </td>
              <td style={{ fontFamily: "monospace", textAlign: "right", color: "var(--text2)" }}>
                {holding.price}
              </td>
              <td style={{ fontFamily: "monospace", textAlign: "right", fontWeight: 600 }}>
                {holding.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
