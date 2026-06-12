import { FadeUp } from "@/lib/motion";

export function SectionTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <FadeUp>
      <h2 className={`text-[clamp(1.25rem,4vw+0.5rem,2.8rem)] font-medium leading-[1.2] tracking-[-0.02em] text-[var(--color-text-primary)] ${className}`}>
        {children}
      </h2>
    </FadeUp>
  );
}
