/**
 * Pitch prompt templates and helpers.
 *
 * Extracted from src/app/api/pitch/route.ts to reduce monolith size.
 * Contains all prompt-building logic for Gemini-based pitch generation.
 */

// ── Industry-Specific Context ──────────────────────────────────────────────────

export function getBusinessTypeContext(businessType: string): string {
  const t = businessType.toLowerCase();
  if (/restaurant|cafe|bakery|pizza|sushi|food|bar|coffee|deli|bistro|steakhouse|seafood|catering/.test(t))
    return "Customers search 'near me' when hungry or planning meals. Online presence drives foot traffic, reservations, and delivery orders. Key owner concerns: showing up in Google Maps, displaying the menu attractively, collecting reviews, and enabling online bookings.";
  if (/salon|barbershop|nail|spa|massage|beauty|waxing|lash|threading|microblading|makeup|aesthet|laser clinic/.test(t))
    return "Clients choose providers almost entirely based on visual presentation and social proof. Key concerns: online booking convenience, portfolio/gallery presentation, review management, appearing in 'near me' searches. A weak website loses bookings to competitors with better-presented work.";
  if (/gym|yoga|pilates|crossfit|fitness|boxing|martial|dance|cycling|spin|climbing|tennis|golf/.test(t))
    return "New members research online before ever visiting. Key concerns: membership/trial signup flow, class schedule clarity, trainer bios, community feel, and 'near me' local search visibility. Most sign-up decisions happen on the website.";
  if (/dentist|doctor|gp|clinic|physio|chiropractor|optician|dermatolog|orthodont|pediatric|audiolog|speech|occupational|fertility|radiology|lab|nursing|urgent care/.test(t))
    return "Patients choose healthcare providers based on trust, credentials, and convenience. Key concerns: online appointment booking, credential display, patient testimonials, insurance information clarity, and Google Maps visibility for 'near me' health searches.";
  if (/vet|animal|pet groom|pet board|dog train|dog daycare/.test(t))
    return "Pet owners are deeply protective and research thoroughly. Key concerns: trust signals (photos, credentials, meet-the-team), booking convenience, clear service descriptions, and reviews from fellow pet owners. First impression online is critical.";
  if (/lawyer|law firm|attorney|solicitor|legal|notary|patent/.test(t))
    return "Prospective clients research extensively before reaching out to any legal professional. Key concerns: practice area clarity, case results and testimonials, approachability, contact form accessibility, and ranking for local legal search queries.";
  if (/hotel|hostel|resort|motel|b&b|bed and breakfast|boutique hotel|serviced apartment|holiday rental/.test(t))
    return "Travellers compare options across multiple sites before booking. Key concerns: direct booking conversion (reducing OTA commission), room photography quality, local attraction content, trust signals, and competing with Booking.com and Airbnb listings.";
  if (/real estate|estate agent|property|mortgage|letting/.test(t))
    return "Buyers and sellers choose agents based on market expertise and trust. Key concerns: property listing presentation, lead capture (valuation requests, viewing bookings), local market authority content, and testimonials from past clients.";
  if (/web design|digital marketing|seo|social media agency|branding|content marketing|ppc|ux design|graphic design|copywriting|app develop|software|it support|ecommerce agency|cybersecurity/.test(t))
    return "Potential clients judge the agency's own website as evidence of their quality. Key concerns: portfolio and case study presentation, clear service definitions, organic lead generation, demonstrating results, and standing out from commodity competitors.";
  if (/clothing|shoe|jewel|boutique|retail|store|shop|furniture|electronics|hardware|bicycle|outdoor|baby|music store|art supply|phone shop|computer|thrift|grocery|wine shop|home decor/.test(t))
    return "Shoppers discover local retail online before visiting or buying. Key concerns: product discoverability, local SEO for 'near me' searches, opening hours and location prominence, online catalogue or e-commerce capability, and Google Shopping presence.";
  if (/plumber|electrician|hvac|air condition|carpenter|handyman|pest control|locksmith|roofing|landscap|window clean|pool|solar|appliance|moving|security|flooring|gutter|contractor|builder|mason|demolition|surveyor|tiling/.test(t))
    return "Homeowners search urgently and often on mobile. Key concerns: instant quote/estimate request, clear service area, emergency availability, licenses and insurance credentials, and reviews from verified local customers. Speed of contact and trust signals win jobs.";
  if (/school|tutor|coaching|education|academy|bootcamp|cooking class|language|driving school|music school|art school|preschool|nursery|daycare|after.school|flight/.test(t))
    return "Parents and students research courses carefully. Key concerns: program and curriculum clarity, instructor credentials, student results and testimonials, enrollment process simplicity, and local SEO for subject + location searches.";
  if (/car dealer|auto repair|car wash|tire|auto parts|motorcycle|car detail|towing|auto glass|car rental|truck|ev charging/.test(t))
    return "Car owners search on mobile in moments of need ('tyre shop near me', 'mechanic near me'). Key concerns: service booking or quote requests, local search visibility, trust signals (certifications, reviews), opening hours prominence, and clear contact options.";
  if (/wedding|event plan|event venue|wedding photo|wedding video|dj|party rental|balloon|photo booth|catering company/.test(t))
    return "Couples and event planners shortlist vendors heavily based on portfolio quality and reviews. Key concerns: gallery/portfolio presentation, package pricing clarity, testimonials, inquiry form accessibility, and ranking for 'wedding photographer [city]' type searches.";
  if (/financial|accountant|tax|bookkeep|payroll|insurance|mortgage broker|investment|currency|loan/.test(t))
    return "Clients choose financial professionals based on trust, credentials, and clarity of services. Key concerns: clear service explanation, regulatory credential display, client testimonials, lead capture (consultation booking), and local search visibility.";
  return "Customers increasingly find and evaluate local businesses online before making contact. Key concerns: local search visibility, trust building through reviews and professional presentation, lead/inquiry capture, and mobile-first experience since most searches happen on phones.";
}

