import dynamic from "next/dynamic";
import type { Metadata } from "next";
import TokenHeader from "@/components/token/TokenHeader";
import TokenDetails from "@/components/token/TokenDetails";
import DataTabs from "@/components/token/DataTabs";

// PriceChart must be dynamically imported with ssr:false
// because lightweight-charts accesses window/document at import time
const PriceChart = dynamic(() => import("@/components/token/PriceChart"), {
  ssr: false,
  loading: () => (
    <div
      className="chart-section"
      style={{ height: 360, display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <div className="skeleton" style={{ width: "100%", height: 300, borderRadius: 8 }} />
    </div>
  ),
});

interface TokenPageProps {
  params: { address: string };
}

export async function generateMetadata({ params }: TokenPageProps): Promise<Metadata> {
  return {
    title: `Token ${params.address.slice(0, 8)}… — Ohm`,
    description: `Token analytics for ${params.address} on Solana.`,
  };
}

export default function TokenPage({ params }: TokenPageProps) {
  const { address } = params;

  return (
    <div className="page-enter">
      {/* Token header: logo, name, price, buy button, socials, CA */}
      <TokenHeader address={address} />

      {/* Token stat details: price, mcap, volume, liquidity, holders, supply, FDV */}
      <TokenDetails address={address} />

      {/* Price chart (client-only, lazy) */}
      <PriceChart address={address} />

      {/* Data tabs: Trades / Top Holders / Whale Transactions */}
      <DataTabs address={address} />
    </div>
  );
}
