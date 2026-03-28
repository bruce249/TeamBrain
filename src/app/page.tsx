import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        TeamBrain
      </h1>
      <p className="max-w-md text-lg text-muted-foreground">
        A shared AI workspace where every query builds your team&apos;s
        collective knowledge.
      </p>
      <div className="flex gap-3">
        <Link href="/auth/signup">
          <Button size="lg">Get Started</Button>
        </Link>
        <Link href="/auth/signin">
          <Button variant="outline" size="lg">Sign In</Button>
        </Link>
      </div>
    </div>
  );
}
