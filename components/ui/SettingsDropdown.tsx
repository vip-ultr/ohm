"use client";

import { useEffect, useRef, useState } from "react";
import { Settings, Sun, Moon, Check, LogOut, Key, Copy } from "lucide-react";
import { useAppTheme } from "@/hooks/useTheme";
import { useWallet } from "@/hooks/useWallet";
import { usePrivy } from "@privy-io/react-auth";
import { useExportWallet } from "@privy-io/react-auth/solana";

export function SettingsDropdown() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { isDark, setTheme } = useAppTheme();
  const { authenticated, address, logout } = useWallet();
  const { user } = usePrivy();
  const { exportWallet } = useExportWallet();

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Find embedded Solana wallet for export
  const embeddedSolanaWallet = user?.linkedAccounts?.find(
    (acct) =>
      acct.type === "wallet" &&
      (acct as { chainType?: string }).chainType === "solana" &&
      (acct as { walletClientType?: string }).walletClientType === "privy"
  ) as { address: string } | undefined;

  const shortAddr = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : null;

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleExport = () => {
    if (!embeddedSolanaWallet) return;
    setOpen(false);
    exportWallet({ address: embeddedSolanaWallet.address });
  };

  const handleDisconnect = () => {
    setOpen(false);
    logout();
  };

  return (
    <div className="settings-wrap" ref={ref}>
      <button
        className={`settings-trigger${open ? " active" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-label="Settings"
        title="Settings"
      >
        <Settings size={15} strokeWidth={2} />
      </button>

      {open && (
        <div className="settings-panel">
          {/* ── THEME ── */}
          <div className="settings-section-label">Theme</div>

          <button
            className={`settings-item${!isDark ? " selected" : ""}`}
            onClick={() => { setTheme("light"); setOpen(false); }}
          >
            <Sun size={13} />
            <span>Light</span>
            {!isDark && <Check size={11} className="settings-check" />}
          </button>

          <button
            className={`settings-item${isDark ? " selected" : ""}`}
            onClick={() => { setTheme("dark"); setOpen(false); }}
          >
            <Moon size={13} />
            <span>Dark</span>
            {isDark && <Check size={11} className="settings-check" />}
          </button>

          {/* ── ACCOUNT (only when connected) ── */}
          {authenticated && address && (
            <>
              <div className="settings-divider" />
              <div className="settings-section-label">Account</div>

              {/* Address row */}
              <button className="settings-item settings-addr" onClick={handleCopy}>
                <span className="settings-addr-text">{shortAddr}</span>
                {copied
                  ? <Check size={11} style={{ color: "var(--green)", marginLeft: "auto" }} />
                  : <Copy size={11} style={{ color: "var(--text4)", marginLeft: "auto" }} />
                }
              </button>

              {/* Export key — only for embedded wallet users */}
              {embeddedSolanaWallet && (
                <button className="settings-item" onClick={handleExport}>
                  <Key size={13} />
                  <span>Export Private Key</span>
                </button>
              )}

              {/* Disconnect */}
              <button className="settings-item settings-item-danger" onClick={handleDisconnect}>
                <LogOut size={13} />
                <span>Disconnect</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
