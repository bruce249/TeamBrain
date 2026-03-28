"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface FeedCardProps {
  id: string;
  question: string;
  summary: string;
  tags: string[];
  author: {
    name?: string | null;
    email: string;
    avatar?: string | null;
  };
  createdAt: string;
  onSave?: (cardId: string) => void;
  showSave?: boolean;
}

function timeAgo(dateString: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateString).getTime()) / 1000
  );

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function getInitials(name?: string | null, email?: string): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return (email || "?")[0].toUpperCase();
}

export function FeedCard({
  id,
  question,
  summary,
  tags,
  author,
  createdAt,
  onSave,
  showSave = true,
}: FeedCardProps) {
  return (
    <div className="rounded-lg border p-4 transition-colors hover:bg-muted/50">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={author.avatar || undefined} />
            <AvatarFallback className="text-xs">
              {getInitials(author.name, author.email)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-medium leading-tight truncate">{question}</p>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {summary}
            </p>
          </div>
        </div>
        {showSave && onSave && (
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0"
            onClick={() => onSave(id)}
          >
            Save
          </Button>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2 flex-wrap">
        {tags.slice(0, 4).map((tag) => (
          <Badge key={tag} variant="secondary" className="text-xs">
            {tag}
          </Badge>
        ))}
        {tags.length > 4 && (
          <span className="text-xs text-muted-foreground">
            +{tags.length - 4} more
          </span>
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          {timeAgo(createdAt)}
        </span>
      </div>
    </div>
  );
}
