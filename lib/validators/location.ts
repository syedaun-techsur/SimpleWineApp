export interface LocationValidationResult {
  valid: boolean;
  error?: string;
}

export function validateLocationName(name: unknown): LocationValidationResult {
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return { valid: false, error: 'Location name is required.' };
  }
  if (name.trim().length > 100) {
    return { valid: false, error: 'Location name must be 100 characters or fewer.' };
  }
  return { valid: true };
}
