import type { RatingScale } from '../rating';

interface NoteValidationResult {
  valid: boolean;
  errors?: Record<string, string>;
}

const VALID_WOULD_BUY_AGAIN = ['yes', 'no', 'maybe'] as const;
const VALID_OCCASIONS = ['dinner', 'gift', 'casual', 'celebration', 'restaurant', 'tasting', 'other'] as const;

/**
 * Validate tasting note creation body.
 * ratingScale determines valid range for rating field:
 *   - five_star: integer 1-5
 *   - hundred_point: integer 1-100
 * From FRD §F04 Validation Rules.
 */
export function validateCreateNote(
  body: unknown,
  ratingScale: string
): NoteValidationResult {
  if (!body || typeof body !== 'object') {
    return { valid: false, errors: { _: 'Invalid request body.' } };
  }

  const b = body as Record<string, unknown>;
  const errors: Record<string, string> = {};

  // tasted_on: required, valid date, not in the future
  if (!b.tasted_on || typeof b.tasted_on !== 'string') {
    errors.tasted_on = 'Tasting date is required.';
  } else {
    const d = new Date(b.tasted_on);
    if (isNaN(d.getTime())) {
      errors.tasted_on = 'Tasting date must be a valid date (YYYY-MM-DD).';
    } else {
      const today = new Date();
      today.setHours(23, 59, 59, 999); // end of today
      if (d > today) {
        errors.tasted_on = 'Tasting date cannot be in the future.';
      }
    }
  }

  // rating: optional; if provided, integer in allowed range
  if (b.rating !== undefined && b.rating !== null) {
    const r = Number(b.rating);
    if (!Number.isInteger(r)) {
      errors.rating = 'Rating must be a whole number.';
    } else if (ratingScale === 'five_star' && (r < 1 || r > 5)) {
      errors.rating = 'Rating must be between 1 and 5.';
    } else if (ratingScale === 'hundred_point' && (r < 1 || r > 100)) {
      errors.rating = 'Rating must be between 1 and 100.';
    }
  }

  // would_buy_again: optional; if provided must be yes/no/maybe
  if (b.would_buy_again !== undefined && b.would_buy_again !== null) {
    if (!VALID_WOULD_BUY_AGAIN.includes(b.would_buy_again as typeof VALID_WOULD_BUY_AGAIN[number])) {
      errors.would_buy_again = "Invalid 'Would Buy Again' value.";
    }
  }

  // occasion: optional; if provided must be one of 7 enum values
  if (b.occasion !== undefined && b.occasion !== null) {
    if (!VALID_OCCASIONS.includes(b.occasion as typeof VALID_OCCASIONS[number])) {
      errors.occasion = 'Invalid occasion value.';
    }
  }

  // appearance/aroma/flavor/finish: optional; max 1000 chars each
  for (const field of ['appearance', 'aroma', 'flavor', 'finish'] as const) {
    if (b[field] !== undefined && b[field] !== null && typeof b[field] === 'string') {
      if ((b[field] as string).length > 1000) {
        errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} must be 1000 characters or fewer.`;
      }
    }
  }

  // guest_feedback: optional; max 2000 chars
  if (b.guest_feedback !== undefined && b.guest_feedback !== null && typeof b.guest_feedback === 'string') {
    if ((b.guest_feedback as string).length > 2000) {
      errors.guest_feedback = 'Guest feedback must be 2000 characters or fewer.';
    }
  }

  return Object.keys(errors).length === 0 ? { valid: true } : { valid: false, errors };
}
