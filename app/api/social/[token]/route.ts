import { NextRequest, NextResponse } from "next/server";
import { fetchTokenMentions } from "@/lib/twitter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const ticker = params.token;
  const address = req.nextUrl.searchParams.get("address") ?? undefined;

  try {
    const mentions = await fetchTokenMentions(ticker, address);
    return NextResponse.json(mentions, {
      headers: {
        // Respect our 15-min cache, tell CDN to cache for 10 min
        "Cache-Control": "s-maxage=600, stale-while-revalidate=900",
      },
    });
  } catch (err) {
    console.error(`/api/social/${ticker} error:`, err);
    return NextResponse.json({ count: 0, recent: [] }, { status: 200 });
  }
}
