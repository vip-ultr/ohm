import { NextRequest, NextResponse } from "next/server";
import { fetchTokenTransactions } from "@/lib/helius";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: { address: string } }
) {
  const { address } = params;
  const threshold = Number(req.nextUrl.searchParams.get("threshold") ?? 10);

  try {
    const { whales } = await fetchTokenTransactions(address, 100, threshold);
    return NextResponse.json(whales, {
      headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=60" },
    });
  } catch (err) {
    console.error(`/api/token/${address}/whales error:`, err);
    return NextResponse.json({ error: "Failed to fetch whale transactions" }, { status: 500 });
  }
}
