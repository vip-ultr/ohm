"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { WatchlistItem } from "@/types";

export function useWatchlist(userId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: watchlist = [], isLoading } = useQuery<WatchlistItem[]>({
    queryKey: ["watchlist", userId],
    queryFn: async () => {
      const res = await fetch("/api/watchlist");
      if (!res.ok) return [];
      return res.json() as Promise<WatchlistItem[]>;
    },
    enabled: !!userId,
    staleTime: 60_000,
  });

  const toggleMutation = useMutation({
    mutationFn: async ({
      address,
      action,
    }: {
      address: string;
      action: "add" | "remove";
    }) => {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenAddress: address, action }),
      });
      if (!res.ok) throw new Error("Watchlist update failed");
      return res.json();
    },
    onMutate: async ({ address, action }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["watchlist", userId] });
      const prev = queryClient.getQueryData<WatchlistItem[]>(["watchlist", userId]);

      queryClient.setQueryData<WatchlistItem[]>(["watchlist", userId], (old = []) => {
        if (action === "add") {
          return [...old, { tokenAddress: address, addedAt: new Date().toISOString() }];
        }
        return old.filter((item) => item.tokenAddress !== address);
      });

      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(["watchlist", userId], ctx.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist", userId] });
    },
  });

  const isWatched = (address: string) =>
    watchlist.some((item) => item.tokenAddress === address);

  const toggle = (address: string) => {
    const action = isWatched(address) ? "remove" : "add";
    toggleMutation.mutate({ address, action });
  };

  return { watchlist, isWatched, toggle, isLoading };
}
