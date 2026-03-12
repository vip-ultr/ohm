import { NextRequest, NextResponse } from "next/server";
import { fetchTokenByAddress } from "@/lib/bags";
import { fetchTokenMetadata } from "@/lib/helius";
import type { Token } from "@/types";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: { address: string } }
) {
  const { address } = params;

  if (!address || address.length < 10) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  try {
    // Fetch from Bags.fm and Helius in parallel
    const [bagsResult, heliusResult] = await Promise.allSettled([
      fetchTokenByAddress(address),
      fetchTokenMetadata([address]),
    ]);

    const bags =
      bagsResult.status === "fulfilled" ? bagsResult.value : null;
    const helius =
      heliusResult.status === "fulfilled"
        ? heliusResult.value[address]
        : null;

    if (!bags && !helius) {
      return NextResponse.json({ error: "Token not found" }, { status: 404 });
    }

    // Merge: bags data takes priority, helius fills gaps
    const merged: Partial<Token> = {
      ...(bags ?? {}),
      address,
    };

    if (helius) {
      if (!merged.name || merged.name === "Unknown") merged.name = helius.name;
      if (!merged.ticker || merged.ticker === "???") merged.ticker = helius.symbol;
      if (!merged.logoUrl) merged.logoUrl = helius.imageUrl;
      if (!merged.supply) merged.supply = helius.supply;
    }

    return NextResponse.json(merged, {
      headers: {
        "Cache-Control": "s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (err) {
    console.error(`/api/token/${address} error:`, err);
    return NextResponse.json(
      { error: "Failed to fetch token data" },
      { status: 500 }
    );
  }
}
