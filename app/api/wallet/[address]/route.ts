import { NextRequest, NextResponse } from "next/server";
import {
  fetchSolscanAccountDetail,
  fetchSolscanTokens,
  fetchSolscanTransfers,
} from "@/lib/solscan";
import { fmtAmount, fmtPrice } from "@/lib/helius";
import type { WalletPortfolio } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Live SOL/USD price from CoinGecko (free, no key)
async function fetchSolPrice(): Promise<number> {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd",
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return 148;
    const json = await res.json() as { solana?: { usd?: number } };
    return json.solana?.usd ?? 148;
  } catch {
    return 148;
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { address: string } }
) {
  const { address } = params;

  if (!address || address.length < 32) {
    return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
  }

  try {
    // Fetch all three in parallel
    const [detail, tokens, history, solUsdPrice] = await Promise.all([
      fetchSolscanAccountDetail(address),
      fetchSolscanTokens(address),
      fetchSolscanTransfers(address, 40),
      fetchSolPrice(),
    ]);

    const solUsdValue   = detail.solBalance * solUsdPrice;
    const tokenUsdValue = tokens.reduce((s, t) => s + t.valueUsd, 0);
    const totalUsd      = solUsdValue + tokenUsdValue;

    const portfolio: WalletPortfolio = {
      address,
      solBalance:           detail.solBalance,
      solBalanceFormatted:  `${detail.solBalance.toFixed(4)} SOL`,
      totalUsdValue:        `$${fmtAmount(totalUsd)}`,
      totalUsdRaw:          totalUsd,
      tokenCount:           tokens.length,
      holdings: tokens.map((t) => ({
        token:      t.name,
        ticker:     t.symbol,
        mint:       t.mint,
        balance:    fmtAmount(t.balance),
        balanceRaw: t.balance,
        value:      t.valueUsd > 0 ? `$${fmtAmount(t.valueUsd)}` : "$–",
        valueRaw:   t.valueUsd,
        price:      fmtPrice(t.priceUsd),
        priceRaw:   t.priceUsd,
        logoUrl:    t.logoUrl,
      })),
      history,
    };

    return NextResponse.json(portfolio, {
      headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=60" },
    });
  } catch (err) {
    console.error(`/api/wallet/${address} error:`, err);
    return NextResponse.json(
      { error: "Failed to fetch wallet data" },
      { status: 500 }
    );
  }
}
