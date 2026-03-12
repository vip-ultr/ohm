import type { XMentions } from "@/types";

const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;
const X_API_BASE = "https://api.twitter.com/2";

// In-memory cache to avoid hammering the X API (15-min TTL)
const mentionCache = new Map<string, { data: XMentions; expires: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

export async function fetchTokenMentions(
  ticker: string,
  contractAddress?: string
): Promise<XMentions> {
  const cacheKey = `${ticker}:${contractAddress ?? ""}`;
  const cached = mentionCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return { ...cached.data, cached: true };
  }

  if (!TWITTER_BEARER_TOKEN) {
    console.warn("TWITTER_BEARER_TOKEN not set — returning empty mentions");
    return { count: 0, recent: [], cached: false };
  }

  try {
    // Build query: ($TICKER OR contract_address) -is:retweet lang:en
    const queryParts = [`$${ticker}`];
    if (contractAddress) queryParts.push(contractAddress);
    const query = `(${queryParts.join(" OR ")}) -is:retweet lang:en`;

    const params = new URLSearchParams({
      query,
      max_results: "10",
      "tweet.fields": "created_at,author_id,public_metrics",
      "user.fields": "username",
      expansions: "author_id",
    });

    const res = await fetch(`${X_API_BASE}/tweets/search/recent?${params}`, {
      headers: {
        Authorization: `Bearer ${TWITTER_BEARER_TOKEN}`,
      },
      // Don't use Next.js cache here — we manage our own cache
      cache: "no-store",
    });

    if (res.status === 429) {
      console.warn("X API rate limited");
      return cached?.data ?? { count: 0, recent: [], cached: false };
    }

    if (!res.ok) {
      console.error(`X API error: ${res.status} ${res.statusText}`);
      return { count: 0, recent: [], cached: false };
    }

    const json = (await res.json()) as {
      data?: Array<{ id: string; text: string; author_id: string; created_at: string }>;
      meta?: { result_count: number; newest_id?: string };
      includes?: { users?: Array<{ id: string; username: string }> };
    };

    const users = Object.fromEntries(
      (json.includes?.users ?? []).map((u) => [u.id, u.username])
    );

    const recent = (json.data ?? []).map((tweet) => ({
      id: tweet.id,
      text: tweet.text.slice(0, 200),
      author: `@${users[tweet.author_id] ?? "unknown"}`,
      timestamp: tweet.created_at,
    }));

    const result: XMentions = {
      count: json.meta?.result_count ?? recent.length,
      recent,
      cached: false,
    };

    mentionCache.set(cacheKey, { data: result, expires: Date.now() + CACHE_TTL });
    return result;
  } catch (err) {
    console.error("fetchTokenMentions error:", err);
    return cached?.data ?? { count: 0, recent: [], cached: false };
  }
}
