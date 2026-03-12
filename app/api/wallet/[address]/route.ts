import { NextRequest, NextResponse } from "next/server";
import {
  fetchWalletBalances,
  fetchWalletTransactions,
  fmtAmount,
  fmtPrice,
} from "@/lib/helius";
import type { WalletPortfolio } from "@/types";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: { address: string } }
) {
  const { address } = params;

  if (!address || address.length < 32) {
    return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
  }

  try {
    const [balances, history] = await Promise.all([
      fetchWalletBalances(address),
      fetchWalletTransactions(address, 30),
    ]);

    const solUsdPrice = 148; // TODO: fetch live SOL price
    const solUsdValue = balances.solBalance * solUsdPrice;
    const tokenUsdValue = balances.tokens.reduce((sum, t) => sum + t.balance * 0, 0); // placeholder
    const totalUsd = solUsdValue + tokenUsdValue;

    const portfolio: WalletPortfolio = {
      address,
      solBalance: balances.solBalance,
      solBalanceFormatted: `${balances.solBalance.toFixed(4)} SOL`,
      totalUsdValue: `$${fmtAmount(totalUsd)}`,
      totalUsdRaw: totalUsd,
      tokenCount: balances.tokens.length,
      holdings: balances.tokens.map((t) => ({
        token: t.mint.slice(0, 8) + "…",
        ticker: "TOKEN",
        mint: t.mint,
        balance: fmtAmount(t.balance),
        balanceRaw: t.balance,
        value: "$–",
        valueRaw: 0,
        price: fmtPrice(0),
        priceRaw: 0,
        logoUrl: null,
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
