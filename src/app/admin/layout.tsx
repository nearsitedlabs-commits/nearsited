import { requireAdmin } from "@/lib/admin-auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // requireAdmin handles auth + admin check, redirects if not authorized
  await requireAdmin();

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <div className="border-b border-[var(--border)] bg-[var(--bg-surface-2)] px-6 py-3 flex items-center gap-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-red-400 border border-red-400/40 bg-red-400/10 rounded px-2 py-0.5">Internal</span>
        <span className="text-sm text-[var(--text-tertiary)]">Admin Tools</span>
        <a href="/dashboard" className="ml-auto text-xs text-[var(--text-tertiary)] hover:text-[var(--accent)]">← Back to Dashboard</a>
      </div>
      {children}
    </div>
  );
}
