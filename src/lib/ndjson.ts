/**
 * Read an NDJSON (newline-delimited JSON) stream from a fetch `Response`.
 *
 * The server is expected to emit lines with one of these shapes:
 *   - `{ type: "progress", step, label?, ... }`
 *   - `{ type: "result", ... }`
 *   - `{ type: "done" }`
 *   - `{ type: "error", message }`
 *
 * Malformed lines are silently skipped.
 */
export async function readNdjsonStream<T = Record<string, unknown>>(
  response: Response,
  callbacks: {
    onProgress?: (step: string, label: string, data: Record<string, unknown>) => void;
    onResult?: (data: T) => void;
    onError?: (message: string) => void;
  },
): Promise<void> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          if (parsed.type === "progress") {
            callbacks.onProgress?.(parsed.step, parsed.label ?? parsed.step, parsed);
          } else if (parsed.type === "result") {
            callbacks.onResult?.(parsed as T);
          } else if (parsed.type === "done") {
            return;
          } else if (parsed.type === "error") {
            callbacks.onError?.(parsed.message ?? "Unknown error");
            return;
          }
        } catch {
          // skip malformed lines
        }
      }
    }

    // ── Process remaining buffer after stream ends ───────────────────────
    // If the final chunk had no trailing \n, the last JSON line is still
    // in `buffer`. Without this, the last result/error/done is silently lost.
    if (buffer.trim()) {
      try {
        const parsed = JSON.parse(buffer);
        if (parsed.type === "result") {
          callbacks.onResult?.(parsed as T);
        } else if (parsed.type === "done") {
          return;
        } else if (parsed.type === "error") {
          callbacks.onError?.(parsed.message ?? "Unknown error");
          return;
        }
      } catch {
        // skip malformed final line
      }
    }
  } finally {
    reader.releaseLock();
  }
}
