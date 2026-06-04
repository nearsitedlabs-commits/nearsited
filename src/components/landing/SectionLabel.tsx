export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 inline-flex items-center gap-3 text-[0.7rem] uppercase tracking-[0.18em] text-[var(--accent)]">
      <span className="block h-px w-6 bg-[var(--accent)]" />
      {children}
    </div>
  );
}
