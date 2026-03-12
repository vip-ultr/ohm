"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState } from "react";

// Solana connectors — detects installed browser wallets (Phantom, Solflare, etc.)
// and shows a "Detected" badge next to them in the connect modal
const solanaConnectors = toSolanaWalletConnectors({
  shouldAutoConnect: false, // don't auto-connect on page load, let user choose
});

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
        loginMethods: ["wallet", "email"],
        appearance: {
          theme: "dark",
          accentColor: "#03A338",
          logo: "/logo.svg",
          // Privy checks window.phantom, window.solflare, etc. at runtime
          // and shows a "Detected" badge next to any installed wallet
          walletList: [
            "phantom",
            "solflare",
            "backpack",
            "okx_wallet",
            "coinbase_wallet",
          ],
        },
        // Tell Privy we're on Solana mainnet so wallet detection is scoped correctly
        solanaClusters: [
          {
            name: "mainnet-beta",
            rpcUrl: "https://api.mainnet-beta.solana.com",
          },
        ],
        externalWallets: {
          // Register the Solana connectors so Privy probes for installed wallets
          solana: { connectors: solanaConnectors },
        },
        embeddedWallets: {
          // Create a Privy-managed Solana wallet for users who have no wallet
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
