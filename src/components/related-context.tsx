"use client";

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface RelatedCard {
  id: string;
  question: string;
  summary: string;
  tags: string[];
  author: { name?: string | null; email: string };
}

interface RelatedContextProps {
  cards: RelatedCard[];
}

export function RelatedContext({ cards }: RelatedContextProps) {
  if (cards.length === 0) {
    return (
      <div className="rounded-lg border p-4">
        <h3 className="text-sm font-semibold mb-2">Related Context</h3>
        <p className="text-sm text-muted-foreground">
          No matching knowledge cards found. As your team saves more cards,
          relevant context will appear here automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-4">
      <h3 className="text-sm font-semibold mb-3">
        Related Context ({cards.length})
      </h3>
      <ScrollArea className="max-h-80">
        <div className="space-y-3">
          {cards.map((card, i) => (
            <div key={card.id}>
              {i > 0 && <Separator className="mb-3" />}
              <div>
                <p className="text-sm font-medium leading-tight">
                  {card.question}
                </p>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-3">
                  {card.summary}
                </p>
                <div className="mt-2 flex items-center gap-1 flex-wrap">
                  {card.tags.slice(0, 3).map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {tag}
                    </Badge>
                  ))}
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    by {card.author.name || card.author.email}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
