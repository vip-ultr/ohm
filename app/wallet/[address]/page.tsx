"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import BalanceCards from "@/components/profile/BalanceCards";
import HoldingsTab from "@/components/profile/HoldingsTab";
import HistoryTab from "@/components/profile/HistoryTab";
import { CopyButton } from "@/components/ui/CopyButton";
import { Skeleton } from "@/components/ui/Skeleton";
import type { WalletPortfolio } from "@/types";
import { History, Layers, Wallet } from "lucide-react";

type WalletTab = "holdings" | "history";

const TABS: { id: WalletTab; label: string; icon: React.ReactNode }[] = [
  { id: "holdings", label: "Holdings", icon: <Layers size={13} /> },
  { id: "history",  label: "History",  icon: <History size={13} /> },
];

export default function WalletPage() {
  const params = useParams();
  const address = params.address as string;
  const [tab, setTab] = useState<WalletTab>("holdings");

  const { data: portfolio, isLoading, isError } = useQuery<WalletPortfolio>({
    queryKey: ["wallet", address],
    queryFn: async () => {
      const res = await fetch(`/api/wallet/${address}`);
      if (!res.ok) throw new Error("Failed to fetch wallet");
      return res.json() as Promise<WalletPortfolio>;
    },
    enabled: !!address && address.length >= 32,
    staleTime: 30_000,
  });

  if (!address || address.length < 32) {
    return (
      <div className="page-enter" style={{ textAlign: "center", paddingTop: 60 }}>
        <p style={{ color: "var(--text3)" }}>Invalid wallet address.</p>
      </div>
    );
  }

  const shortAddr = `${address.slice(0, 8)}…${address.slice(-6)}`;

  return (
    <div className="page-enter">
      {/* Wallet header */}
      <div className="wallet-info-card">
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 48, height: 48,
              background: "var(--green-subtle)",
              border: "1px solid var(--green)",
              borderRadius: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Wallet size={22} color="var(--green)" />
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 600 }}>
              Wallet
            </div>
            <div className="wallet-address-wrap">
              <span>{shortAddr}</span>
              <CopyButton text={address} size={14} />
            </div>
          </div>
        </div>

        {/* Stats row */}
        {!isLoading && portfolio && (
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 600, marginBottom: 2 }}>
                Tokens
              </div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{portfolio.tokenCount}</div>
            </div>
          </div>
        )}

        {isLoading && <Skeleton style={{ width: 80, height: 36 }} />}
      </div>

      {/* Balance boxes */}
      <BalanceCards portfolio={portfolio} loading={isLoading} />

      {isError && (
        <div style={{ padding: "32px 0", textAlign: "center", color: "var(--text3)" }}>
          Could not load wallet data. The address may be invalid or have no on-chain activity.
        </div>
      )}

      {/* Data tabs */}
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
        <div className="orb-data-tab-content" style={{ padding: 20 }}>
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
