"use client";

import { useState, useCallback } from "react";
import { QueryBar } from "@/components/query-bar";
import { RelatedContext } from "@/components/related-context";

interface RelatedCard {
  id: string;
  question: string;
  summary: string;
  tags: string[];
  author: { name?: string | null; email: string };
}

export default function DashboardPage() {
  const [relatedCards, setRelatedCards] = useState<RelatedCard[]>([]);
  const [lastQuery, setLastQuery] = useState("");
  const [lastResponse, setLastResponse] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleResponse = useCallback(
    (response: string, cards: RelatedCard[]) => {
      setRelatedCards(cards);
      setLastResponse(response);
      setSaveSuccess(false);
    },
    []
  );

  const handleSaveCard = useCallback(
    async (question: string, answer: string) => {
      setSaving(true);
      setLastQuery(question);

      // Auto-generate tags from the question
      const tags = question
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .split(/\s+/)
        .filter((w) => w.length > 3)
        .slice(0, 5);

      try {
        const res = await fetch("/api/cards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question,
            answer,
            summary: answer.slice(0, 200) + (answer.length > 200 ? "..." : ""),
            tags,
          }),
        });

        if (res.ok) {
          setSaveSuccess(true);
        }
      } catch {
        console.error("Failed to save card");
      } finally {
        setSaving(false);
      }
    },
    []
  );

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Query</h2>
        <p className="text-sm text-muted-foreground">
          Ask your team&apos;s AI anything. Your queries build shared knowledge.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <QueryBar onResponse={handleResponse} onSaveCard={handleSaveCard} />
          {saving && (
            <p className="text-sm text-muted-foreground">Saving to Brain...</p>
          )}
          {saveSuccess && (
            <p className="text-sm text-green-600">
              Saved to your team&apos;s Brain!
            </p>
          )}
        </div>
        <aside className="hidden lg:block">
          <RelatedContext cards={relatedCards} />
        </aside>
      </div>
    </div>
  );
}
