/**
 * GET /api/resolve/[address]
 *
 * Detects whether a Solana address is a TOKEN or a WALLET.
 * Strategy:
 *  1. Hit DexScreener /tokens/v1/solana/{address}
 *     → if any pair has this address as baseToken → it's a TOKEN
 *  2. Otherwise → it's a WALLET
 *
 * Returns: { type: "token" | "wallet" }
 */
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

interface DexPair {
  baseToken: { address: string };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { address: string } }
) {
  const { address } = params;

  if (!address || address.length < 32) {
    return NextResponse.json({ type: "wallet" });
  }

  try {
    const res = await fetch(
      `https://api.dexscreener.com/tokens/v1/solana/${address}`,
      {
        headers: { Accept: "application/json" },
        next: { revalidate: 30 },
      }
    );

    if (res.ok) {
      const pairs = (await res.json()) as DexPair[];
      if (
        Array.isArray(pairs) &&
        pairs.length > 0 &&
        pairs.some((p) => p.baseToken?.address === address)
      ) {
        return NextResponse.json(
          { type: "token" },
          { headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=60" } }
        );
      }
    }
  } catch {
    // fall through to wallet
  }

  return NextResponse.json(
    { type: "wallet" },
    { headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=60" } }
  );
}
