import { NextRequest, NextResponse } from "next/server";
import { anonymousAuditLimiter, checkRateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";

/**
 * POST /api/quick-audit
 *
 * Public endpoint — no auth required.
 * Runs a lightweight PageSpeed audit on any URL and returns partial results.
 * Gated by IP rate limit: 3 requests per week.
 *
 * Visible without signup:
 *   - Overall performance score
 *   - Top 4 highest-impact issues (text only)
 *   - Generic recommendation
 *
 * Full audit (all signals, revenue estimates, pitches) requires signup.
 */

const GOOGLE_PAGESPEED_API = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

interface PageSpeedResult {
  success: boolean;
  score: number | null;
  issues: { title: string; detail: string }[];
  error?: string;
}

async function runPageSpeed(url: string, apiKey: string): Promise<PageSpeedResult> {
  const params = new URLSearchParams();
  params.set("url", url);
  params.set("strategy", "mobile");
  params.append("category", "performance");
  params.append("category", "seo");

  try {
    const res = await fetch(`${GOOGLE_PAGESPEED_API}?${params}&key=${apiKey}`, {
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      return {
        success: false,
        score: null,
        issues: [],
        error: `PageSpeed returned ${res.status}`,
      };
    }

    const data = await res.json();
    const lh = data.lighthouseResult;

    if (!lh) {
      return {
        success: false,
        score: null,
        issues: [],
        error: "No lighthouse result",
      };
    }

    const performanceScore = Math.round((lh.categories.performance?.score ?? 0) * 100);
    const seoScore = Math.round((lh.categories.seo?.score ?? 0) * 100);

    // Extract top issues from key audits
    const keyAudits: Record<string, { label: string; fail: (v: unknown) => boolean }> = {
      "first-contentful-paint": { label: "Slow first paint", fail: (v) => (v as number) > 2500 },
      "largest-contentful-paint": { label: "Slow largest content paint", fail: (v) => (v as number) > 4000 },
      "total-blocking-time": { label: "High blocking time", fail: (v) => (v as number) > 300 },
      "cumulative-layout-shift": { label: "Layout shifts", fail: (v) => (v as number) > 0.25 },
      "interactive": { label: "Slow to become interactive", fail: (v) => (v as number) > 5000 },
      "uses-responsive-images": { label: "Unoptimized images", fail: (v) => v === false },
      "offscreen-images": { label: "Offscreen images slowing load", fail: (v) => v === false },
      "uses-optimized-images": { label: "Images not optimized", fail: (v) => v === false },
      "render-blocking-resources": { label: "CSS/JS blocking render", fail: (v) => (v as number) > 0 },
      "uses-text-compression": { label: "Text compression not enabled", fail: (v) => v === false },
      "viewport": { label: "No viewport meta tag", fail: (v) => v === false },
      "font-display": { label: "Custom fonts block text rendering", fail: (v) => v === false },
      "uses-http2": { label: "Not using HTTP/2", fail: (v) => v === false },
      "no-document-write": { label: "Uses document.write()", fail: (v) => v === false },
      "has-ssl": { label: "No SSL certificate", fail: (v) => v === false },
    };

    const issues: { title: string; detail: string }[] = [];
    const audits = lh.audits ?? {};

    for (const [id, config] of Object.entries(keyAudits)) {
      const audit = audits[id as keyof typeof audits] as { score: number | null; displayValue?: string; title?: string } | undefined;
      if (audit && (audit.score === null || audit.score < 1)) {
        const numericScore = audit.score ?? 0;
        if (config.fail(numericScore) || numericScore < 0.5) {
          issues.push({
            title: config.label,
            detail: audit.displayValue ? `${config.label}: ${audit.displayValue}` : config.label,
          });
        }
      }
      // Check SSL specifically (it's derived, not a LH audit)
      if (id === "has-ssl" && lh.audits["is-on-https"]) {
        const httpsAudit = lh.audits["is-on-https"] as { score: number | null };
        if (httpsAudit && httpsAudit.score !== 1) {
          issues.push({ title: "No SSL certificate", detail: "Site is not served over HTTPS" });
        }
      }
    }

    // Limit to top 6 most impactful issues
    const topIssues = issues.slice(0, 6);

    return {
      success: true,
      score: performanceScore,
      issues: topIssues,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return {
      success: false,
      score: null,
      issues: [],
      error: message.includes("timed out") ? "Request timed out" : message,
    };
  }
}

export async function POST(request: NextRequest) {
  // ── Rate limit by IP ────────────────────────────────────────────────────
  const ipLimit = await checkRateLimit(request, anonymousAuditLimiter, getRateLimitIdentifier(request));
  if (ipLimit) {
    return NextResponse.json(
      { error: "Free scan limit reached (3 per week). Sign up for unlimited audits.", code: "RATE_LIMITED" },
      { status: 429 },
    );
  }

  // ── Parse URL ───────────────────────────────────────────────────────────
  let url: string;
  try {
    const body = await request.json();
    url = (body.url as string)?.trim();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Add https:// if no protocol provided
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = `https://${url}`;
    }

    // Basic URL validation
    new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  // ── Run PageSpeed ───────────────────────────────────────────────────────
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const result = await runPageSpeed(url, apiKey);

  if (!result.success || result.score === null) {
    return NextResponse.json({
      success: false,
      error: result.error ?? "Could not audit this site. Try a different URL.",
    }, { status: 422 });
  }

  // ── Return partial results (public) ────────────────────────────────────
  // Show score + top 4 issues. Gate full audit behind signup.
  const top4 = result.issues.slice(0, 4);

  return NextResponse.json({
    success: true,
    score: result.score,
    scoreLabel: result.score >= 85 ? "Strong" : result.score >= 70 ? "Good" : result.score >= 40 ? "Needs Improvement" : "Poor",
    issues: top4,
    totalIssuesFound: result.issues.length,
    // Intentionally omit: revenue estimates, pitch angles, competitor data, full 14-signal breakdown
  });
}
