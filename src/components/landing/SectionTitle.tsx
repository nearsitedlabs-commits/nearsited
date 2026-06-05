import { FadeUp } from "@/lib/motion";

export function SectionTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <FadeUp>
      <h2 className={`text-[clamp(1.8rem,3vw,2.8rem)] font-medium leading-[1.15] tracking-[-0.02em] text-[var(--text-primary)] ${className}`}>
        {children}
      </h2>
    </FadeUp>
  );
}
