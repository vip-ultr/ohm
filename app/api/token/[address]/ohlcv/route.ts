import { NextRequest, NextResponse } from "next/server";
import { fetchTokenOHLCV } from "@/lib/helius";
import type { ChartTimeframe } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { address: string } }
) {
  const { address } = params;
  const tf = (req.nextUrl.searchParams.get("timeframe") ?? "24H") as ChartTimeframe;

  try {
    const data = await fetchTokenOHLCV(address, tf);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=60" },
    });
  } catch (err) {
    console.error(`/api/token/${address}/ohlcv error:`, err);
    return NextResponse.json({ error: "Failed to fetch price data" }, { status: 500 });
  }
}
