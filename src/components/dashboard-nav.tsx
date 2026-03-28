"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface DashboardNavProps {
  user: {
    name?: string | null;
    email: string;
    workspaceName: string;
  };
}

const navItems = [
  { label: "Query", href: "/dashboard" },
  { label: "Feed", href: "/dashboard/feed" },
  { label: "Brain", href: "/dashboard/brain" },
  { label: "Settings", href: "/dashboard/settings" },
];

export function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 flex-col border-r bg-muted/30 p-4">
      <div className="mb-6">
        <h1 className="text-lg font-bold">TeamBrain</h1>
        <p className="text-xs text-muted-foreground truncate">
          {user.workspaceName}
        </p>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent",
              pathname === item.href
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="border-t pt-4">
        <p className="mb-2 truncate text-sm font-medium">
          {user.name || user.email}
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          onClick={() => signOut({ callbackUrl: "/auth/signin" })}
        >
          Sign out
        </Button>
      </div>
    </aside>
  );
}
