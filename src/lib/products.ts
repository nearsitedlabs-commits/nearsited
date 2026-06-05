/**
 * Product configuration.
 *
 * Centralizes hardcoded product IDs so they're easy to update
 * without modifying route code.
 */

export const VALID_PRODUCTS = [
  "pdt_0NgKrmYBX9pAp9NhbeMqp", // Starter Monthly
  "pdt_0NgKs5x6MXKvmMOQemKP2", // Starter Annual
  "pdt_0NgKsF0ROmm9U603GRqMm", // Agency Monthly
  "pdt_0NgKsQO5UXCVGZskhrv89", // Agency Annual
] as const;

export type ProductId = typeof VALID_PRODUCTS[number];
