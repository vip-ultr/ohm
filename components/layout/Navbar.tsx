"use client";

import { useState } from "react";
import Link from "next/link";
import { useWallet } from "@/hooks/useWallet";
import { NavSearch } from "@/components/ui/NavSearch";
import { SettingsDropdown } from "@/components/ui/SettingsDropdown";
import { WalletModal } from "@/components/ui/WalletModal";
import { User } from "lucide-react";

export default function Navbar() {
  const { ready, authenticated, shortAddress, connecting } = useWallet();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <nav className="navbar">
        <Link href="/" className="nav-logo">
          <div className="nav-logo-icon">Ω</div>
          <span className="nav-logo-text">Ohm</span>
        </Link>

        <div className="nav-center">
          <NavSearch />
        </div>

        <div className="nav-right">
          {!ready || connecting ? (
            <button className="connect-btn" disabled style={{ opacity: 0.4 }}>
              {connecting ? "Connecting…" : "Connect"}
            </button>
          ) : authenticated ? (
            <Link href="/profile" className="connect-btn">
              <User size={13} />
              {shortAddress ?? "Me"}
            </Link>
          ) : (
            <button className="connect-btn" onClick={() => setModalOpen(true)}>
              Connect
            </button>
          )}

          <span className="nav-divider">/</span>
          <SettingsDropdown />
        </div>
      </nav>

      <WalletModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
