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

  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Token</th>
            <th>Balance</th>
            <th>Price</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {data.map((holding) => (
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
                  <div>
                    <div style={{ fontWeight: 600 }}>{holding.ticker}</div>
                    <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "monospace" }}>
                      {holding.mint.slice(0, 8)}…
                    </div>
                  </div>
                </div>
              </td>
              <td style={{ fontFamily: "monospace" }}>{holding.balance}</td>
              <td style={{ fontFamily: "monospace" }}>{holding.price}</td>
              <td style={{ fontFamily: "monospace", fontWeight: 600 }}>{holding.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
