import { Radar } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import Link from "next/link";

export default function RadarPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <EmptyState
          icon={<Radar className="h-6 w-6 text-[var(--accent)]" />}
          title="Opportunity Radar"
          description="Monitor your leads and get notified when new opportunities appear. This feature is coming soon."
          action={
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
            >
              Back to Dashboard
            </Link>
          }
        />
      </div>
    </div>
  );
}
