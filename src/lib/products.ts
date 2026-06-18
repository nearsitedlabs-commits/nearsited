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
 * - `DODO_PRODUCT_SOLO_MONTHLY`
 * - `DODO_PRODUCT_SOLO_ANNUAL`
 * - `DODO_PRODUCT_AGENCY_MONTHLY`
 * - `DODO_PRODUCT_AGENCY_ANNUAL`
 * - `DODO_PRODUCT_SCALE_MONTHLY`
 * - `DODO_PRODUCT_SCALE_ANNUAL`
 *
 * Throws if any of the required env vars are missing.
 */
export function getValidProducts(): readonly string[] {
  if (_validProducts) return _validProducts;

  const soloMonthly    = process.env.DODO_PRODUCT_SOLO_MONTHLY;
  const soloAnnual     = process.env.DODO_PRODUCT_SOLO_ANNUAL;
  const agencyMonthly  = process.env.DODO_PRODUCT_AGENCY_MONTHLY;
  const agencyAnnual   = process.env.DODO_PRODUCT_AGENCY_ANNUAL;
  const scaleMonthly   = process.env.DODO_PRODUCT_SCALE_MONTHLY;
  const scaleAnnual    = process.env.DODO_PRODUCT_SCALE_ANNUAL;

  if (!soloMonthly || !soloAnnual || !agencyMonthly || !agencyAnnual || !scaleMonthly || !scaleAnnual) {
    throw new Error(
      "Missing one or more DODO_PRODUCT_* environment variables. " +
      "Ensure DODO_PRODUCT_SOLO_MONTHLY, DODO_PRODUCT_SOLO_ANNUAL, " +
      "DODO_PRODUCT_AGENCY_MONTHLY, DODO_PRODUCT_AGENCY_ANNUAL, " +
      "DODO_PRODUCT_SCALE_MONTHLY, and DODO_PRODUCT_SCALE_ANNUAL are set."
    );
  }

  _validProducts = Object.freeze([
    soloMonthly,
    soloAnnual,
    agencyMonthly,
    agencyAnnual,
    scaleMonthly,
    scaleAnnual,
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
