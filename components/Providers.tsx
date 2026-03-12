"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState } from "react";

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

const THEME_WRAPPER = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider
    attribute="class"
    defaultTheme="dark"
    enableSystem={false}
    disableTransitionOnChange={false}
  >
    {children}
  </ThemeProvider>
);

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

  const inner = (
    <QueryClientProvider client={queryClient}>
      <THEME_WRAPPER>{children}</THEME_WRAPPER>
    </QueryClientProvider>
  );

  // Privy validates the app ID synchronously during SSR and throws if it is
  // missing or malformed. Skip PrivyProvider entirely when the env var is not
  // set so the build always succeeds. Auth features require the var at runtime.
  if (!PRIVY_APP_ID) return inner;

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ["wallet", "email", "google", "twitter"],
        appearance: {
          theme: "dark",
          accentColor: "#03A338",
          logo: "/logo.svg",
          walletList: ["phantom", "okx_wallet", "coinbase_wallet"],
          walletChainType: "solana-only",
        },
        embeddedWallets: {
          solana: { createOnLogin: "users-without-wallets" },
        },
      }}
    >
      {inner}
    </PrivyProvider>
  );
}