// ── Opening Styles ─────────────────────────────────────────────────────────────

export function openingInstruction(opening: string): string {
  switch (opening) {
    case "question":
      return "Open with a single thought-provoking question that makes the reader pause and think about what they might be missing. The question should feel personal and specific, not generic.";
    case "empathy":
      return "Open by acknowledging something genuinely positive about their business — a real observation (their rating, their location, their social presence) — before pivoting to the opportunity.";
    case "data":
      return "Open with the single most striking specific finding you have. Lead with a concrete fact or observation that immediately signals you've actually looked at their business.";
    default: // direct
      return "Get straight to the point. Open directly with the core problem or missed opportunity — no preamble, no flattery.";
  }
}

// ── Urgency ────────────────────────────────────────────────────────────────────

export function urgencyInstruction(urgency: string): string {
  switch (urgency) {
    case "high":
      return "Create a genuine sense of urgency — make clear that every day without fixing this is customers going to competitors. Be direct and specific about the cost of inaction. Don't be pushy, but don't soften it either.";
    case "low":
      return "Keep this low-pressure and relaxed. No urgency whatsoever. Frame it as a friendly observation and an easy offer — the reader should feel zero pressure to act immediately.";
    default: // medium
      return "Mention the opportunity cost of waiting once, lightly — don't dwell on it. The reader should feel gently nudged, not pressured.";
  }
}

// ── Pitch Angle ────────────────────────────────────────────────────────────────

export function buildAngle(
  leadType: string,
  performance_score: number | null,
): { angle: string; painPoint: string } {
  switch (leadType) {
    case "has_website":
      if (performance_score !== null && performance_score < 50) {
        return {
          angle: "your site is costing you customers",
          painPoint: `Your website scores just ${performance_score}/100 on performance — that means slow loading, frustrated visitors, and lost leads. Here's the proof.`,
        };
      }
      if (performance_score !== null && performance_score <= 69) {
        return {
          angle: "real potential held back by fixable issues",
          painPoint: `Your site has decent bones (${performance_score}/100), but specific issues are dragging down conversions. We've identified exactly what's fixable.`,
        };
      }
      return {
        angle: "solid site with specific wins worth chasing",
        painPoint: `Your site performs well (${performance_score ?? "N/A"}/100), but we've spotted targeted improvements that could push it further ahead of competitors.`,
      };
    case "no_website":
      return {
        angle: "no web presence — you're invisible online",
        painPoint: "You don't have a website. Every potential customer who searches for your business finds nothing — or worse, finds a competitor.",
      };
    case "social_only":
      return {
        angle: "Facebook isn't a website",
        painPoint: "Your business relies on social media alone. But social profiles don't rank in Google, don't build trust like a proper site, and leave money on the table every day.",
      };
    case "platform_only":
      return {
        angle: "you're renting space on someone else's platform",
        painPoint: "You're listed on a booking/delivery directory, but you don't own the relationship with those customers. A real website changes that.",
      };
    default:
      return {
        angle: "let's talk about your web presence",
        painPoint: "We'd love to show you what a proper website could do for your business.",
      };
  }
}

// ── Channel Formatting ─────────────────────────────────────────────────────────

