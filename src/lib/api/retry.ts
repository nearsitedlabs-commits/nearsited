/**
 * Generic HTTP retry utility with back-off delays.
 *
 * Extracted from src/app/api/analyze-design/route.ts.
 */

export type RetryOptions = {
  /** Back-off delays in milliseconds between retries. Default: [3_000, 8_000] */
  delays?: number[];
  /** Per-attempt timeout in milliseconds. Default: 30_000 */
  timeoutMs?: number;
};

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Fetch a URL with automatic retry on HTTP 429 (rate limit) and 503 (overloaded).
 * Each attempt has a configurable timeout. Retries use back-off delays.
 * Non-retryable errors (400, 401, 500, AbortError, network errors) are surfaced
 * immediately without retry.
 */
export async function retryWithBackoff(
  fetchFn: (signal: AbortSignal) => Promise<Response>,
  options?: RetryOptions,
): Promise<Response> {
  const delays = options?.delays ?? [2_000, 5_000];
  const timeoutMs = options?.timeoutMs ?? 30_000;
  const maxAttempts = delays.length + 1;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetchFn(controller.signal);
      clearTimeout(timeoutId);

      if (response.status === 429 || response.status === 503) {
        if (attempt < maxAttempts) {
          const delay = delays[attempt - 1];
          console.log(
            `[RETRY] HTTP ${response.status} retry attempt ${attempt} of ${maxAttempts - 1}`,
          );
          await sleep(delay);
          continue;
        }
        // Last attempt exhausted — return the response for the caller to handle
        console.log(
          `[RETRY] HTTP ${response.status} — all ${maxAttempts - 1} retries exhausted`,
        );
        return response;
      }

      return response;
    } catch (err) {
      clearTimeout(timeoutId);
      // AbortError, network failure, etc. — surface immediately, no retry
      throw err;
    }
  }

  throw new Error("unreachable");
}
