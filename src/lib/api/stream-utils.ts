/**
 * Shared NDJSON streaming helpers.
 *
 * Extracted from src/app/api/analyze-design/route.ts and src/app/api/discover/route.ts
 * to eliminate duplication.
 */

/** Write an NDJSON line to the stream. */
export function writeJson(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  data: unknown,
) {
  controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));
}

/** Write a progress step event. */
export function writeStep(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  step: string,
  label: string,
) {
  writeJson(controller, encoder, { type: "progress", step, label });
}

/**
 * Write a progress event to the stream (discover route style).
 * @param phase  The phase name (e.g. "cache-lookup", "results", "enriching", "persisting")
 * @param detail Optional detail string
 */
export function writeProgress(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  phase: string,
  detail?: string,
) {
  writeJson(controller, encoder, { type: "progress", phase, detail: detail ?? "" });
}
