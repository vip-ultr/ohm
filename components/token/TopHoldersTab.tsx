"use client";

import { useTokenHolders } from "@/hooks/useTokenData";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { CopyButton } from "@/components/ui/CopyButton";

interface TopHoldersTabProps {
  address: string;
  active: boolean;
}

export default function TopHoldersTab({ address, active }: TopHoldersTabProps) {
  const { data: holders = [], isLoading } = useTokenHolders(address, active);

  if (isLoading) return <TableSkeleton rows={8} cols={4} />;

  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Wallet</th>
            <th>Balance</th>
            <th>% Hold</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {holders.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ textAlign: "center", padding: 32, color: "var(--text3)" }}>
                No holder data available
              </td>
            </tr>
          ) : (
            holders.map((holder) => (
              <tr key={holder.wallet}>
                <td style={{ color: "var(--text3)", width: 32 }}>
                  {holder.rank}
                </td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: 12,
                        color: "var(--text2)",
                      }}
                    >
                      {holder.wallet.slice(0, 8)}…{holder.wallet.slice(-6)}
                    </span>
                    <CopyButton text={holder.wallet} size={12} />
                  </div>
                </td>
                <td style={{ fontFamily: "monospace" }}>{holder.balance}</td>
                <td style={{ color: "var(--text2)" }}>{holder.pct}</td>
                <td style={{ fontFamily: "monospace" }}>{holder.value}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
