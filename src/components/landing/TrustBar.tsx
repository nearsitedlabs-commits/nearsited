import { FadeUp } from "@/lib/motion";

export function TrustBar() {
  return (
    <FadeUp>
      <div className="border-y border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-6 px-6 py-5 text-sm text-[var(--color-text-tertiary)] md:px-8">
          <span>Built by an agency founder who needed this.</span>
          <span className="hidden sm:inline">·</span>
          <span className="hidden sm:inline">Still early. Already finding leads.</span>
          <span className="hidden sm:inline">·</span>
          <span>No VC. Just a tool I use to close my own clients.</span>
        </div>
      </div>
    </FadeUp>
  );
}
