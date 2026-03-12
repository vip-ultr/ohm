"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@/hooks/useWallet";
import WalletInfo from "@/components/profile/WalletInfo";
import BalanceCards from "@/components/profile/BalanceCards";
import HoldingsTab from "@/components/profile/HoldingsTab";
import HistoryTab from "@/components/profile/HistoryTab";
import type { ProfileTab, WalletPortfolio } from "@/types";
import { Wallet } from "lucide-react";

const TABS: { id: ProfileTab; label: string }[] = [
  { id: "holdings", label: "Holdings" },
  { id: "history", label: "History" },
];

export default function ProfilePage() {
  const { ready, authenticated, address, login, logout } = useWallet();
  const [tab, setTab] = useState<ProfileTab>("holdings");

  const { data: portfolio, isLoading } = useQuery<WalletPortfolio>({
    queryKey: ["wallet", address],
    queryFn: async () => {
      const res = await fetch(`/api/wallet/${address}`);
      if (!res.ok) throw new Error("Failed to fetch wallet");
      return res.json() as Promise<WalletPortfolio>;
    },
    enabled: authenticated && !!address,
    staleTime: 30_000,
  });

  // Show loading state while Privy initializes
  if (!ready) {
    return (
      <div className="page-enter">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="skeleton" style={{ height: 80, borderRadius: 12 }} />
          <div className="balances-grid">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 80, borderRadius: 10 }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Not connected: show connect prompt
  if (!authenticated) {
    return (
      <div className="page-enter">
        <div className="profile-connect">
          <div className="profile-connect-icon">
            <Wallet size={52} color="var(--text4)" />
          </div>
          <div className="profile-connect-msg">Connect to see your portfolio</div>
          <div className="profile-connect-sub">
            Link your wallet or sign in with email or social via Privy
          </div>
          <button className="btn-primary" onClick={login} style={{ marginTop: 8 }}>
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter">
      {/* Page header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text)" }}>
          My Portfolio
        </h1>
      </div>

      {/* Wallet info card */}
      <WalletInfo address={address!} onDisconnect={logout} />

      {/* Balance cards */}
      <BalanceCards portfolio={portfolio} loading={isLoading} />

      {/* Tabs: Holdings / History */}
      <div
        style={{
          background: "var(--bg2)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 20,
        }}
      >
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

        {tab === "holdings" ? (
          <HoldingsTab data={portfolio?.holdings} />
        ) : (
          <HistoryTab data={portfolio?.history} />
        )}
      </div>
    </div>
  );
}
