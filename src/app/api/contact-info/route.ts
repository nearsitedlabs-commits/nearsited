import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
 * Phone numbers come from Google Places API (discovery), not website scraping.
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");

    if (!businessId) {
      return NextResponse.json({ error: "Missing businessId parameter" }, { status: 400 });
    }

    // Auth
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch business — ensure user owns it
    // Use * to handle columns that may not exist yet (contact_info)
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("*")
      .eq("id", businessId)
      .eq("user_id", user.id)
      .single();

    if (bizError || !business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Try to read cached contact_info (may not exist in DB yet)
    let cachedContact: ContactInfo = { email: null, phone: null, scraped_at: null };
    try {
      const raw = (business as Record<string, unknown>).contact_info;
      if (raw && typeof raw === "object") {
        cachedContact = raw as ContactInfo;
      }
    } catch {
      // column may not exist — that's fine
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

    // Scrape website for email only (phone comes from Google Places via discover route)
    let scrapedEmail: string | null = null;

    const bizWebsite = (business as Record<string, unknown>).website as string | null;
    if (bizWebsite) {
      scrapedEmail = await scrapeWebsiteForEmail(bizWebsite);
    }

    // Phone comes from Google Places API — stored in businesses.phone by discover route
    const bizPhone = (business as Record<string, unknown>).phone as string | null;
    const merged: ContactInfo = {
      email: scrapedEmail ?? cachedContact.email ?? null,
      phone: bizPhone ?? cachedContact.phone ?? null,
      scraped_at: new Date().toISOString(),
    };

    // Cache the result (fire-and-forget — don't block response)
    import("@/lib/supabase/admin").then(({ createAdminClient }) => {
      const adminClient = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (adminClient.from("businesses") as any).update({ contact_info: merged }).eq("id", businessId).then().catch(() => {});
    });

    return NextResponse.json(merged);
  } catch (error) {
    console.error("[CONTACT-INFO] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
