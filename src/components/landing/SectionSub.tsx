import { FadeUp } from "@/lib/motion";

export function SectionSub({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <FadeUp>
      <p className={`mt-4 max-w-2xl text-base leading-7 text-[var(--color-text-secondary)] ${className}`}>
        {children}
      </p>
    </FadeUp>
  );
}
