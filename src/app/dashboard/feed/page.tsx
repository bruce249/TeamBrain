"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { FeedCard } from "@/components/feed-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRealtimeFeed } from "@/hooks/use-realtime-feed";

interface FeedItem {
  id: string;
  createdAt: string;
  card: {
    id: string;
    question: string;
    summary: string;
    tags: string[];
    author: {
      id: string;
      name?: string | null;
      email: string;
      avatar?: string | null;
    };
    createdAt: string;
  };
}

export default function FeedPage() {
  const { data: session } = useSession();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchFeed = useCallback(async (cursor?: string) => {
    const isLoadMore = !!cursor;
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);

    try {
      const params = new URLSearchParams();
      if (cursor) params.set("cursor", cursor);
      params.set("limit", "20");

      const res = await fetch(`/api/feed?${params}`);
      const data = await res.json();

      if (isLoadMore) {
        setItems((prev) => [...prev, ...(data.items || [])]);
      } else {
        setItems(data.items || []);
      }
      setNextCursor(data.nextCursor);
    } catch {
      console.error("Failed to fetch feed");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  // Phase 6: Realtime — when a new feed item arrives, refetch the latest
  const handleNewRealtimeItem = useCallback(() => {
    // Refetch from the top to get the full item with relations
    fetchFeed();
  }, [fetchFeed]);

  useRealtimeFeed({
    workspaceId: session?.user.workspaceId || "",
    onNewItem: handleNewRealtimeItem,
  });

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Team Feed</h2>
        <p className="text-sm text-muted-foreground">
          See what your team is learning in real time.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          No feed items yet. Save an AI response to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <FeedCard
              key={item.id}
              id={item.card.id}
              question={item.card.question}
              summary={item.card.summary}
              tags={item.card.tags}
              author={item.card.author}
              createdAt={item.card.createdAt}
              showSave={false}
            />
          ))}
          {nextCursor && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => fetchFeed(nextCursor)}
                disabled={loadingMore}
              >
                {loadingMore ? "Loading..." : "Load more"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
