"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import { MemberList } from "@/components/member-list";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

interface Member {
  id: string;
  name?: string | null;
  email: string;
  avatar?: string | null;
  role: string;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch("/api/workspace/members");
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
      }
    } catch {
      console.error("Failed to fetch members");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  async function handleInvite(email: string, role: string) {
    const res = await fetch("/api/workspace/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    // Refresh members list
    await fetchMembers();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Manage your workspace and team.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold">Workspace</h3>
          <p className="text-sm text-muted-foreground">
            {session?.user.workspaceName}
          </p>
        </div>

        <Separator />

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <MemberList
            members={members}
            currentUserRole={session?.user.role || "MEMBER"}
            onInvite={handleInvite}
          />
        )}
      </div>
    </div>
  );
}
