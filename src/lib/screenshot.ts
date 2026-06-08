/**
 * ScreenshotCore integration for full-page screenshots.
 */

// ── Constants ──────────────────────────────────────────────────────────────────

export const SCREENSHOTCORE_URL = "https://screenshotcore.com/api/v1/screenshot";

export const SCREENSHOT_TIMEOUT_MS = 15_000;

export const MOBILE_VIEWPORT = { width: 390, height: 844 };
export const DESKTOP_VIEWPORT = { width: 1440, height: 900 };

// ── Types ──────────────────────────────────────────────────────────────────────

export type ScreenshotResult =
  | { ok: true; base64: string }
  | { ok: false; error: string; status: number | null };

// ── Screenshot function ───────────────────────────────────────────────────────

/** Take a full-page screenshot via ScreenshotCore and return base64-encoded PNG bytes. */
export async function takeScreenshot(
  url: string,
  viewport: { width: number; height: number },
  accessKey: string,
): Promise<ScreenshotResult> {
  const params = new URLSearchParams({
    url,
    access_key: accessKey,
    viewport_width: String(viewport.width),
    viewport_height: String(viewport.height),
    format: "png",
    block_ads: "true",
    block_cookie_banners: "true",
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SCREENSHOT_TIMEOUT_MS);

  try {
    const response = await fetch(`${SCREENSHOTCORE_URL}?${params}`, {
      signal: controller.signal,
    });

    console.log(
      `[SCREENSHOT] ScreenshotCore (${viewport.width}w) HTTP status:`,
      response.status,
    );

    if (!response.ok) {
      // ScreenshotCore returns proper HTTP status codes with a JSON error body.
      let errorMsg = `Screenshot failed with HTTP ${response.status}`;
      try {
        const json = await response.json() as { error?: string; code?: string };
        if (json.error) errorMsg = json.error;
        console.error("[SCREENSHOT] ScreenshotCore error", {
          status: response.status,
          code: json.code,
          error: json.error,
          url,
          viewport: viewport.width,
        });
      } catch {
        console.error("[SCREENSHOT] ScreenshotCore HTTP error", {
          status: response.status,
          url,
          viewport: viewport.width,
        });
      }
      return { ok: false, error: errorMsg, status: response.status };
    }

    const arrayBuffer = await response.arrayBuffer();

    if (arrayBuffer.byteLength < 100) {
      return { ok: false, error: "Screenshot unavailable — empty response", status: response.status };
    }

    const base64 = Buffer.from(arrayBuffer).toString("base64");
    return { ok: true, base64 };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const isAbort = err instanceof DOMException && err.name === "AbortError";
    return { ok: false, error: isAbort ? "Screenshot timed out" : message, status: null };
  } finally {
    clearTimeout(timeout);
  }
}
