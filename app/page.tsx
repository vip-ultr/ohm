import { Suspense } from "react";
import MarketOverviewCards from "@/components/dashboard/MarketOverviewCards";
import TokenTable from "@/components/dashboard/TokenTable";
import { fetchLaunchpadTokens } from "@/lib/bags";
import type { Token } from "@/types";

// SSR the initial token list for fast first paint
async function getInitialTokens(): Promise<Token[]> {
  try {
    return await fetchLaunchpadTokens({ timeframe: "24H", tab: "trending", limit: 50 });
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const initialTokens = await getInitialTokens();

  return (
    <div className="page-enter">
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: "var(--text)",
            letterSpacing: "-0.3px",
            marginBottom: 4,
          }}
        >
          Solana Token Analytics
        </h1>
        <p style={{ fontSize: 14, color: "var(--text3)" }}>
          Real-time data for Bags.fm launches — price, whale activity & social signals
        </p>
      </div>

      {/* Market overview stat cards */}
      <Suspense
        fallback={
          <div className="stats-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="stat-card skeleton" style={{ height: 80 }} />
            ))}
          </div>
        }
      >
        <MarketOverviewCards />
      </Suspense>

      {/* Live indicator */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 16,
        }}
      >
        <span className="live-dot" />
        <span style={{ fontSize: 12, color: "var(--text3)", fontWeight: 500 }}>
          Live — auto-refreshes every 60s
        </span>
      </div>

      {/* Token table with tabs + filters */}
      <TokenTable initialData={initialTokens} />
    </div>
  );
}
