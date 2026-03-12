import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import type { WatchlistItem } from "@/types";

export const runtime = "nodejs";

// GET /api/watchlist — get user's watchlist (user_id from header)
export async function GET(req: NextRequest) {
  const userId = req.headers.get("x-privy-user-id");
  if (!userId) {
    return NextResponse.json([], { status: 200 });
  }

  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("watchlist")
      .select("token_address, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const items: WatchlistItem[] = (data ?? []).map((row) => ({
      tokenAddress: row.token_address as string,
      addedAt: row.created_at as string,
    }));

    return NextResponse.json(items);
  } catch (err) {
    console.error("/api/watchlist GET error:", err);
    return NextResponse.json([], { status: 200 });
  }
}

// POST /api/watchlist — add or remove token from watchlist
export async function POST(req: NextRequest) {
  const userId = req.headers.get("x-privy-user-id");
  if (!userId) {
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
        .upsert({ user_id: userId, token_address: tokenAddress });
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("watchlist")
        .delete()
        .eq("user_id", userId)
        .eq("token_address", tokenAddress);
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("/api/watchlist POST error:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
