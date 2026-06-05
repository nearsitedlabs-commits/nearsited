/**
 * Shared timeout controller utility.
 *
 * Extracted from the duplicated implementations in discover, audit, and
 * analyze-design routes to reduce code duplication and monolith size.
 */

/**
 * Creates an AbortController with an automatic timeout.
 * Returns { controller, clear } — always call clear() in a finally block.
 *
 * Usage:
 *   const { controller, clear } = createTimeoutController(10000);
 *   try {
 *     const response = await fetch(url, { signal: controller.signal });
 *   } finally {
 *     clear();
 *   }
 */
export function createTimeoutController(timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return { controller, clear: () => clearTimeout(timeout) };
}
