import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api/with-auth";
import { validateUrl } from "@/lib/url-security";
import { createAdminClient } from "@/lib/supabase/admin";
import type { BusinessRow } from "@/lib/db-types";
import { businessIdQuerySchema, contactInfoSchema } from "@/lib/validation";

// ── Types ────────────────────────────────────────────────────────────────────

type ContactInfo = {
  email: string | null;
  phone: string | null;
  scraped_at: string | null;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const FETCH_TIMEOUT_MS = 5_000;

/**
 * Fetch a website's HTML and extract email addresses only.
 */
async function scrapeWebsiteForEmail(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; NearsitedBot/1.0)" },
    });
    clearTimeout(timeout);

    if (!res.ok) return null;

    const html = await res.text();

    // Extract emails from mailto: links and plain text
    const emails = new Set<string>();
    const mailtoMatches = html.match(/mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g);
    if (mailtoMatches) {
      mailtoMatches.forEach((m) => emails.add(m.replace("mailto:", "")));
    }
    const emailMatches = html.match(EMAIL_REGEX);
    if (emailMatches) {
      emailMatches.forEach((e) => {
        if (!e.includes(".png") && !e.includes(".jpg") && !e.includes(".css") && !e.includes(".js")) {
          emails.add(e);
        }
      });
    }

    return emails.size > 0 ? Array.from(emails)[0] : null;
  } catch {
    return null;
  }
}

// ── Route ────────────────────────────────────────────────────────────────────

export const GET = withAuth(async ({ request, user, supabase }) => {
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

  // Fetch business — ensure user owns it
  const { data: business, error: bizError } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", businessId)
    .eq("user_id", user.id)
    .single();

  if (bizError || !business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  // Try to read cached contact_info
  let cachedContact: ContactInfo = { email: null, phone: null, scraped_at: null };
  try {
    const raw = (business as BusinessRow).contact_info;
    if (raw && typeof raw === "object") {
      cachedContact = raw as ContactInfo;
    }
  } catch {
    // column may not exist
  }

  const hasCachedContact = cachedContact.email || cachedContact.phone;
  const scrapedAt = cachedContact.scraped_at ? new Date(cachedContact.scraped_at) : null;
  const isFresh = scrapedAt && (Date.now() - scrapedAt.getTime()) < 30 * 24 * 60 * 60 * 1000;

  if (hasCachedContact && isFresh) {
    return NextResponse.json({
      email: cachedContact.email,
      phone: cachedContact.phone,
      scraped_at: cachedContact.scraped_at,
    });
  }

  // Scrape website for email only
  let scrapedEmail: string | null = null;

  const bizWebsite = (business as BusinessRow).website as string | null;
  if (bizWebsite) {
    const validated = await validateUrl(bizWebsite);
    if (validated) {
      scrapedEmail = await scrapeWebsiteForEmail(validated.href);
    }
  }

  const bizPhone = (business as BusinessRow).phone as string | null;
  const merged: ContactInfo = {
    email: scrapedEmail ?? cachedContact.email ?? null,
    phone: bizPhone ?? cachedContact.phone ?? null,
    scraped_at: new Date().toISOString(),
  };

  // Cache the result (fire-and-forget) with Zod validation
  const parsedContact = contactInfoSchema.safeParse(merged);
  if (parsedContact.success) {
    const adminClient = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    void (adminClient.from("businesses") as any).update({ contact_info: parsedContact.data }).eq("id", businessId);
  } else {
    console.warn("[CONTACT INFO] Skipping cache — validation failed:", parsedContact.error.issues.map((i) => i.message).join(", "));
  }

  return NextResponse.json(merged);
});
