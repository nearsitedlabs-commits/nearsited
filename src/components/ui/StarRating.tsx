type StarRatingProps = {
  /** Rating value, e.g. 4.6 */
  value: number;
  /** Review count — renders as "(count)" suffix when provided */
  count?: number | null;
  className?: string;
};

/**
 * Canonical rating display: `4.6★ (120)`
 * Number-first for scannability. Star in warning amber. Count in tertiary.
 */
export function StarRating({ value, count, className }: StarRatingProps) {
  return (
    <span className={className}>
      {value.toFixed(1)}
      <span className="text-[var(--color-warning)]" aria-hidden="true">★</span>
      {count != null && (
        <span className="text-[var(--color-text-tertiary)]"> ({count.toLocaleString()})</span>
      )}
    </span>
  );
}
StarRating.displayName = "StarRating";
