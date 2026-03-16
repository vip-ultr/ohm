import { NextResponse } from "next/server";
import { fetchOverviewStats } from "@/lib/bags";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stats = await fetchOverviewStats();
    return NextResponse.json(stats, {
      headers: {
        "Cache-Control": "s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (err) {
    console.error("/api/tokens/overview error:", err);
    return NextResponse.json(
      { error: "Failed to fetch overview" },
      { status: 500 }
    );
  }
}
