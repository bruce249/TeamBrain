"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FeedCard } from "./feed-card";

interface KnowledgeCard {
  id: string;
  question: string;
  summary: string;
  tags: string[];
  isPinned: boolean;
  isCanonical: boolean;
  createdAt: string;
  author: {
    id: string;
    name?: string | null;
    email: string;
    avatar?: string | null;
  };
}

export function BrainGrid() {
  const [cards, setCards] = useState<KnowledgeCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const fetchCards = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (activeTag) params.set("tag", activeTag);

    try {
      const res = await fetch(`/api/cards?${params}`);
      const data = await res.json();
      setCards(data.cards || []);
    } catch {
      console.error("Failed to fetch cards");
    } finally {
      setLoading(false);
    }
  }, [search, activeTag]);

  useEffect(() => {
    const timeout = setTimeout(fetchCards, 300); // Debounce search
    return () => clearTimeout(timeout);
  }, [fetchCards]);

  // Collect all unique tags
  const allTags = Array.from(new Set(cards.flatMap((c) => c.tags))).slice(0, 20);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Search knowledge base..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setActiveTag(null);
          }}
          className="max-w-sm"
        />
      </div>

      {allTags.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          <Badge
            variant={activeTag === null ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setActiveTag(null)}
          >
            All
          </Badge>
          {allTags.map((tag) => (
            <Badge
              key={tag}
              variant={activeTag === tag ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {loading ? (
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="mb-4 break-inside-avoid">
              <Skeleton className="h-32 w-full rounded-lg" />
            </div>
          ))}
        </div>
      ) : cards.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          {search || activeTag
            ? "No cards match your filters."
            : "No knowledge cards yet. Save your first AI response to build your team brain."}
        </div>
      ) : (
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
          {cards.map((card) => (
            <div key={card.id} className="mb-4 break-inside-avoid">
              <FeedCard
                id={card.id}
                question={card.question}
                summary={card.summary}
                tags={card.tags}
                author={card.author}
                createdAt={card.createdAt}
                showSave={false}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
