"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Member {
  id: string;
  name?: string | null;
  email: string;
  avatar?: string | null;
  role: string;
}

interface MemberListProps {
  members: Member[];
  currentUserRole: string;
  onInvite?: (email: string, role: string) => Promise<void>;
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

const roleColors: Record<string, string> = {
  OWNER: "default",
  ADMIN: "secondary",
  MEMBER: "outline",
};

export function MemberList({
  members,
  currentUserRole,
  onInvite,
}: MemberListProps) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState("");

  const canInvite = currentUserRole === "OWNER" || currentUserRole === "ADMIN";

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim() || !onInvite) return;

    setInviting(true);
    setError("");

    try {
      await onInvite(inviteEmail, "MEMBER");
      setInviteEmail("");
      setDialogOpen(false);
    } catch (err: any) {
      setError(err.message || "Failed to invite");
    } finally {
      setInviting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          Members ({members.length})
        </h3>
        {canInvite && onInvite && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger>
              <Button variant="outline" size="sm">
                Invite
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleInvite} className="space-y-4">
                {error && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}
                <Input
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
                <Button type="submit" disabled={inviting} className="w-full">
                  {inviting ? "Inviting..." : "Send Invite"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="space-y-2">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center gap-3 rounded-md p-2"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={member.avatar || undefined} />
              <AvatarFallback className="text-xs">
                {getInitials(member.name, member.email)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {member.name || member.email}
              </p>
              {member.name && (
                <p className="text-xs text-muted-foreground truncate">
                  {member.email}
                </p>
              )}
            </div>
            <Badge
              variant={roleColors[member.role] as any || "outline"}
              className="text-xs"
            >
              {member.role}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
