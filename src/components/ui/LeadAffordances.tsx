"use client";

import { ExternalLink, MapPin, Phone } from "lucide-react";

// ── Helpers ────────────────────────────────────────────────────────────────────

export function getLeadWebUrl(websiteStatus: string, website: string | null | undefined): string | null {
  if (!website) return null;
  if (websiteStatus === "no_website" || websiteStatus === "unknown") return null;
  if (!website.startsWith("http")) return `https://${website}`;
  return website;
}

function buildMapsUrl(address: string | null | undefined, name: string, city?: string | null): string {
  const query = address ?? [name, city].filter(Boolean).join(" ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

// ── LeadNameLink ───────────────────────────────────────────────────────────────

/**
 * Business name — linked to the external web property when one exists,
 * plain text for no_website / unknown leads. Never links to our own app.
 */
export function LeadNameLink({
  name,
  websiteStatus,
  website,
  className = "",
}: {
  name: string;
  websiteStatus: string;
  website: string | null | undefined;
  className?: string;
}) {
  const externalUrl = getLeadWebUrl(websiteStatus, website);

  if (!externalUrl) {
    return (
      <span dir="auto" className={`text-[var(--color-text-primary)] ${className}`}>
        {name}
      </span>
    );
  }

  return (
    <a
      href={externalUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={`inline-flex items-start gap-0.5 text-[var(--color-text-primary)] [@media(hover:hover)]:hover:underline underline-offset-2 ${className}`}
      aria-label={`Open ${name} website`}
    >
      <span dir="auto" className="break-words">{name}</span>
      <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 text-[var(--color-text-tertiary)]" aria-hidden="true" />
    </a>
  );
}

// ── LeadAffordanceIcons ────────────────────────────────────────────────────────

/**
 * Compact icon row for map + phone affordances.
 * - Map pin: always rendered, opens Google Maps in a new tab.
 * - Phone: rendered only when phone is truthy.
 *   On touch devices: tel: link (native call). On desktop: copies to clipboard.
 *
 * compact=true: 28×28px containers (table rows, tight spaces).
 * compact=false (default): 44×44px on mobile, 32×32px on sm+.
 *
 * Wrap in an onClick-stopPropagation container when inside a clickable card.
 */
export function LeadAffordanceIcons({
  name,
  address,
  city,
  phone,
  onPhoneCopied,
  compact = false,
}: {
  name: string;
  address: string | null | undefined;
  city?: string | null;
  phone: string | null | undefined;
  onPhoneCopied?: (msg: string) => void;
  compact?: boolean;
}) {
  const mapsUrl = buildMapsUrl(address, name, city);

  function handlePhoneClick(e: React.MouseEvent) {
    e.stopPropagation();
    const isTouchDevice = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
    if (isTouchDevice) return; // allow tel: href to proceed natively
    e.preventDefault();
    if (phone) {
      navigator.clipboard.writeText(phone).then(() => {
        onPhoneCopied?.("Phone copied to clipboard");
      });
    }
  }

  const btn = compact
    ? "flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-text-tertiary)] transition-colors duration-150 [@media(hover:hover)]:hover:text-[var(--color-text-primary)] [@media(hover:hover)]:hover:bg-[var(--color-bg-elevated)] active:text-[var(--color-text-primary)]"
    : "flex h-11 w-11 sm:h-8 sm:w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-text-tertiary)] transition-colors duration-150 [@media(hover:hover)]:hover:text-[var(--color-text-primary)] [@media(hover:hover)]:hover:bg-[var(--color-bg-elevated)] active:text-[var(--color-text-primary)]";

  return (
    <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open in Maps"
        title="Open in Maps"
        onClick={(e) => e.stopPropagation()}
        className={btn}
      >
        <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
      </a>

      {phone && (
        <a
          href={`tel:${phone}`}
          aria-label={`Call ${phone}`}
          title={`Call ${phone}`}
          onClick={handlePhoneClick}
          className={btn}
        >
          <Phone className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      )}
    </div>
  );
}
