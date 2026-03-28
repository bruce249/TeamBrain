"use client";

import { useEffect, useRef } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface UseRealtimeFeedOptions {
  workspaceId: string;
  onNewItem: (payload: any) => void;
}

export function useRealtimeFeed({
  workspaceId,
  onNewItem,
}: UseRealtimeFeedOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!workspaceId) return;

    let supabase: ReturnType<typeof getSupabaseClient>;
    try {
      supabase = getSupabaseClient();
    } catch {
      // Supabase not configured — skip realtime
      return;
    }

    const channel = supabase
      .channel(`feed:${workspaceId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "team_feed_items",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          onNewItem(payload.new);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [workspaceId, onNewItem]);
}
