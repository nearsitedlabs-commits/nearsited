import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { jsPDF } from "jspdf";
import { rateLimiter, checkRateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { businessIdQuerySchema } from "@/lib/validation";

const ACCENT: [number, number, number] = [138, 151, 119];
const BLACK: [number, number, number] = [20, 20, 20];
const GRAY: [number, number, number] = [100, 100, 100];
const LIGHT: [number, number, number] = [160, 160, 160];
const RED: [number, number, number] = [200, 40, 40];

function section(doc: jsPDF, title: string, y: number): number {
  doc.setFontSize(12);
  doc.setTextColor(...ACCENT);
  doc.text(title, 20, y);
  doc.setDrawColor(...ACCENT);
  doc.line(20, y + 2, 190, y + 2);
  return y + 10;
}

function scoreRow(doc: jsPDF, label: string, value: number | null, y: number): number {
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text(label, 25, y);
  if (value !== null) {
    const color: [number, number, number] = value >= 70 ? [34, 120, 60] : value >= 40 ? [180, 100, 20] : RED;
    doc.setTextColor(...color);
    doc.text(`${value}/100`, 130, y);
  } else {
    doc.setTextColor(...LIGHT);
    doc.text("—", 130, y);
  }
  return y + 6;
}

function wrapped(doc: jsPDF, text: string, x: number, y: number, maxWidth: number, lineHeight: number): number {
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // ── Zod validation ──────────────────────────────────────────────────────
    const queryParams = Object.fromEntries(searchParams.entries());
    const parsed = businessIdQuerySchema.safeParse(queryParams);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues.map((i) => i.message) },
        { status: 400 },
      );
    }
    const { businessId } = parsed.data;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Rate limit: standard limit for PDF export
    const identifier = getRateLimitIdentifier(request, user.id);
    const blocked = await checkRateLimit(request, rateLimiter, identifier);
    if (blocked) return blocked;

    const [{ data: biz }, { data: audits }, { data: designs }, { data: pitches }] = await Promise.all([
      supabase.from("businesses").select("*").eq("id", businessId).eq("user_id", user.id).single(),
      supabase.from("audits").select("*").eq("business_id", businessId).order("created_at", { ascending: false }).limit(2),
      supabase.from("design_analyses").select("*").eq("business_id", businessId).order("analyzed_at", { ascending: false }).limit(2),
      supabase.from("pitches").select("subject,body,tone").eq("business_id", businessId).order("created_at", { ascending: false }).limit(1),
    ]);

    if (!biz) return NextResponse.json({ error: "Business not found" }, { status: 404 });

    const mobileAudit  = (audits ?? []).find((a) => a.strategy === "mobile");
    const desktopAudit = (audits ?? []).find((a) => a.strategy === "desktop");
    const mobileDesign = (designs ?? []).find((a) => a.strategy === "mobile");
    const latestPitch  = pitches?.[0] ?? null;

    const perfScore   = desktopAudit?.performance_score ?? mobileAudit?.performance_score ?? null;
    const seoScore    = desktopAudit?.seo_score ?? null;
    const mobileScore = mobileAudit?.performance_score ?? null;
    const designScore = mobileDesign?.design_score ?? (biz.design_score as number | null) ?? null;
    const issues = (mobileDesign?.issues ?? []) as { title: string; detail: string; point_deduction?: number; impact?: string }[];

    const doc = new jsPDF({ format: "a4" });
    let y = 20;
    const PAGE_H = 280;
    const margin = 20;

    const checkPage = (needed: number) => {
      if (y + needed > PAGE_H) {
        doc.addPage();
        y = 20;
      }
    };

    // ── Header ───────────────────────────────────────────────────────────────
    doc.setFontSize(20);
    doc.setTextColor(...ACCENT);
    doc.text("Nearsited", margin, y);
    doc.setFontSize(9);
    doc.setTextColor(...LIGHT);
    doc.text("Redesign Opportunity Report", margin, y + 6);
    doc.setFontSize(8);
    doc.text(`Generated ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`, 190, y, { align: "right" });
    y += 18;

    // ── Business Info ─────────────────────────────────────────────────────────
    doc.setFontSize(16);
    doc.setTextColor(...BLACK);
    doc.text((biz.name as string) ?? "Unknown Business", margin, y);
    y += 7;
    doc.setFontSize(9);
    doc.setTextColor(...GRAY);
    const meta = [biz.business_type, biz.city].filter(Boolean).join("  ·  ");
    if (meta) { doc.text(meta, margin, y); y += 5; }
    if (biz.website) { doc.text(biz.website as string, margin, y); y += 5; }
    if (biz.rating != null) {
      doc.text(`Google Rating: ${(biz.rating as number).toFixed(1)}★${biz.review_count ? `  (${biz.review_count} reviews)` : ""}`, margin, y);
      y += 5;
    }
    y += 8;

    // ── Performance Scores ────────────────────────────────────────────────────
    checkPage(60);
    y = section(doc, "Performance Scores", y);
    y = scoreRow(doc, "Desktop Performance", perfScore, y);
    y = scoreRow(doc, "Mobile Performance",  mobileScore, y);
    y = scoreRow(doc, "SEO",                 seoScore, y);
    y = scoreRow(doc, "UX / Design",         designScore, y);
    y += 6;

    // ── Core Web Vitals ───────────────────────────────────────────────────────
    const hasVitals = desktopAudit || mobileAudit;
    if (hasVitals) {
      checkPage(50);
      y = section(doc, "Core Web Vitals", y);
      for (const [label, audit] of [["Desktop", desktopAudit], ["Mobile", mobileAudit]] as [string, typeof desktopAudit][]) {
        if (!audit) continue;
        doc.setFontSize(9);
        doc.setTextColor(...GRAY);
        doc.text(label, 25, y); y += 5;
        for (const [metric, val] of [["FCP", audit.fcp], ["LCP", audit.lcp], ["TBT", audit.tbt], ["CLS", audit.cls]] as [string, string | null][]) {
          doc.setTextColor(...LIGHT);
          doc.text(`  ${metric}:`, 28, y);
          doc.setTextColor(...BLACK);
          doc.text(val ?? "—", 60, y);
          y += 5;
        }
        y += 2;
      }
      y += 4;
    }

    // ── Top Issues ────────────────────────────────────────────────────────────
    if (issues.length > 0) {
      checkPage(40);
      y = section(doc, "Top Design Issues", y);
      doc.setFontSize(9);
      for (const issue of issues.slice(0, 6)) {
        checkPage(20);
        doc.setTextColor(...BLACK);
        doc.text(`• ${issue.title}`, 25, y);
        if (issue.point_deduction) {
          doc.setTextColor(...RED);
          doc.text(`−${issue.point_deduction} pts  [${issue.impact ?? "Medium"}]`, 155, y);
        }
        y += 5;
        doc.setTextColor(...GRAY);
        y = wrapped(doc, issue.detail, 28, y, 155, 4.5);
        y += 3;
      }
      y += 4;
    }

    // ── Generated Pitch ───────────────────────────────────────────────────────
    if (latestPitch) {
      checkPage(40);
      y = section(doc, `Generated Pitch  (${latestPitch.tone ?? "professional"} tone)`, y);
      if (latestPitch.subject) {
        doc.setFontSize(9);
        doc.setTextColor(...BLACK);
        doc.text(`Subject: ${latestPitch.subject}`, 25, y);
        y += 7;
      }
      doc.setFontSize(8.5);
      doc.setTextColor(...GRAY);
      y = wrapped(doc, latestPitch.body ?? "", 25, y, 160, 4.8);
      y += 6;
    }

    // ── Footer ────────────────────────────────────────────────────────────────
    const totalPages = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7.5);
      doc.setTextColor(...LIGHT);
      doc.text("Powered by Nearsited — AI Redesign Opportunity Intelligence", margin, 290);
      doc.text(`Page ${i} of ${totalPages}`, 190, 290, { align: "right" });
    }

    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${((biz.name as string) ?? "business").replace(/[^a-zA-Z0-9]/g, "-")}-audit.pdf"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (error) {
    console.error("[PDF] Generation error:", error);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
