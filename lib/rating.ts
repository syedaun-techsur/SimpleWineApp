export type RatingScale = 'five_star' | 'hundred_point';

/**
 * Normalize user-input rating to stored 1-100 scale.
 * From TechArch §4.5: five_star × 20 = stored; hundred_point stored as-is.
 * Called server-side on POST /api/wines/[id]/notes.
 */
export function normalizeRating(value: number, scale: RatingScale): number {
  return scale === 'five_star' ? value * 20 : value;
}

/**
 * Convert stored normalized value back to display value.
 * From TechArch §4.5: stored ÷ 20 = stars (round to nearest 0.5 for display).
 * Called client-side for display; also used in API responses for display fields.
 */
export function displayRating(stored: number, scale: RatingScale): number | string {
  if (scale === 'five_star') return Math.round((stored / 20) * 2) / 2; // 0.5 increments
  return stored;
}
