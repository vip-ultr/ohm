"use client";

import { useTokenHolders } from "@/hooks/useTokenData";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { CopyButton } from "@/components/ui/CopyButton";

export default function TopHoldersTab({ address, active }: { address: string; active: boolean }) {
  const { data: holders = [], isLoading } = useTokenHolders(address, active);

  if (isLoading) return <TableSkeleton rows={8} cols={5} />;

  const top10Pct = holders.slice(0, 10).reduce((sum, h) => sum + (parseFloat(h.pct) || 0), 0);

  return (
    <div>
      <div className="orb-tab-subheader">
        <span className="orb-tab-subheader-label">
          {holders.length > 0 ? `${holders.length} holders` : "Holders"}
          {top10Pct > 0 && (
            <span className="orb-tab-subheader-meta">
              &nbsp;|&nbsp; Top 10 own {top10Pct.toFixed(2)}%
            </span>
          )}
        </span>
      </div>
      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 40 }}>#</th>
              <th>Account</th>
              <th>Token Account</th>
              <th style={{ textAlign: "right" }}>Quantity</th>
              <th style={{ textAlign: "right" }}>Percentage</th>
              <th style={{ textAlign: "right" }}>Value</th>
            </tr>
          </thead>
          <tbody>
            {holders.length === 0 ? (
              <tr><td colSpan={6} className="table-empty">No holder data available</td></tr>
            ) : (
              holders.map((holder) => (
                <tr key={holder.wallet}>
                  <td className="td-muted" style={{ fontSize: 13 }}>{holder.rank}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span className="td-mono td-link">
                        {holder.wallet.slice(0, 8)}…{holder.wallet.slice(-6)}
                      </span>
                      <CopyButton text={holder.wallet} size={12} />
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span className="td-mono td-muted">
                        {holder.wallet.slice(0, 6)}…{holder.wallet.slice(-4)}
                      </span>
                      <CopyButton text={holder.wallet} size={12} />
                    </div>
                  </td>
                  <td className="td-mono" style={{ textAlign: "right" }}>{holder.balance}</td>
                  <td style={{ textAlign: "right", fontWeight: 600, fontSize: 13 }}>{holder.pct}</td>
                  <td className="td-mono" style={{ textAlign: "right" }}>{holder.value}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
