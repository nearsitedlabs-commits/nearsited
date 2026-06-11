export type PreCallBriefSections = {
  hook: string;
  pain: string;
  scope: string;
  objection: string;
};

export function buildPreCallBriefSections(
  businessName: string,
  businessType: string,
  city: string | null | undefined,
  overallScore: number,
  projScore: number,
  topIssues: { title: string; detail: string; impact: string }[],
  mobilePerf: number | null,
  desktopPerf: number | null,
  rating: number | null,
  reviewCount: number | null,
): PreCallBriefSections {
  const delta = Math.max(0, projScore - overallScore);

  const hook = rating != null && reviewCount != null && reviewCount > 10
    ? `${rating.toFixed(1)}★ with ${reviewCount.toLocaleString()} reviews — the reputation is there, but the digital presence isn't matching it.`
    : overallScore < 50
      ? `${businessName} is scoring ${overallScore}/100 — customers searching online may not be finding them at all.`
      : `${businessName} has a web presence but measurable issues that are costing them leads.`;

  const perfLine = mobilePerf != null && desktopPerf != null
    ? `Mobile ${mobilePerf}/100, desktop ${desktopPerf}/100.`
    : mobilePerf != null ? `Performance ${mobilePerf}/100.` : "";
  const issueList = topIssues.slice(0, 3).map((i) => `"${i.title}"`).join(", ");
  const pain = [perfLine, issueList ? `Top issues: ${issueList}.` : ""].filter(Boolean).join(" ")
    || `Current score ${overallScore}/100 — clear improvements are possible.`;

  const perIssue = topIssues.length > 0 && delta > 0 ? Math.round(delta / topIssues.length) : 5;
  const scope = topIssues.length > 0
    ? `Priority fix: ${topIssues[0].title} (~+${perIssue} pts). Full scope: address top 3 issues to reach ~${projScore}/100.`
    : `A full audit and redesign would bring the score from ${overallScore} to an estimated ${projScore}/100.`;

  const objection = overallScore >= 70
    ? `"Our site is fine." — It looks fine, but ${city ? `in ${city}` : "in this market"} competitors are investing. Good today means losing ground tomorrow.`
    : `"We already have a website." — Having one is not the same as it working for you. Right now it's costing leads, not generating them.`;

  return { hook, pain, scope, objection };
}

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
