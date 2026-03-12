"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useWallets as useSolanaWallets } from "@privy-io/react-auth/solana";

export function useWallet() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets: evmWallets } = useWallets();
  const { wallets: solanaWallets } = useSolanaWallets();

  // Prefer connected Solana wallets (external like Phantom, or Privy embedded)
  const primarySolanaWallet = solanaWallets[0];

  // Fallback: check user's linked accounts for Solana wallet address
  const linkedSolanaAccount = user?.linkedAccounts?.find(
    (acct) =>
      acct.type === "wallet" &&
      (acct as { chainType?: string }).chainType === "solana"
  ) as { address: string } | undefined;

  // Priority: connected Solana wallet > linked Solana account > EVM wallet
  const address =
    primarySolanaWallet?.address ??
    linkedSolanaAccount?.address ??
    evmWallets[0]?.address ??
    (user?.wallet as { address?: string } | undefined)?.address ??
    undefined;

  const shortAddress = address
    ? `${address.slice(0, 4)}…${address.slice(-4)}`
    : null;

  return {
    ready,
    authenticated,
    user,
    address,
    shortAddress,
    wallets: evmWallets,
    solanaWallets,
    login,
    logout,
  };
}
