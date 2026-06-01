import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { scoreLabel, scoreColorClasses } from "@/lib/scoring";

// ── Types ────────────────────────────────────────────────────────────────────

type ShareData = {
  business: {
    name: string;
    business_type: string;
    address: string;
    city: string;
    website: string | null;
    website_status: string;
    rating: number | null;
    review_count: number | null;
    performance_score: number | null;
    design_score: number | null;
    audited_at: string | null;
    design_analyzed_at: string | null;
  };
  mobileAudit: Record<string, unknown> | null;
  desktopAudit: Record<string, unknown> | null;
  mobileDesign: Record<string, unknown> | null;
  desktopDesign: Record<string, unknown> | null;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function ScoreRing({ score, size = "md" }: { score: number | null; size?: "sm" | "md" | "lg" }) {
  const dim = size === "lg" ? 80 : size === "sm" ? 40 : 56;
  const stroke = size === "lg" ? 5 : size === "sm" ? 3 : 4;
  const r = (dim - stroke) / 2;
  const circumference = 2 * Math.PI * r;

  if (score === null) {
    return (
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center justify-center rounded-full border-2 border-[var(--border)] bg-[var(--bg-surface-2)]" style={{ width: dim, height: dim }}>
          <span className="text-sm font-bold text-[var(--text-tertiary)]">—</span>
        </div>
      </div>
    );
  }

  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference - (clamped / 100) * circumference;
  const { ring, text: txtClass } = scoreColorClasses(score);
  const lbl = scoreLabel(score);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative flex items-center justify-center" style={{ width: dim, height: dim }}>
        <svg width={dim} height={dim} className="-rotate-90">
          <circle cx={dim / 2} cy={dim / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-[var(--border-strong)]" />
          <circle cx={dim / 2} cy={dim / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round"
            className={ring} strokeDasharray={circumference} strokeDashoffset={offset} />
        </svg>
        <span className={`absolute font-bold ${size === "lg" ? "text-xl" : "text-sm"} ${txtClass}`}>{clamped}</span>
      </div>
      <span className={`text-center text-xs font-medium ${txtClass}`}>{lbl}</span>
    </div>
  );
}

function SubScore({ label, score }: { label: string; score: number | null }) {
  const color = score === null
    ? "text-[var(--text-tertiary)]"
    : score >= 70 ? "text-[var(--score-good)]"
    : score >= 40 ? "text-[var(--score-mid)]"
    : "text-[var(--score-high)]";
  return (
    <div className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2">
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      <span className={`text-sm font-bold ${color}`}>{score ?? "—"}</span>
    </div>
  );
}

function ImpactPill({ impact }: { impact: string }) {
  const color = impact === "High"
    ? "bg-[var(--status-error-bg)] text-[var(--status-error-text)] border-[var(--status-error-text)]/30"
    : impact === "Medium"
    ? "bg-[var(--status-warning-bg)] text-[var(--status-warning-text)] border-[var(--status-warning-text)]/30"
    : "bg-[var(--status-success-bg)] text-[var(--status-success-text)] border-[var(--status-success-text)]/30";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${color}`}>
      {impact}
    </span>
  );
}

// ── AI Summary Helper ────────────────────────────────────────────────────────

function getDesignSummary(
  mobileIssues: { title: string; detail: string }[] | undefined,
  desktopIssues: { title: string; detail: string }[] | undefined,
): string {
  const all = [...(mobileIssues ?? []), ...(desktopIssues ?? [])];
  if (all.length === 0) return "";
  const top = all.slice(0, 3).map((i) => i.title.toLowerCase());
  if (top.length === 1) return `The main issue found: ${top[0]}.`;
  const last = top.pop();
  return `The main issues found: ${top.join(", ")}, and ${last}.`;
}

// ── Data Fetch ───────────────────────────────────────────────────────────────

async function getShareData(token: string): Promise<ShareData | null> {
  const admin = createAdminClient();

  // Fetch share link
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: link } = await (admin.from("share_links") as any)
    .select("business_id")
    .eq("token", token)
    .single();

  if (!link) return null;

  const businessId = link.business_id;

  // Fetch business
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: biz } = await (admin.from("businesses") as any)
    .select("name, business_type, address, city, website, website_status, rating, review_count, performance_score, design_score, audited_at, design_analyzed_at")
    .eq("id", businessId)
    .single();

  if (!biz) return null;

  // Fetch latest audits
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: audits } = await (admin.from("audits") as any)
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(2);

  // Fetch latest design analyses
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: designs } = await (admin.from("design_analyses") as any)
    .select("*")
    .eq("business_id", businessId)
    .order("analyzed_at", { ascending: false })
    .limit(2);

  const auditList = (audits ?? []) as Record<string, unknown>[];
  const designList = (designs ?? []) as Record<string, unknown>[];

  return {
    business: biz as ShareData["business"],
    mobileAudit: auditList.find((a) => a.strategy === "mobile") ?? null,
    desktopAudit: auditList.find((a) => a.strategy === "desktop") ?? null,
    mobileDesign: designList.find((a) => a.strategy === "mobile") ?? null,
    desktopDesign: designList.find((a) => a.strategy === "desktop") ?? null,
  };
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const data = await getShareData(token);

  if (!data) {
    notFound();
  }

  const { business, mobileAudit, desktopAudit, mobileDesign, desktopDesign } = data;
  const overallScore = business.performance_score ?? business.design_score;
  const issues = [
    ...((mobileDesign?.issues as { title: string; detail: string; point_deduction?: number; impact: string }[]) ?? []),
    ...((desktopDesign?.issues as { title: string; detail: string; point_deduction?: number; impact: string }[]) ?? []),
  ].slice(0, 5);

  return (
    <div className="min-h-screen bg-[var(--bg-base)] py-8">
      <div className="mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="mb-6 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
            Shared Report — Nearsited
          </p>
          <h1 className="mt-2 text-3xl font-bold text-[var(--text-primary)]">{business.name}</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {business.business_type} &middot; {business.city} &middot; {business.address}
          </p>
          {business.website && (
            <a
              href={business.website}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-sm text-[var(--accent)] hover:underline"
            >
              {business.website}
            </a>
          )}
        </div>

        {/* Overall Score */}
        <div className="mb-6 flex justify-center">
          <ScoreRing score={overallScore} size="lg" />
        </div>

        {/* Performance Scores */}
        <div className="mb-6 grid gap-6 md:grid-cols-2">
          {/* Mobile Audit */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface-1)] p-6">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">📱 Mobile</p>
            {mobileAudit ? (
              <div className="space-y-2">
                <SubScore label="Performance" score={(mobileAudit.performance_score as number | null) ?? null} />
                <SubScore label="SEO" score={(mobileAudit.seo_score as number | null) ?? null} />
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-[var(--bg-elevated)] p-2">
                    <span className="text-[var(--text-tertiary)]">FCP</span>
                    <p className="font-medium text-[var(--text-primary)]">{mobileAudit.fcp as string ?? "—"}</p>
                  </div>
                  <div className="rounded-lg bg-[var(--bg-elevated)] p-2">
                    <span className="text-[var(--text-tertiary)]">LCP</span>
                    <p className="font-medium text-[var(--text-primary)]">{mobileAudit.lcp as string ?? "—"}</p>
                  </div>
                  <div className="rounded-lg bg-[var(--bg-elevated)] p-2">
                    <span className="text-[var(--text-tertiary)]">TBT</span>
                    <p className="font-medium text-[var(--text-primary)]">{mobileAudit.tbt as string ?? "—"}</p>
                  </div>
                  <div className="rounded-lg bg-[var(--bg-elevated)] p-2">
                    <span className="text-[var(--text-tertiary)]">CLS</span>
                    <p className="font-medium text-[var(--text-primary)]">{mobileAudit.cls as string ?? "—"}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[var(--text-tertiary)]">No audit data available</p>
            )}
          </div>

          {/* Desktop Audit */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface-1)] p-6">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">🖥️ Desktop</p>
            {desktopAudit ? (
              <div className="space-y-2">
                <SubScore label="Performance" score={(desktopAudit.performance_score as number | null) ?? null} />
                <SubScore label="SEO" score={(desktopAudit.seo_score as number | null) ?? null} />
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-[var(--bg-elevated)] p-2">
                    <span className="text-[var(--text-tertiary)]">FCP</span>
                    <p className="font-medium text-[var(--text-primary)]">{desktopAudit.fcp as string ?? "—"}</p>
                  </div>
                  <div className="rounded-lg bg-[var(--bg-elevated)] p-2">
                    <span className="text-[var(--text-tertiary)]">LCP</span>
                    <p className="font-medium text-[var(--text-primary)]">{desktopAudit.lcp as string ?? "—"}</p>
                  </div>
                  <div className="rounded-lg bg-[var(--bg-elevated)] p-2">
                    <span className="text-[var(--text-tertiary)]">TBT</span>
                    <p className="font-medium text-[var(--text-primary)]">{desktopAudit.tbt as string ?? "—"}</p>
                  </div>
                  <div className="rounded-lg bg-[var(--bg-elevated)] p-2">
                    <span className="text-[var(--text-tertiary)]">CLS</span>
                    <p className="font-medium text-[var(--text-primary)]">{desktopAudit.cls as string ?? "—"}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[var(--text-tertiary)]">No audit data available</p>
            )}
          </div>
        </div>

        {/* AI Opportunity Summary */}
        {issues.length > 0 && (
          <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--bg-surface-1)] p-6">
            <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">AI Opportunity Summary</h2>
            <p className="mb-3 text-sm leading-relaxed text-[var(--text-secondary)]">
              {getDesignSummary(
                mobileDesign?.issues as { title: string; detail: string }[] | undefined,
                desktopDesign?.issues as { title: string; detail: string }[] | undefined,
              )}
            </p>
            <ul className="space-y-2">
              {issues.slice(0, 4).map((issue, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                  {issue.detail}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Design Issues */}
        {issues.length > 0 && (
          <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--bg-surface-1)] p-6">
            <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Design Issues</h2>
            <div className="space-y-3">
              {issues.map((issue, i) => (
                <div key={i} className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[var(--text-primary)]">{issue.title}</p>
                      <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">{issue.detail}</p>
                    </div>
                    <div className="ml-3 flex flex-col items-end gap-1">
                      <ImpactPill impact={issue.impact ?? "Medium"} />
                      {issue.point_deduction && (
                        <span className="text-xs font-bold text-[var(--score-high)]">-{issue.point_deduction}pts</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-[var(--text-tertiary)]">
          <p>Generated by <span className="font-semibold text-[var(--accent)]">Nearsited</span> &mdash; AI-powered redesign opportunity intelligence</p>
          {business.design_analyzed_at && (
            <p className="mt-1">Analysed {new Date(business.design_analyzed_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
          )}
        </div>
      </div>
    </div>
  );
}
