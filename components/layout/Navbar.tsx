"use client";

import Link from "next/link";
import { useWallet } from "@/hooks/useWallet";
import { NavSearch } from "@/components/ui/NavSearch";
import { SettingsDropdown } from "@/components/ui/SettingsDropdown";
import { User } from "lucide-react";

export default function Navbar() {
  const { ready, authenticated, shortAddress, login } = useWallet();

  return (
    <nav className="navbar">
      {/* Logo */}
      <Link href="/" className="nav-logo">
        <div className="nav-logo-icon">Ω</div>
        <span className="nav-logo-text">Ohm</span>
      </Link>

      {/* Smart search */}
      <div className="nav-center">
        <NavSearch />
      </div>

      {/* Right controls */}
      <div className="nav-right">
        {/* Connect / wallet pill */}
        {!ready ? (
          <button className="connect-btn" disabled style={{ opacity: 0.4 }}>
            Connect
          </button>
        ) : authenticated ? (
          <Link href="/profile" className="connect-btn">
            <User size={13} />
            {shortAddress ?? "Me"}
          </Link>
        ) : (
          <button className="connect-btn" onClick={login}>
            Connect
          </button>
        )}

        <span className="nav-divider">/</span>

        {/* Settings gear — theme + account actions */}
        <SettingsDropdown />
      </div>
    </nav>
  );
}
