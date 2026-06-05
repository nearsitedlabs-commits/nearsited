import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { shareTokenLimiter } from "@/lib/rate-limit";
import ShareReportClient from "./share-report-client";
import type { AuditRow, DesignAnalysisRow } from "@/lib/db-types";

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
  mobileAudit: AuditRow | null;
  desktopAudit: AuditRow | null;
  mobileDesign: DesignAnalysisRow | null;
  desktopDesign: DesignAnalysisRow | null;
};

// ── Rate Limit Helpers ───────────────────────────────────────────────────────

/** Extract the client IP from request headers */
async function getClientIp(): Promise<string> {
  const hdrs = await headers();
  // x-forwarded-for can contain a comma-separated list — take the first entry
  const forwardedFor = hdrs.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return hdrs.get("x-real-ip") ?? "anonymous";
}

// ── Data Fetch ───────────────────────────────────────────────────────────────

async function getShareData(token: string): Promise<ShareData | null> {
  const admin = createAdminClient();

  // Fetch share link with expiration
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: link } = await (admin.from("share_links") as any)
    .select("business_id, expires_at")
    .eq("token", token)
    .single();

  if (!link) return null;

  // Check expiration — if expires_at is set and in the past, treat as not found
  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return null;
  }

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

  const auditList = (audits ?? []) as AuditRow[];
  const designList = (designs ?? []) as DesignAnalysisRow[];

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

  // ── Rate limiting (per-token, 60 req / 60s) ─────────────────────────────
  const ip = await getClientIp();
  const { success } = await shareTokenLimiter.limit(`share:${token}:${ip}`);

  if (!success) {
    notFound();
  }

  const data = await getShareData(token);

  if (!data) {
    notFound();
  }

  return <ShareReportClient data={data} />;
}
