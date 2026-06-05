import { FadeUp } from "@/lib/motion";
import { Check } from "lucide-react";

export function TrustBar() {
  return (
    <FadeUp>
      <div className="border-y border-[var(--border)] bg-[var(--bg-surface)]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-6 px-6 py-5 text-sm text-[var(--text-tertiary)] md:px-8">
          <span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[var(--accent)]" />10,000+ businesses scanned</span>
          <span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[var(--accent)]" />Built by an agency, for agencies</span>
          <span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[var(--accent)]" />2–3× faster sales cycles</span>
        </div>
      </div>
    </FadeUp>
  );
}
