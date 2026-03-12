"use client";

import { useState } from "react";
import type { TokenPageTab } from "@/types";
import TradesTab from "./TradesTab";
import TopHoldersTab from "./TopHoldersTab";
import WhaleTransactionsTab from "./WhaleTransactionsTab";

interface DataTabsProps {
  address: string;
}

const TABS: { id: TokenPageTab; label: string }[] = [
  { id: "trades", label: "Trades" },
  { id: "holders", label: "Top Holders" },
  { id: "whales", label: "Whale Transactions" },
];

export default function DataTabs({ address }: DataTabsProps) {
  const [tab, setTab] = useState<TokenPageTab>("trades");

  return (
    <div
      style={{
        background: "var(--bg2)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: 20,
      }}
    >
      {/* Tab bar */}
      <div className="tabs-bar">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab-item ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "trades" && <TradesTab address={address} />}
      {tab === "holders" && <TopHoldersTab address={address} active={tab === "holders"} />}
      {tab === "whales" && <WhaleTransactionsTab address={address} active={tab === "whales"} />}
    </div>
  );
}
