"use client";

import type { WalletPortfolio } from "@/types";

interface BalanceCardsProps {
  portfolio?: WalletPortfolio;
  loading?: boolean;
}

export default function BalanceCards({ portfolio, loading }: BalanceCardsProps) {
  if (loading || !portfolio) {
    return (
      <div className="balances-grid" style={{ marginBottom: 24 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="balance-box">
            <div className="skeleton" style={{ height: 11, width: "50%", marginBottom: 10 }} />
            <div className="skeleton" style={{ height: 28, width: "65%" }} />
            <div className="skeleton" style={{ height: 10, width: "40%", marginTop: 8 }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="balances-grid" style={{ marginBottom: 24 }}>
      <div className="balance-box">
        <div className="balance-box-label">Total Value</div>
        <div className="balance-box-value">{portfolio.totalUsdValue}</div>
        <div className="balance-box-sub">estimated USD</div>
      </div>
      <div className="balance-box">
        <div className="balance-box-label">SOL Balance</div>
        <div className="balance-box-value">{portfolio.solBalanceFormatted}</div>
        <div className="balance-box-sub">native SOL</div>
      </div>
      <div className="balance-box">
        <div className="balance-box-label">Token Holdings</div>
        <div className="balance-box-value">{portfolio.tokenCount}</div>
        <div className="balance-box-sub">unique tokens</div>
      </div>
    </div>
  );
}
