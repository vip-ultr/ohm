import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

interface DexSearchPair {
  chainId: string;
  baseToken: { address: string; name: string; symbol: string };
  priceUsd?: string;
  volume?: { h24?: number };
  liquidity?: { usd?: number };
  info?: { imageUrl?: string };
}

interface DexSearchResponse {
  pairs: DexSearchPair[] | null;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const res = await fetch(
      `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(q)}`,
      {
        headers: { Accept: "application/json" },
        next: { revalidate: 15 },
      }
    );

    if (!res.ok) return NextResponse.json([]);

    const data = (await res.json()) as DexSearchResponse;
    const pairs = data.pairs ?? [];

    // Filter to Solana only, deduplicate by token address, keep top 6
    const seen = new Set<string>();
    const results = pairs
      .filter((p) => p.chainId === "solana")
      .reduce<
        Array<{
          address: string;
          name: string;
          ticker: string;
          logoUrl: string | null;
          priceUsd: string;
        }>
      >((acc, p) => {
        const addr = p.baseToken?.address;
        if (!addr || seen.has(addr)) return acc;
        seen.add(addr);
        acc.push({
          address: addr,
          name: p.baseToken.name ?? "",
          ticker: p.baseToken.symbol ?? "",
          logoUrl: p.info?.imageUrl ?? null,
          priceUsd: p.priceUsd ?? "0",
        });
        return acc;
      }, [])
      .slice(0, 6);

    return NextResponse.json(results, {
      headers: { "Cache-Control": "s-maxage=15, stale-while-revalidate=30" },
    });
  } catch (err) {
    console.error("/api/tokens/search error:", err);
    return NextResponse.json([]);
  }
}
