/**
 * Build a concise client call summary from available data.
 */
export function buildClientCallSummary(
  businessName: string,
  businessType: string,
  city: string | null | undefined,
  overallScore: number,
  projScore: number,
  opportunityDelta: number,
  topIssues: { title: string; detail: string; impact: string }[],
  mobilePerf: number | null,
  desktopPerf: number | null,
  rating: number | null,
  reviewCount: number | null,
) {
  const delta = Math.max(0, projScore - overallScore);
  const ratingStr = rating != null && reviewCount != null
    ? `\n• Rating: ${rating.toFixed(1)}★ (${reviewCount} reviews)`
    : "";

  const perfStr = mobilePerf != null && desktopPerf != null
    ? `\n• Performance: Mobile ${mobilePerf}/100 · Desktop ${desktopPerf}/100`
    : mobilePerf != null
      ? `\n• Performance: ${mobilePerf}/100`
      : "";

  const risks = topIssues.slice(0, 3).map((i) => i.title).join(", ");
  const scope = topIssues.length > 0
    ? `Fix "${topIssues[0].title}" as priority, then address ${topIssues.slice(1, 3).map((i) => `"${i.title}"`).join(" and ")}.`
    : "Run an analysis to identify improvement areas.";

  return [
    `━━ Current Situation ━━`,
    `${businessName} — ${businessType}${city ? ` in ${city}` : ""}${ratingStr}${perfStr}`,
    `Overall score: ${overallScore}/100`,
    ``,
    `━━ Opportunity ━━`,
    `Potential score: ${projScore}/100 (+${delta} pts)`,
    ``,
    `━━ Risks ━━`,
    risks || "No critical issues identified.",
    ``,
    `━━ Suggested Scope ━━`,
    scope,
  ].join("\n");
}
