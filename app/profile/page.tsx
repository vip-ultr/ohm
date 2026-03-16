"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@/hooks/useWallet";
import WalletInfo from "@/components/profile/WalletInfo";
import BalanceCards from "@/components/profile/BalanceCards";
import HoldingsTab from "@/components/profile/HoldingsTab";
import HistoryTab from "@/components/profile/HistoryTab";
import { WalletModal } from "@/components/ui/WalletModal";
import type { ProfileTab, WalletPortfolio } from "@/types";
import { History, Layers } from "lucide-react";

const TABS: { id: ProfileTab; label: string; icon: React.ReactNode }[] = [
  { id: "holdings", label: "Holdings", icon: <Layers size={13} /> },
  { id: "history",  label: "History",  icon: <History size={13} /> },
];

export default function ProfilePage() {
  const { ready, authenticated, address, disconnect } = useWallet();
  const [tab, setTab] = useState<ProfileTab>("holdings");
  const [modalOpen, setModalOpen] = useState(false);

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

  if (!ready) {
    return (
      <div className="page-enter">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="skeleton" style={{ height: 60 }} />
          <div className="balances-grid">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 90 }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <>
        <div className="profile-connect">
          <h1 className="profile-connect-msg">See &amp; Manage your Portfolio</h1>
          <p className="profile-connect-sub">
            Connect your Solana wallet to view balances, holdings and history
          </p>
          <button className="profile-connect-btn" onClick={() => setModalOpen(true)}>
            Connect Wallet
          </button>
        </div>
        <WalletModal open={modalOpen} onClose={() => setModalOpen(false)} />
      </>
    );
  }

  return (
    <div className="page-enter">
      <WalletInfo address={address!} onDisconnect={disconnect} />
      <BalanceCards portfolio={portfolio} loading={isLoading} />

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
          {tab === "holdings" ? (
            <HoldingsTab data={portfolio?.holdings} />
          ) : (
            <HistoryTab data={portfolio?.history} />
          )}
        </div>
      </div>
    </div>
  );
}
