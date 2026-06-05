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
