import { NextRequest, NextResponse } from "next/server";
import { fetchTokenTransactions } from "@/lib/helius";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: { address: string } }
) {
  const { address } = params;
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 50);

  try {
    const { trades } = await fetchTokenTransactions(address, limit);
    return NextResponse.json(trades, {
      headers: { "Cache-Control": "s-maxage=15, stale-while-revalidate=30" },
    });
  } catch (err) {
    console.error(`/api/token/${address}/trades error:`, err);
    return NextResponse.json({ error: "Failed to fetch trades" }, { status: 500 });
  }
}
