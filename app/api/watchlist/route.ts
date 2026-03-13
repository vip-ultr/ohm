import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import type { WatchlistItem } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/watchlist — wallet address passed as header x-wallet-address
export async function GET(req: NextRequest) {
  const walletAddress = req.headers.get("x-wallet-address");
  if (!walletAddress) return NextResponse.json([]);

  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("watchlist")
      .select("token_address, created_at")
      .eq("user_id", walletAddress)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const items: WatchlistItem[] = (data ?? []).map((row) => ({
      tokenAddress: row.token_address as string,
      addedAt: row.created_at as string,
    }));

    return NextResponse.json(items);
  } catch (err) {
    console.error("/api/watchlist GET error:", err);
    return NextResponse.json([]);
  }
}

// POST /api/watchlist — add or remove token
export async function POST(req: NextRequest) {
  const walletAddress = req.headers.get("x-wallet-address");
  if (!walletAddress) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { tokenAddress: string; action: "add" | "remove" };
  try {
    body = (await req.json()) as { tokenAddress: string; action: "add" | "remove" };
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { tokenAddress, action } = body;
  if (!tokenAddress) {
    return NextResponse.json({ error: "tokenAddress required" }, { status: 400 });
  }

  try {
    const supabase = createServerSupabaseClient();

    if (action === "add") {
      const { error } = await supabase
        .from("watchlist")
        .upsert({ user_id: walletAddress, token_address: tokenAddress });
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("watchlist")
        .delete()
        .eq("user_id", walletAddress)
        .eq("token_address", tokenAddress);
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("/api/watchlist POST error:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
