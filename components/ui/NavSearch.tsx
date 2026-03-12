"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X, ArrowUpRight, Loader2 } from "lucide-react";

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
  const [resolving, setResolving] = useState(false); // detecting token vs wallet
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(-1);

  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resolveRef = useRef<AbortController | null>(null);

  const isAddr = isSolanaAddress(query);

  const navigate = useCallback((path: string) => {
    setQuery("");
    setOpen(false);
    setResults([]);
    router.push(path);
  }, [router]);

  // Auto-detect token vs wallet for addresses
  const resolveAddress = useCallback(async (addr: string) => {
    // Cancel any in-flight resolve
    if (resolveRef.current) resolveRef.current.abort();
    const ctrl = new AbortController();
    resolveRef.current = ctrl;

    setResolving(true);
    try {
      const res = await fetch(`/api/resolve/${addr}`, { signal: ctrl.signal });
      const data = (await res.json()) as { type: "token" | "wallet" };
      if (!ctrl.signal.aborted) {
        navigate(`/${data.type === "token" ? "token" : "wallet"}/${addr}`);
      }
    } catch {
      // aborted or failed — fall back to token page
      if (!ctrl.signal.aborted) {
        navigate(`/token/${addr}`);
      }
    } finally {
      if (!ctrl.signal.aborted) setResolving(false);
    }
  }, [navigate]);

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
      // Cancel any in-flight resolve
      if (resolveRef.current) { resolveRef.current.abort(); resolveRef.current = null; }
      setResolving(false);
      return;
    }
    setOpen(true);
    setFocused(-1);

    if (isAddr) {
      // Cancel any pending text search
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setResults([]);
      setLoading(false);
    } else {
      // Cancel any in-flight address resolve
      if (resolveRef.current) { resolveRef.current.abort(); resolveRef.current = null; }
      setResolving(false);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => fetchResults(query), 280);
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, isAddr, fetchResults]);

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (isAddr) {
        resolveAddress(query.trim());
      } else if (focused >= 0 && results[focused]) {
        navigate(`/token/${results[focused].address}`);
      } else if (query.trim().length > 0) {
        navigate(`/?search=${encodeURIComponent(query.trim())}`);
      }
    } else if (e.key === "ArrowDown" && !isAddr) {
      e.preventDefault();
      setFocused((f) => Math.min(f + 1, results.length - 1));
    } else if (e.key === "ArrowUp" && !isAddr) {
      e.preventDefault();
      setFocused((f) => Math.max(f - 1, -1));
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  const shortAddr = isAddr
    ? `${query.trim().slice(0, 8)}…${query.trim().slice(-6)}`
    : "";

  const showDropdown =
    open && query.length > 0 && (isAddr || results.length > 0 || loading);

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
            onClick={() => {
              setQuery("");
              setOpen(false);
              if (resolveRef.current) { resolveRef.current.abort(); resolveRef.current = null; }
              setResolving(false);
              inputRef.current?.focus();
            }}
            tabIndex={-1}
          >
            <X size={13} />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="nav-search-dropdown">

          {/* Address: single detect row */}
          {isAddr && (
            <button
              className="search-row search-row-addr-detect"
              onClick={() => resolveAddress(query.trim())}
            >
              <div className="search-row-icon">
                {resolving
                  ? <Loader2 size={14} className="spin" />
                  : <ArrowUpRight size={14} />
                }
              </div>
              <div className="search-row-body">
                <span className="search-row-addr-text">{shortAddr}</span>
                <span className="search-row-sub">
                  {resolving ? "Detecting address type…" : "Press Enter or click to open"}
                </span>
              </div>
              {resolving
                ? <span className="search-row-badge detecting">DETECTING…</span>
                : <span className="search-row-badge addr">ADDRESS</span>
              }
            </button>
          )}

          {/* Token search results */}
          {!isAddr && loading && (
            <div className="search-row-loading">
              <Loader2 size={13} className="spin" /> Searching…
            </div>
          )}

          {!isAddr && !loading && results.map((r, i) => (
            <button
              key={r.address}
              className={`search-row${focused === i ? " focused" : ""}`}
              onClick={() => navigate(`/token/${r.address}`)}
              onMouseEnter={() => setFocused(i)}
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
          ))}
        </div>
      )}
    </div>
  );
}
