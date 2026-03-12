"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";

export function useWallet() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();

  const primaryWallet = wallets[0];
  const address =
    primaryWallet?.address ??
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
    wallets,
    login,
    logout,
  };
}
