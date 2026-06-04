"use client";

export function LoadingSkeleton() {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden shadow-[var(--brand-shadow-sm)]">
      <div className="border-b border-[var(--border)] px-6 py-4">
        <div className="h-5 w-44 rounded-lg bg-[var(--bg-elevated)] animate-pulse" />
      </div>
      <div className="divide-y divide-[var(--border)]">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 min-h-[52px]">
            <div className="w-[3px] self-stretch bg-[var(--bg-elevated)] animate-pulse" style={{ animationDelay: `${i * 0.05}s` }} />
            <div className="w-[108px] flex-shrink-0">
              <div className="h-[26px] w-[90px] rounded-lg animate-pulse" style={{ backgroundColor: `hsl(${i * 45 + 210}, 22%, 91%)`, animationDelay: `${i * 0.05}s` }} />
            </div>
            <div className="flex-1 space-y-2 py-3.5">
              <div className="h-[14px] rounded-md bg-[var(--bg-elevated)] animate-pulse" style={{ width: `${48 + (i * 7) % 28}%`, animationDelay: `${i * 0.05 + 0.04}s` }} />
              <div className="h-[11px] rounded-md bg-[var(--bg-elevated)] animate-pulse" style={{ width: `${32 + (i * 5) % 20}%`, animationDelay: `${i * 0.05 + 0.08}s` }} />
            </div>
            <div className="w-[168px] flex-shrink-0 flex justify-end gap-2.5">
              <div className="h-[15px] w-[15px] rounded bg-[var(--bg-elevated)] animate-pulse" />
              <div className="h-[15px] w-[15px] rounded bg-[var(--bg-elevated)] animate-pulse" />
            </div>
            <div className="w-[216px] flex-shrink-0 flex items-center justify-end gap-2">
              <div className="h-[30px] w-[120px] rounded-lg bg-[var(--bg-elevated)] animate-pulse" />
              <div className="h-[30px] w-[90px] rounded-lg animate-pulse" style={{ backgroundColor: "hsl(240, 55%, 92%)" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
