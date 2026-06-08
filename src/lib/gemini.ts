// Single source of truth for the Gemini model ID.
// Never inline this string in route files — import from here.
export const GEMINI_MODEL = "gemini-2.5-flash";
export const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
export const GEMINI_URL = `${GEMINI_BASE_URL}/${GEMINI_MODEL}:generateContent`;

/**
 * Clean a raw Gemini text response by removing markdown fences and extracting
 * only the first complete, balanced JSON object.  This guards against Gemini
 * returning trailing garbage after the closing `}` or wrapping the JSON in
 * ```json … ``` fences.
 */
export function cleanGeminiJson(raw: string): string {
  // Remove ```json and ``` fences
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '')
  // Extract just the first complete JSON object — find opening { and its matching }
  const start = cleaned.indexOf('{')
  if (start === -1) throw new Error('No JSON object found in Gemini response')
  let depth = 0
  let end = -1
  for (let i = start; i < cleaned.length; i++) {
    if (cleaned[i] === '{') depth++
    if (cleaned[i] === '}') {
      depth--
      if (depth === 0) { end = i; break }
    }
  }
  if (end === -1) throw new Error('Unclosed JSON object in Gemini response')
  return cleaned.slice(start, end + 1)
}
