"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 2,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "placeholder"}
      config={{
        // wallet = external wallets, email/google/twitter = social + email login
        loginMethods: ["wallet", "email", "google", "twitter"],
        appearance: {
          theme: "dark",
          accentColor: "#03A338",
          logo: "/logo.svg",
          // Valid WalletListEntry values for Solana: phantom, okx_wallet, coinbase_wallet
          // Privy detects which are installed and shows a "Detected" badge at runtime
          walletList: ["phantom", "okx_wallet", "coinbase_wallet"],
          // Scope the wallet modal to Solana-only wallets (hides MetaMask etc.)
          walletChainType: "solana-only",
        },
        solanaClusters: [
          {
            name: "mainnet-beta",
            rpcUrl: "https://api.mainnet-beta.solana.com",
          },
        ],
        embeddedWallets: {
          // Create a Privy-managed Solana wallet for users who sign up without a wallet
          solana: { createOnLogin: "users-without-wallets" },
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange={false}
        >
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
