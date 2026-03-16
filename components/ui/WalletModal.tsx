"use client";

import { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletReadyState, type WalletName } from "@solana/wallet-adapter-base";
import { X, ExternalLink, Wallet } from "lucide-react";

interface WalletModalProps {
  open: boolean;
  onClose: () => void;
}

export function WalletModal({ open, onClose }: WalletModalProps) {
  const { wallets, select, connect, connecting } = useWallet();

  // Split wallets into detected (installed) vs available (not installed)
  const detected = wallets.filter(
    (w) => w.readyState === WalletReadyState.Installed
  );
  const available = wallets.filter(
    (w) =>
      w.readyState === WalletReadyState.Loadable ||
      w.readyState === WalletReadyState.NotDetected
  );

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const handleSelect = useCallback(
    async (name: WalletName) => {
      select(name);
      onClose();
      // connect() is triggered by WalletProvider after select via autoConnect,
      // but we call it explicitly for instant feedback
      setTimeout(() => {
        connect().catch(() => {});
      }, 50);
    },
    [select, connect, onClose]
  );

  if (!open) return null;

  const modal = (
    <div
      className="wallet-modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="wallet-modal-panel">
        {/* Header */}
        <div className="wallet-modal-header">
          <span className="wallet-modal-title">Connect Wallet</span>
          <button className="wallet-modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="wallet-modal-body">
          {/* No wallets at all */}
          {detected.length === 0 && available.length === 0 && (
            <div className="wallet-modal-empty">
              <div className="wallet-modal-empty-icon">
                <Wallet size={32} />
              </div>
              <p className="wallet-modal-empty-title">No wallets found</p>
              <p className="wallet-modal-empty-sub">
                Install a Solana wallet extension to get started
              </p>
              <div className="wallet-modal-install-links">
                <a
                  href="https://phantom.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="wallet-modal-install-btn"
                >
                  Get Phantom <ExternalLink size={11} />
                </a>
                <a
                  href="https://solflare.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="wallet-modal-install-btn"
                >
                  Get Solflare <ExternalLink size={11} />
                </a>
              </div>
            </div>
          )}

          {/* Detected wallets */}
          {detected.length > 0 && (
            <div className="wallet-modal-section">
              <div className="wallet-modal-section-label">Detected</div>
              {detected.map((w) => (
                <button
                  key={w.adapter.name}
                  className="wallet-row detected"
                  onClick={() => handleSelect(w.adapter.name)}
                  disabled={connecting}
                >
                  {w.adapter.icon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={w.adapter.icon}
                      alt={w.adapter.name}
                      className="wallet-row-icon"
                    />
                  ) : (
                    <div className="wallet-row-icon-placeholder">
                      {w.adapter.name[0]}
                    </div>
                  )}
                  <span className="wallet-row-name">{w.adapter.name}</span>
                  <span className="wallet-row-badge detected">Detected</span>
                </button>
              ))}
            </div>
          )}

          {/* Available / not installed */}
          {available.length > 0 && (
            <div className="wallet-modal-section">
              <div className="wallet-modal-section-label">
                {detected.length > 0 ? "More Wallets" : "Available"}
              </div>
              {available.map((w) => (
                <a
                  key={w.adapter.name}
                  href={w.adapter.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="wallet-row available"
                >
                  {w.adapter.icon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={w.adapter.icon}
                      alt={w.adapter.name}
                      className="wallet-row-icon"
                    />
                  ) : (
                    <div className="wallet-row-icon-placeholder">
                      {w.adapter.name[0]}
                    </div>
                  )}
                  <span className="wallet-row-name">{w.adapter.name}</span>
                  <span className="wallet-row-badge install">
                    Install <ExternalLink size={10} />
                  </span>
                </a>
              ))}
            </div>
          )}

          {/* Footer note */}
          <div className="wallet-modal-footer">
            New to Solana wallets?&nbsp;
            <a
              href="https://phantom.app"
              target="_blank"
              rel="noopener noreferrer"
              className="wallet-modal-footer-link"
            >
              Get started with Phantom
            </a>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof window !== "undefined"
    ? createPortal(modal, document.body)
    : null;
}
