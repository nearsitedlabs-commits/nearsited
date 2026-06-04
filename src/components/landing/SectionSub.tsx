export function SectionSub({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`mt-4 max-w-2xl text-base leading-7 text-[var(--text-secondary)] ${className}`}>
      {children}
    </p>
  );
}
