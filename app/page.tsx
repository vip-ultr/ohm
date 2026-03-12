export const dynamic = "force-dynamic";

import { Suspense } from "react";
import MarketOverviewCards from "@/components/dashboard/MarketOverviewCards";
import TokenTable from "@/components/dashboard/TokenTable";
import { fetchLaunchpadTokens } from "@/lib/bags";
import type { Token } from "@/types";

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
      <Suspense fallback={<div className="stats-strip-skeleton" />}>
        <MarketOverviewCards />
      </Suspense>
      <TokenTable initialData={initialTokens} />
    </div>
  );
}
