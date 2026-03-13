import { NextRequest, NextResponse } from "next/server";
import { fetchLaunchpadTokens } from "@/lib/bags";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const timeframe = searchParams.get("timeframe") ?? "24H";
  const tab = searchParams.get("tab") ?? "trending";
  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 50);

  try {
    const tokens = await fetchLaunchpadTokens({ timeframe, tab, page, limit });
    return NextResponse.json(tokens, {
      headers: {
        "Cache-Control": "s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (err) {
    console.error("/api/tokens error:", err);
    return NextResponse.json(
      { error: "Failed to fetch tokens" },
      { status: 500 }
    );
  }
}
