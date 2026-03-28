import { BrainGrid } from "@/components/brain-grid";

export default function BrainPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Brain</h2>
        <p className="text-sm text-muted-foreground">
          Your team&apos;s collective knowledge base.
        </p>
      </div>
      <BrainGrid />
    </div>
  );
}
