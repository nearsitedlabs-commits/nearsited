/**
 * Product configuration.
 *
 * Reads Dodo Payments product IDs from environment variables so they can be
 * swapped between sandbox/test and production without code changes.
 *
 * A getter function is used instead of a module-level constant because
 * environment variables may not be available at import time in Next.js
 * (they are populated at request time on the server).
 */

let _validProducts: readonly string[] | null = null;

/**
 * Returns the list of valid Dodo Payments product IDs.
 *
 * Reads from the following env vars at first call, then caches:
 * - `DODO_PRODUCT_STARTER_MONTHLY`
 * - `DODO_PRODUCT_STARTER_ANNUAL`
 * - `DODO_PRODUCT_AGENCY_MONTHLY`
 * - `DODO_PRODUCT_AGENCY_ANNUAL`
 *
 * Throws if any of the required env vars are missing.
 */
export function getValidProducts(): readonly string[] {
  if (_validProducts) return _validProducts;

  const starterMonthly = process.env.DODO_PRODUCT_STARTER_MONTHLY;
  const starterAnnual = process.env.DODO_PRODUCT_STARTER_ANNUAL;
  const agencyMonthly = process.env.DODO_PRODUCT_AGENCY_MONTHLY;
  const agencyAnnual = process.env.DODO_PRODUCT_AGENCY_ANNUAL;

  if (!starterMonthly || !starterAnnual || !agencyMonthly || !agencyAnnual) {
    throw new Error(
      "Missing one or more DODO_PRODUCT_* environment variables. " +
      "Ensure DODO_PRODUCT_STARTER_MONTHLY, DODO_PRODUCT_STARTER_ANNUAL, " +
      "DODO_PRODUCT_AGENCY_MONTHLY, and DODO_PRODUCT_AGENCY_ANNUAL are set."
    );
  }

  _validProducts = Object.freeze([
    starterMonthly,
    starterAnnual,
    agencyMonthly,
    agencyAnnual,
  ]);

  return _validProducts;
}

/** A valid Dodo Payments product ID (string, validated at runtime). */
export type ProductId = string;

/** @deprecated Use `getValidProducts()` instead — env vars may not be available at import time. */
export const VALID_PRODUCTS: readonly string[] =
  typeof window === "undefined"
    ? (() => {
        try {
          return getValidProducts();
        } catch {
          return [];
        }
      })()
    : [];
