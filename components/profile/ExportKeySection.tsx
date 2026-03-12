"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useExportWallet } from "@privy-io/react-auth/solana";
import { ShieldCheck, Key, ExternalLink } from "lucide-react";

export default function ExportKeySection() {
  const { user } = usePrivy();
  const { exportWallet } = useExportWallet();

  // Find a Privy-generated embedded Solana wallet in the user's linked accounts
  const embeddedSolanaWallet = user?.linkedAccounts?.find(
    (acct) =>
      acct.type === "wallet" &&
      (acct as { chainType?: string }).chainType === "solana" &&
      (acct as { walletClientType?: string }).walletClientType === "privy"
  ) as { address: string } | undefined;

  if (!embeddedSolanaWallet) return null;

  return (
    <div className="export-key-section">
      <div className="export-key-header">
        <div className="export-key-icon-wrap">
          <ShieldCheck size={18} color="var(--green)" />
        </div>
        <div>
          <div className="export-key-title">Security &amp; Backup</div>
          <div className="export-key-sub">
            Ohm generated an embedded Solana wallet for your account.
            Export its private key to back it up or import it into another
            wallet like Phantom or Backpack.
          </div>
        </div>
      </div>

      <button
        className="export-key-btn"
        onClick={() => exportWallet({ address: embeddedSolanaWallet.address })}
      >
        <Key size={13} />
        Export Private Key
        <ExternalLink size={11} style={{ marginLeft: "auto", opacity: 0.6 }} />
      </button>

      <p className="export-key-warning">
        ⚠ Your private key gives full access to your wallet. Never share it
        with anyone. Store it somewhere safe and offline.
      </p>
    </div>
  );
}
