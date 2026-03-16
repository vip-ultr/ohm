import { NextRequest, NextResponse } from "next/server";
import { fetchTokenHolders } from "@/lib/helius";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { address: string } }
) {
  const { address } = params;
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 20);

  try {
    const holders = await fetchTokenHolders(address, limit);
    return NextResponse.json(holders, {
      headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=120" },
    });
  } catch (err) {
    console.error(`/api/token/${address}/holders error:`, err);
    return NextResponse.json({ error: "Failed to fetch holders" }, { status: 500 });
  }
}
