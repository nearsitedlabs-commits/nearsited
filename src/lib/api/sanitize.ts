/**
 * Error sanitisation helpers.
 *
 * Extracted from src/app/api/analyze-design/route.ts.
 */

/**
 * Sanitize an error string to avoid leaking raw API error JSON to the UI.
 * If the error looks like a JSON blob or contains sensitive technical details,
 * replace it with a user-friendly message.
 */
export function sanitizeError(error: string): string {
  const trimmed = error.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return "Screenshot unavailable — the page could not be captured";
  }
  if (trimmed.length > 200) {
    return "Screenshot unavailable — an unexpected error occurred";
  }
  return trimmed;
}

// ── HTML Sanitisation ──────────────────────────────────────────────────────────

/**
 * Escape HTML special characters to prevent XSS.
 *
 * Converts &, <, >, ", and ' to their HTML entity equivalents so the
 * string is safe to render as text content or via dangerouslySetInnerHTML.
 *
 * @example
 *   sanitizeHtml('<script>alert("xss")</script>')
 *   // → "<script>alert("xss")</script>"
 */
export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, "\x26amp;")
    .replace(/</g, "\x26lt;")
    .replace(/>/g, "\x26gt;")
    .replace(/"/g, "\x26quot;")
    .replace(/'/g, "\x26#x27;");
}

/**
 * Strip all HTML tags from a string, leaving only text content.
 * Also normalises whitespace by collapsing runs of spaces into one.
 *
 * Use this BEFORE persisting AI-generated text to the database to
 * ensure no stored content contains HTML markup.
 *
 * @example
 *   stripHtml('<p>Hello <b>world</b></p>')
 *   // → "Hello world"
 */
export function stripHtml(input: string): string {
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/\x26amp;/g, "\x26")
    .replace(/\x26lt;/g, "<")
    .replace(/\x26gt;/g, ">")
    .replace(/\x26quot;/g, '"')
    .replace(/\x26#x27;/g, "'")
    .replace(/\x26#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}
