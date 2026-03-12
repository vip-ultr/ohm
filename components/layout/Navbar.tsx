"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import { SearchBar } from "@/components/ui/SearchBar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { User } from "lucide-react";

export default function Navbar() {
  const router = useRouter();
  const { ready, authenticated, shortAddress, login } = useWallet();
  const [query, setQuery] = useState("");

  const handleSearch = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    // Solana addresses are 32-44 chars base58; if short, treat as ticker search
    if (trimmed.length > 20) {
      router.push(`/token/${trimmed}`);
    } else {
      router.push(`/?search=${encodeURIComponent(trimmed)}`);
    }
    setQuery("");
  };

  return (
    <nav className="navbar">
      {/* Left: Logo */}
      <Link href="/" className="nav-logo">
        <div className="nav-logo-icon">Ω</div>
        <span className="nav-logo-text">Ohm</span>
      </Link>

      {/* Center: Search */}
      <div className="nav-center">
        <SearchBar
          value={query}
          onChange={setQuery}
          onEnter={handleSearch}
          placeholder="Search token or paste contract address…"
        />
      </div>

      {/* Right: Theme toggle + Connect/Profile */}
      <div className="nav-right">
        <ThemeToggle />

        {!ready ? (
          <button className="connect-btn" disabled style={{ opacity: 0.4 }}>
            Connect
          </button>
        ) : authenticated ? (
          <Link href="/profile" className="connect-btn" style={{ textDecoration: "none" }}>
            <User
              size={14}
              style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }}
            />
            {shortAddress ?? "Profile"}
          </Link>
        ) : (
          <button className="connect-btn" onClick={login}>
            Connect
          </button>
        )}
      </div>
    </nav>
  );
}