export function channelInstruction(
  channel: string,
  tone: string,
  length: string,
  businessName: string,
): string {
  switch (channel) {
    case "whatsapp":
      return `OUTREACH CHANNEL: WhatsApp Message
FORMAT: Very short message under ${{ short: "40", medium: "60", detailed: "80" }[length] ?? "60"} words.
STYLE: Casual and direct. No formatting, no line breaks. Write like a text message.
No formal greetings or sign-offs. Get straight to the point.
End with a simple question to keep the conversation going.

Return ONLY a valid JSON object, no markdown, no backticks:
{ "subject": "WhatsApp", "body": "your whatsapp message here" }`;
    default: // email
      return `OUTREACH CHANNEL: Email
FORMAT: Subject line + body. ${{ short: "Keep the email under 80 words.", medium: "Keep the email under 150 words.", detailed: "Write a detailed email up to 250 words." }[length] ?? "Keep the email under 150 words."}
${businessName !== "there" ? `Start with: Hi ${businessName} team,` : "Start with: Hi there,"}

Return ONLY a valid JSON object, no markdown, no backticks:
{ "subject": "email subject line here", "body": "full email body here" }`;
  }
}

// ── Workflow-Specific Prompts ──────────────────────────────────────────────────

export function buildWorkflowPrompt(
  businessName: string,
  businessType: string,
  location: string,
  workflow: string,
  socialPlatforms: string[],
  tone: string,
  length: string,
  channel: string,
  rating: number | null,
  reviewCount: number | null,
  opening: string,
  urgency: string,
  focus: string | undefined,
): string {
  const reviewStr = rating != null && reviewCount != null
    ? `\nGoogle reviews: ${rating.toFixed(1)}★ (${reviewCount.toLocaleString()} reviews)`
    : rating != null
      ? `\nGoogle Rating: ${rating.toFixed(1)}★`
      : reviewCount != null
        ? `\nGoogle reviews: ${reviewCount.toLocaleString()}`
        : "";
  const platformStr = socialPlatforms.length > 0 ? socialPlatforms.join(", ") : "social media";
  const channelFmt = channel === "whatsapp" ? "WhatsApp message" : "email";

  const sharedConfig = `Tone: ${tone} (professional = concise and confident; friendly = warm and approachable; luxury = polished and premium)
${{ short: "Keep it under 80 words.", medium: "Keep it under 150 words.", detailed: "Write up to 250 words." }[length] ?? "Keep it under 150 words."}
Industry context: ${getBusinessTypeContext(businessType)}
Opening style: ${openingInstruction(opening)}
Urgency: ${urgencyInstruction(urgency)}${focus && focus !== "all" ? `\nFocus particularly on: ${focus}.` : ""}`;

  if (workflow === "social_only") {
    return `You are a web agency sales consultant writing outreach ${channelFmt}s. The prospect has an active social media presence but no dedicated website.

Business: ${businessName}
Type: ${businessType}
Location: ${location}
Detected social platforms: ${platformStr}${reviewStr}

Your job is to acknowledge their social media success first, then explain what a website would add that social alone cannot provide.

${sharedConfig}

CRITICAL RULES:
- Follow the opening style instruction above exactly.
- Tailor language and examples specifically for a ${businessType} owner.
- Start by acknowledging their social presence positively.
- Explain that a website adds credibility, search visibility, and lead capture that social platforms can't replace.
- NEVER mention audits, performance scores, SEO scores, LCP, FCP, CLS, TBT, or any technical metrics.
- NEVER mention website issues or problems with their current social presence.
- Focus on the ADDITIONAL value a website provides, not problems with what they have.
- Address the recipient directly.
- End with a soft CTA: offer to discuss how a website could complement their social presence.
- No fluff, no buzzwords, no generic compliments.
- Write like a real person, not a template.

${channelInstruction(channel, tone, length, businessName)}`;
  }

  // no_digital_presence
  return `You are a web agency sales consultant writing outreach ${channelFmt}s. The prospect has no detectable online presence — no website and no social media profiles.

Business: ${businessName}
Type: ${businessType}
Location: ${location}${reviewStr}

Your job is to help them understand the importance of having an online presence in today's market.

${sharedConfig}

CRITICAL RULES:
- Follow the opening style instruction above exactly.
- Tailor language and examples specifically for a ${businessType} owner.
- Focus on visibility, credibility, and lead generation opportunities relevant to their industry.
- Explain that many customers search online before making purchasing decisions.
- NEVER mention audits, performance scores, SEO scores, or any technical metrics.
- NEVER mention website issues since there is no website.
- Be constructive and positive — frame this as an opportunity to establish their digital presence.
- Address the recipient directly.
- End with a soft CTA: offer to discuss how they can establish an online presence.
- No fluff, no buzzwords, no generic compliments.
- Write like a real person, not a template.

${channelInstruction(channel, tone, length, businessName)}`;
}

// ── Full Prompt (Audit + Design) ──────────────────────────────────────────────

