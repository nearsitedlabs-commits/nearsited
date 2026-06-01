import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { jsPDF } from "jspdf";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");

    if (!businessId) {
      return NextResponse.json({ error: "Missing businessId" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Fetch business
    const { data: biz } = await supabase
      .from("businesses")
      .select("*")
      .eq("id", businessId)
      .eq("user_id", user.id)
      .single();

    if (!biz) return NextResponse.json({ error: "Business not found" }, { status: 404 });

    // Fetch latest audit and design analysis
    const { data: audits } = await supabase
      .from("audits")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(2);

    const { data: designs } = await supabase
      .from("design_analyses")
      .select("*")
      .eq("business_id", businessId)
      .order("analyzed_at", { ascending: false })
      .limit(2);

    const mobileAudit = (audits ?? []).find((a) => a.strategy === "mobile");
    const desktopAudit = (audits ?? []).find((a) => a.strategy === "desktop");
    const mobileDesign = (designs ?? []).find((a) => a.strategy === "mobile");

    // Generate PDF
    const doc = new jsPDF({ format: "a4" });
    let y = 20;

    // Title
    doc.setFontSize(22);
    doc.setTextColor(138, 151, 119); // sage accent — #8A9777
    doc.text("Nearsited Audit Report", 20, y);
    y += 10;

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`, 20, y);
    y += 16;

    // Business info
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(biz.name ?? "Unknown Business", 20, y);
    y += 7;
    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.text([`${biz.business_type ?? ""}  ·  ${biz.city ?? ""}`, biz.website ?? ""], 20, y);
    y += 14;

    // Scores
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("Performance Scores", 20, y);
    y += 8;

    const perfScore = desktopAudit?.performance_score ?? mobileAudit?.performance_score ?? 0;
    const seoScore = desktopAudit?.seo_score ?? 0;
    const mobileScore = mobileAudit?.performance_score ?? 0;
    const designScore = mobileDesign?.design_score ?? biz.design_score ?? 0;

    doc.setFontSize(10);
    const scores = [
      ["Performance", `${perfScore}/100`],
      ["SEO", `${seoScore}/100`],
      ["Mobile", `${mobileScore}/100`],
      ["Design", `${designScore}/100`],
    ];

    for (const [label, val] of scores) {
      doc.text(`${label}: ${val}`, 25, y);
      y += 6;
    }
    y += 8;

    // Issues
    const issues = (mobileDesign?.issues ?? []) as { title: string; detail: string; point_deduction?: number; impact?: string }[];
    if (issues.length > 0) {
      doc.setFontSize(14);
      doc.text("Top Issues", 20, y);
      y += 8;
      doc.setFontSize(9);
      for (const issue of issues.slice(0, 5)) {
        doc.setTextColor(0, 0, 0);
        doc.text(`• ${issue.title}`, 25, y);
        y += 5;
        doc.setTextColor(100);
        const detail = issue.detail.length > 80 ? issue.detail.slice(0, 77) + "..." : issue.detail;
        doc.text(`  ${detail}`, 25, y);
        y += 5;
        if (issue.point_deduction) {
          doc.setTextColor(220, 38, 38);
          doc.text(`  -${issue.point_deduction} points  [${issue.impact ?? "Medium"}]`, 25, y);
          y += 5;
        }
        y += 3;
      }
    }

    y += 8;

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("Powered by Nearsited — AI Redesign Opportunity Intelligence", 20, 285);

    // Get PDF as buffer
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${(biz.name ?? "business").replace(/[^a-zA-Z0-9]/g, "-")}-audit.pdf"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (error) {
    console.error("[PDF] Generation error:", error);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
