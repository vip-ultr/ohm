"use client";

import { useState } from "react";
import type { TokenPageTab } from "@/types";
import TradesTab from "./TradesTab";
import TopHoldersTab from "./TopHoldersTab";
import WhaleTransactionsTab from "./WhaleTransactionsTab";
import { History, Users, Waves } from "lucide-react";

const TABS: { id: TokenPageTab; label: string; icon: React.ReactNode }[] = [
  { id: "trades",  label: "History",   icon: <History size={13} /> },
  { id: "holders", label: "Holders",   icon: <Users size={13} /> },
  { id: "whales",  label: "Whales",    icon: <Waves size={13} /> },
];

export default function DataTabs({ address }: { address: string }) {
  const [tab, setTab] = useState<TokenPageTab>("trades");

  return (
    <div className="orb-data-tabs">
      <div className="orb-data-tabs-bar">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`orb-data-tab ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>
      <div className="orb-data-tab-content">
        {tab === "trades"  && <TradesTab address={address} />}
        {tab === "holders" && <TopHoldersTab address={address} active={tab === "holders"} />}
        {tab === "whales"  && <WhaleTransactionsTab address={address} active={tab === "whales"} />}
      </div>
    </div>
  );
}