export function buildFullPrompt(
  websiteSection: string,
  businessType: string,
  location: string,
  reviewContext: string,
  leadType: string,
  angle: string,
  painPoint: string,
  auditContext: string,
  designContext: string,
  config: string,
  channel: string,
  tone: string,
  length: string,
  businessName: string,
): string {
  return `You are a web agency sales consultant writing outreach emails that sound like a real human agency owner wrote them. Your job is to translate technical website issues into business problems the prospect cares about.

${websiteSection}
Type: ${businessType}
Location: ${location}${reviewContext}
Website status: ${leadType}
Angle: ${angle}
Pain point summary: ${painPoint}

Data we have:
${auditContext}
${designContext}

${config}

CRITICAL RULES:
- Follow the opening style instruction above exactly for the first sentence.
- Tailor language and examples specifically for a ${businessType} owner — use industry-relevant pain points.
- Write like a real agency owner, NOT like a developer or auditor.
- NEVER list raw technical metrics (scores, LCP, TBT, CLS, PageSpeed numbers). Instead describe the BUSINESS IMPACT.
- Example of what NOT to write: "Your LCP is 4.2s and your TBT is 340ms."
- Example of what TO write: "Your website is loading slowly on phones — visitors are clicking away before seeing your content. That's lost customers every day."
- Address the recipient directly.
- Reference one specific observation from the analysis, framed as a business problem.
- Never sound like a template — make it feel personal and specific to their situation.
- End with a soft CTA: offer a free audit report or a quick call to discuss findings.
- No fluff, no buzzwords, no generic compliments.
- Keep it short and conversational — like a real person wrote it in 2 minutes.

${channelInstruction(channel, tone, length, businessName)}`;
}

// ── Audit-Only Prompt ─────────────────────────────────────────────────────────

export function buildAuditOnlyPrompt(
  websiteSection: string,
  businessType: string,
  location: string,
  reviewContext: string,
  leadType: string,
  angle: string,
  painPoint: string,
  auditContext: string,
  config: string,
  channel: string,
  tone: string,
  length: string,
  businessName: string,
): string {
  return `You are a web agency sales consultant writing outreach emails that sound like a real human agency owner wrote them. Your job is to translate performance issues into business problems the prospect cares about.

${websiteSection}
Type: ${businessType}
Location: ${location}${reviewContext}
Website status: ${leadType}
Angle: ${angle}
Pain point summary: ${painPoint}

NOTE: This lead has performance audit only — no design analysis yet. Focus exclusively on performance issues.

Performance data:
${auditContext}

${config}

CRITICAL RULES:
- Follow the opening style instruction above exactly for the first sentence.
- Tailor language and examples specifically for a ${businessType} owner.
- Write like a real agency owner, NOT like a developer or auditor.
- NEVER list raw technical metrics (scores, LCP, TBT, CLS, PageSpeed numbers). Instead describe the BUSINESS IMPACT.
- Address the recipient directly.
- Reference the performance issues as a business problem relevant to a ${businessType}.
- Never sound like a template — make it feel personal and specific to their situation.
- End with a soft CTA: offer a free performance review or a quick call to discuss findings.
- No fluff, no buzzwords, no generic compliments.

${channelInstruction(channel, tone, length, businessName)}`;
}

// ── Design-Only Prompt ────────────────────────────────────────────────────────

export function buildDesignOnlyPrompt(
  websiteSection: string,
  businessType: string,
  location: string,
  reviewContext: string,
  leadType: string,
  angle: string,
  painPoint: string,
  designContext: string,
  config: string,
  channel: string,
  tone: string,
  length: string,
  businessName: string,
): string {
  return `You are a web agency sales consultant writing outreach emails that sound like a real human agency owner wrote them. Your job is to translate design issues into business problems the prospect cares about.

${websiteSection}
Type: ${businessType}
Location: ${location}${reviewContext}
Website status: ${leadType}
Angle: ${angle}
Pain point summary: ${painPoint}

NOTE: This lead has design analysis only — no performance audit. Focus exclusively on design issues.

Design data:
${designContext}

${config}

CRITICAL RULES:
- Follow the opening style instruction above exactly for the first sentence.
- Tailor language and examples specifically for a ${businessType} owner.
- Write like a real agency owner, NOT like a developer or auditor.
- NEVER list raw design scores. Instead describe the VISUAL IMPACT on the business.
- Address the recipient directly.
- Reference one specific design issue as a business problem relevant to a ${businessType}.
- Never sound like a template — make it feel personal and specific to their situation.
- End with a soft CTA: offer a free design review or a quick call to discuss findings.
- No fluff, no buzzwords, no generic compliments.

${channelInstruction(channel, tone, length, businessName)}`;
}

export { cleanGeminiJson } from "@/lib/gemini";
