import { NextRequest, NextResponse } from "next/server";

/**
 * CSP violation report endpoint.
 *
 * Browsers POST a JSON body to this endpoint when a Content Security Policy
 * violation occurs. The payload follows the CSP report format:
 *   https://www.w3.org/TR/CSP3/#violation-reports
 *
 * This endpoint logs violations for monitoring and debugging. In production,
 * consider forwarding reports to a dedicated service (e.g., Sentry, Report URI).
 *
 * Security: This endpoint is intentionally unauthenticated — CSP reports must
 * be accepted from any origin (the browser sends them when a page's CSP is
 * violated, regardless of the page's origin). Reports contain no sensitive data
 * beyond the violated directive and the blocked resource URL.
 */
export async function POST(request: NextRequest) {
  try {
    const report = await request.json();

    // Extract the most useful fields for alerting
    const cspReport = report?.["csp-report"] ?? report;
    const blockedUri = cspReport?.["blocked-uri"] ?? "unknown";
    const violatedDirective = cspReport?.["violated-directive"] ?? "unknown";
    const documentUri = cspReport?.["document-uri"] ?? "unknown";
    const effectiveDirective = cspReport?.["effective-directive"] ?? "unknown";

    console.warn(
      "[CSP] Violation reported:",
      JSON.stringify({
        blockedUri,
        violatedDirective,
        effectiveDirective,
        documentUri,
        timestamp: new Date().toISOString(),
      }),
    );
  } catch {
    // Malformed report bodies are silently ignored
    console.warn("[CSP] Received malformed violation report");
  }

  // Always return 204 (no content) — the browser doesn't care about the response
  return new NextResponse(null, { status: 204 });
}
