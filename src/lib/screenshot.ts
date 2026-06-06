/**
 * ScreenshotOne integration for full-page screenshots.
 *
 * Extracted from src/app/api/analyze-design/route.ts.
 */

// ── Constants ──────────────────────────────────────────────────────────────────

export const SCREENSHOT_ONE_URL = "https://api.screenshotone.com/take";

export const SCREENSHOT_TIMEOUT_MS = 30_000;

export const MOBILE_VIEWPORT = { width: 390, height: 844 };
export const DESKTOP_VIEWPORT = { width: 1440, height: 900 };

// ── Types ──────────────────────────────────────────────────────────────────────

export type ScreenshotResult =
  | { ok: true; base64: string }
  | { ok: false; error: string; status: number | null };

// ── Screenshot function ───────────────────────────────────────────────────────

/** Take a full-page screenshot via ScreenshotOne and return base64-encoded PNG bytes. */
export async function takeScreenshot(
  url: string,
  viewport: { width: number; height: number },
  accessKey: string,
): Promise<ScreenshotResult> {
  const params = new URLSearchParams({
    url,
    access_key: accessKey,
    full_page: "true",
    viewport_width: String(viewport.width),
    viewport_height: String(viewport.height),
    format: "png",
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SCREENSHOT_TIMEOUT_MS);

  try {
    const response = await fetch(`${SCREENSHOT_ONE_URL}?${params}`, {
      signal: controller.signal,
    });

    console.log(
      `[SCREENSHOT] ScreenshotOne (${viewport.width}w) HTTP status:`,
      response.status,
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      console.error("[SCREENSHOT] ScreenshotOne HTTP error", {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        url,
        viewport: viewport.width,
      });
      return { ok: false, error: errorText, status: response.status };
    }

    // ScreenshotOne can return HTTP 200 with {"is_successful": false, "error": "..."}
    // in the body when the screenshot fails (e.g. blocked page, unreachable site).
    // Check the Content-Type to detect JSON error payloads before treating the body as binary.
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json") || contentType.includes("text/")) {
      const bodyText = await response.text().catch(() => "");
      let isError = false;
      let errorMsg = "Screenshot unavailable";
      try {
        const json = JSON.parse(bodyText);
        if (json && json.is_successful === false) {
          isError = true;
          errorMsg = json.error
            ? `Screenshot unavailable: ${json.error}`
            : "Screenshot unavailable — the page could not be captured";
          console.error("[SCREENSHOT] ScreenshotOne business error", {
            error: json.error,
            url,
            viewport: viewport.width,
            fullResponse: json,
          });
        }
      } catch {
        // Not JSON — treat response text as the error
        if (bodyText.length > 0 && bodyText.length < 500) {
          errorMsg = `Screenshot unavailable: ${bodyText}`;
          isError = true;
          console.error("[SCREENSHOT] ScreenshotOne text error", {
            body: bodyText,
            url,
            viewport: viewport.width,
          });
        }
      }
      if (isError) {
        console.log(`[SCREENSHOT] ScreenshotOne (${viewport.width}w) returned error:`, errorMsg);
        return { ok: false, error: errorMsg, status: response.status };
      }
      // If we got here, it's not an error — it's a text-based response we can't use as an image
      console.error("[SCREENSHOT] ScreenshotOne unexpected response format", {
        contentType,
        url,
        viewport: viewport.width,
      });
      return { ok: false, error: "Screenshot unavailable — unexpected response format", status: response.status };
    }

    const arrayBuffer = await response.arrayBuffer();

    // Verify the buffer is non-trivial (PNG has at least a few hundred bytes)
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
