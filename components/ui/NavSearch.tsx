"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X, ArrowUpRight, Wallet, Coins } from "lucide-react";

interface SearchResult {
  address: string;
  name: string;
  ticker: string;
  logoUrl: string | null;
  priceUsd: string;
}

// Solana address: base58, 32–44 chars, no spaces
function isSolanaAddress(val: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(val.trim());
}

function fmtPrice(p: string): string {
  const n = parseFloat(p);
  if (!n) return "–";
  if (n < 0.000001) return `$${n.toExponential(2)}`;
  if (n < 0.01) return `$${n.toFixed(6)}`;
  if (n < 1) return `$${n.toFixed(4)}`;
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function NavSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(-1);

  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAddr = isSolanaAddress(query);

  // Fetch search results with debounce
  const fetchResults = useCallback(async (q: string) => {
    if (isSolanaAddress(q) || q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/tokens/search?q=${encodeURIComponent(q)}`);
      const data = (await res.json()) as SearchResult[];
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!query) {
      setResults([]);
      setOpen(false);
      return;
    }
    setOpen(true);
    setFocused(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchResults(query), 280);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchResults]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const navigate = (path: string) => {
    setQuery("");
    setOpen(false);
    router.push(path);
  };

  // Build dropdown items
  const addrItems = isAddr
    ? [
        {
          label: query.slice(0, 8) + "…" + query.slice(-6),
          sublabel: "View Token Page",
          badge: "TOKEN",
          icon: <Coins size={13} />,
          action: () => navigate(`/token/${query.trim()}`),
        },
        {
          label: query.slice(0, 8) + "…" + query.slice(-6),
          sublabel: "View Wallet",
          badge: "WALLET",
          icon: <Wallet size={13} />,
          action: () => navigate(`/wallet/${query.trim()}`),
        },
      ]
    : [];

  const totalItems = addrItems.length + results.length;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocused((f) => Math.min(f + 1, totalItems - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocused((f) => Math.max(f - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (focused === -1 && isAddr) {
        navigate(`/token/${query.trim()}`);
      } else if (focused >= 0 && focused < addrItems.length) {
        addrItems[focused].action();
      } else if (focused >= addrItems.length) {
        const r = results[focused - addrItems.length];
        if (r) navigate(`/token/${r.address}`);
      } else if (!isAddr && query.trim().length > 0) {
        navigate(`/?search=${encodeURIComponent(query.trim())}`);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  const showDropdown = open && query.length > 0 && (isAddr || results.length > 0 || loading);

  return (
    <div className="nav-search-wrap" ref={wrapRef}>
      <div className={`nav-search-bar${open ? " focused" : ""}`}>
        <Search className="nav-search-icon" size={15} />
        <input
          ref={inputRef}
          className="nav-search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search token name, ticker, or paste address…"
          autoComplete="off"
          spellCheck={false}
        />
        {query && (
          <button
            className="nav-search-clear"
            onClick={() => { setQuery(""); setOpen(false); inputRef.current?.focus(); }}
            tabIndex={-1}
          >
            <X size={13} />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="nav-search-dropdown">
          {/* Address items */}
          {addrItems.map((item, i) => (
            <button
              key={item.badge}
              className={`search-row${focused === i ? " focused" : ""}`}
              onClick={item.action}
              onMouseEnter={() => setFocused(i)}
            >
              <div className="search-row-icon">{item.icon}</div>
              <div className="search-row-body">
                <span className="search-row-addr">{item.label}</span>
                <span className="search-row-sub">{item.sublabel}</span>
              </div>
              <span className={`search-row-badge ${item.badge.toLowerCase()}`}>
                {item.badge}
              </span>
              <ArrowUpRight size={12} className="search-row-arrow" />
            </button>
          ))}

          {/* Token results */}
          {!isAddr && loading && (
            <div className="search-row-loading">Searching…</div>
          )}
          {!isAddr && !loading && results.map((r, i) => {
            const idx = i; // no addrItems when not addr
            return (
              <button
                key={r.address}
                className={`search-row${focused === idx ? " focused" : ""}`}
                onClick={() => navigate(`/token/${r.address}`)}
                onMouseEnter={() => setFocused(idx)}
              >
                <div className="search-row-icon">
                  {r.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.logoUrl} alt={r.ticker} className="search-row-logo" />
                  ) : (
                    <div className="search-row-logo-placeholder">
                      {r.ticker.slice(0, 2)}
                    </div>
                  )}
                </div>
                <div className="search-row-body">
                  <span className="search-row-name">
                    <strong>{r.ticker}</strong>
                    <span className="search-row-fullname">{r.name}</span>
                  </span>
                  <span className="search-row-sub">
                    {r.address.slice(0, 8)}…{r.address.slice(-6)}
                  </span>
                </div>
                <span className="search-row-price">{fmtPrice(r.priceUsd)}</span>
                <span className="search-row-badge token">TOKEN</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
