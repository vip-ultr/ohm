"use client";

import { LogOut, Wallet } from "lucide-react";
import { CopyButton } from "@/components/ui/CopyButton";

interface WalletInfoProps {
  address: string;
  onDisconnect: () => void;
}

export default function WalletInfo({ address, onDisconnect }: WalletInfoProps) {
  const short = `${address.slice(0, 8)}…${address.slice(-6)}`;

  return (
    <div className="wallet-info-card">
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {/* Wallet icon */}
        <div
          style={{
            width: 48,
            height: 48,
            background: "var(--green-subtle)",
            border: "1px solid var(--green)",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Wallet size={22} color="var(--green)" />
        </div>

        {/* Address */}
        <div>
          <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 4 }}>
            Connected Wallet
          </div>
          <div className="wallet-address-wrap">
            <span>{short}</span>
            <CopyButton text={address} size={14} />
          </div>
        </div>
      </div>

      {/* Disconnect button */}
      <button
        className="btn-ghost"
        onClick={onDisconnect}
        style={{ display: "flex", alignItems: "center", gap: 6 }}
      >
        <LogOut size={14} />
        Disconnect
      </button>
    </div>
  );
}
