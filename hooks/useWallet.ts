"use client";

import { useWallet as useSolanaWallet } from "@solana/wallet-adapter-react";

export function useWallet() {
  const {
    publicKey,
    connected,
    connecting,
    disconnecting,
    disconnect,
    wallets,
    select,
    wallet,
  } = useSolanaWallet();

  const address = publicKey?.toBase58() ?? undefined;

  const shortAddress = address
    ? `${address.slice(0, 4)}…${address.slice(-4)}`
    : null;

  return {
    ready: !connecting && !disconnecting,
    authenticated: connected,
    address,
    shortAddress,
    wallet,
    wallets,
    select,
    disconnect,
    connecting,
  };
}
