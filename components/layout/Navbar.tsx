"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import { SearchBar } from "@/components/ui/SearchBar";
import { SettingsDropdown } from "@/components/ui/SettingsDropdown";
import { User } from "lucide-react";

export default function Navbar() {
  const router = useRouter();
  const { ready, authenticated, shortAddress, login } = useWallet();
  const [query, setQuery] = useState("");

  const handleSearch = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    if (trimmed.length > 20) {
      router.push(`/token/${trimmed}`);
    } else {
      router.push(`/?search=${encodeURIComponent(trimmed)}`);
    }
    setQuery("");
  };

  return (
    <nav className="navbar">
      {/* Logo */}
      <Link href="/" className="nav-logo">
        <div className="nav-logo-icon">Ω</div>
        <span className="nav-logo-text">Ohm</span>
      </Link>

      {/* Search */}
      <div className="nav-center">
        <SearchBar
          value={query}
          onChange={setQuery}
          onEnter={handleSearch}
          placeholder="Search token or paste address…"
        />
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
