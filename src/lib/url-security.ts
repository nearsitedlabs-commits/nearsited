/**
 * URL validation and security utilities.
 *
 * Provides SSRF protection and safe URL rendering helpers.
 */

/**
 * Validates that a URL is safe to fetch (SSRF protection).
 * Returns the validated URL object or null if invalid.
 *
 * Used by contact-info route before scraping external websites.
 */
export async function validateUrl(url: string): Promise<URL | null> {
  try {
    const parsed = new URL(url);
    // Only allow HTTP(S) protocols
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    // Block private/reserved IP ranges (basic SSRF protection)
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname === "[::1]" ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal") ||
      /^10\.\d+\.\d+\.\d+$/.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/.test(hostname) ||
      /^192\.168\.\d+\.\d+$/.test(hostname)
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Validates that a URL string is safe to use as an anchor href.
 * Prevents javascript:, data:, vbscript: protocol injection.
 *
 * Usage in components:
 *   <a href={safeHref(website) || "#"}>{website}</a>
 */
export function safeHref(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return url;
    }
    return null;
  } catch {
    // If it doesn't have a protocol, assume https
    if (url.includes(".") && !url.startsWith("javascript:") && !url.startsWith("data:")) {
      return `https://${url}`;
    }
    return null;
  }
}
