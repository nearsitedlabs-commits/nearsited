import { FadeUp } from "@/lib/motion";

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <FadeUp>
      <div className="mb-4 inline-flex items-center gap-3 text-[0.7rem] uppercase tracking-[0.18em] text-[var(--color-accent)]">
        <span className="block h-px w-6 bg-[var(--color-accent)]" />
        {children}
      </div>
    </FadeUp>
  );
}
