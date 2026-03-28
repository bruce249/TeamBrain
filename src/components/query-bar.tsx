"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface RelatedCard {
  id: string;
  question: string;
  summary: string;
  tags: string[];
  author: { name?: string | null; email: string };
}

interface QueryBarProps {
  onResponse?: (response: string, relatedCards: RelatedCard[]) => void;
  onSaveCard?: (question: string, answer: string) => void;
}

export function QueryBar({ onResponse, onSaveCard }: QueryBarProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState("");
  const [relatedCards, setRelatedCards] = useState<RelatedCard[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cmd+K / Ctrl+K to focus
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!query.trim() || loading) return;

      setLoading(true);
      setResponse("");
      setRelatedCards([]);

      try {
        const res = await fetch("/api/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: query, sessionId }),
        });

        if (!res.ok) {
          const data = await res.json();
          setResponse(`Error: ${data.error}`);
          setLoading(false);
          return;
        }

        // Read SSE stream
        const reader = res.body?.getReader();
        if (!reader) {
          setResponse("Failed to read response stream");
          setLoading(false);
          return;
        }

        const decoder = new TextDecoder();
        let fullResponse = "";
        let cards: RelatedCard[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n\n").filter(Boolean);

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6);

            try {
              const event = JSON.parse(jsonStr);

              switch (event.type) {
                case "meta":
                  cards = event.relatedCards || [];
                  setRelatedCards(cards);
                  break;
                case "text":
                  fullResponse += event.text;
                  setResponse(fullResponse);
                  break;
                case "done":
                  setSessionId(event.sessionId);
                  onResponse?.(fullResponse, cards);
                  break;
                case "error":
                  setResponse(
                    fullResponse || `Error: ${event.error}`
                  );
                  break;
              }
            } catch {
              // Skip malformed JSON chunks
            }
          }
        }
      } catch {
        setResponse("Failed to connect. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [query, loading, sessionId, onResponse]
  );

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            placeholder="Ask your team's AI anything... (Cmd+K)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-12 pr-16 text-base"
            disabled={loading}
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            ⌘K
          </kbd>
        </div>
        <Button type="submit" disabled={loading || !query.trim()} className="h-12">
          {loading ? "Thinking..." : "Ask"}
        </Button>
      </form>

      {loading && !response && (
        <div className="space-y-2 rounded-lg border p-4">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      )}

      {response && (
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              AI Response
              {loading && (
                <span className="ml-2 inline-block h-2 w-2 animate-pulse rounded-full bg-primary" />
              )}
            </span>
            {!loading && onSaveCard && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSaveCard(query, response)}
              >
                Save to Brain
              </Button>
            )}
          </div>
          <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
            {response}
          </div>
        </div>
      )}
    </div>
  );
}
