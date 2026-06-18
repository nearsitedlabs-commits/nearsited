/**
 * ScreenshotCore integration for full-page screenshots.
 *
 * The ScreenshotCore API key (`SCREENSHOT_API_KEY`) is transmitted as the
 * `access_key` URL query parameter. ScreenshotCore does **not** support
 * header-based authentication (`x-api-key`), so the key is passed in the
 * URL. This is a known limitation of the ScreenshotCore API.
 *
 * # Security note
 * Because the key appears in the URL, it may be visible in server access logs
 * (Nginx, Vercel, etc.) and intermediary proxy / load-balancer logs. If
 * ScreenshotCore adds header-based auth in the future, prefer that over the
 * query-parameter approach to keep keys out of log files.
 */

// ── Constants ──────────────────────────────────────────────────────────────────

/**
 * ScreenshotCore API: https://screenshotcore.com/api/v1/screenshot
 *
 * Parameters used:
 * - url, viewport_width, viewport_height, format, access_key
 * - block_ads: blocks ad content that might interfere
 * - delay: ms to wait AFTER page load for JS hydration (Next.js SPAs need this)
 * - scroll_to: we use "body" to ensure full page is rendered
 *
 * Known limitation: JS-heavy sites (Next.js, React SPAs) need longer delays
 * to fully hydrate and render content. The 30s timeout + 5s delay gives
 * most sites enough time.
 *
 * Some sites block headless browser user agents. We use a real Chrome UA
 * string to reduce the chance of being blocked.
 */
export const SCREENSHOTCORE_URL = "https://screenshotcore.com/api/v1/screenshot";

export const SCREENSHOT_TIMEOUT_MS = 30_000;

/** Delay in ms AFTER initial page load to allow JavaScript hydration. */
export const SCREENSHOT_DELAY_MS = 5_000;

/** Real Chrome user-agent to avoid headless browser detection. */
export const SCREENSHOT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

export const MOBILE_VIEWPORT = { width: 390, height: 844 };
export const DESKTOP_VIEWPORT = { width: 1440, height: 900 };

// ── Types ──────────────────────────────────────────────────────────────────────

export type ScreenshotResult =
  | { ok: true; base64: string }
  | { ok: false; error: string; status: number | null };

// ── Screenshot function ───────────────────────────────────────────────────────

/**
 * Take a full-page screenshot via ScreenshotCore and return base64-encoded PNG bytes.
 *
 * The API key is sent as the `access_key` URL query parameter. See the
 * module-level doc comment above for security implications.
 */
export async function takeScreenshot(
  url: string,
  viewport: { width: number; height: number },
  accessKey: string,
): Promise<ScreenshotResult> {
  const params = new URLSearchParams({
    url,
    viewport_width: String(viewport.width),
    viewport_height: String(viewport.height),
    format: "png",
    block_ads: "true",
    block_cookie_banners: "true",
    delay: String(SCREENSHOT_DELAY_MS),
    scroll_to: "body",
    user_agent: SCREENSHOT_USER_AGENT,
    access_key: accessKey,
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
