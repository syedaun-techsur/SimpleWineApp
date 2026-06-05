export const WINE_TYPES = ['Red', 'White', 'Rosé', 'Sparkling', 'Dessert', 'Fortified', 'Orange', 'Other'] as const;

export interface WineValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export function validateCreateWine(body: unknown): WineValidationResult {
  const errors: Record<string, string> = {};
  const b = body as Record<string, unknown>;
  const currentYear = new Date().getFullYear();

  // name: required, non-empty after trim, max 255
  if (!b.name || typeof b.name !== 'string' || b.name.trim().length === 0) {
    errors.name = 'Name is required.';
  } else if (b.name.trim().length > 255) {
    errors.name = 'Name must be 255 characters or fewer.';
  }

  // producer: required, non-empty after trim, max 255
  if (!b.producer || typeof b.producer !== 'string' || b.producer.trim().length === 0) {
    errors.producer = 'Producer is required.';
  } else if (b.producer.trim().length > 255) {
    errors.producer = 'Producer must be 255 characters or fewer.';
  }

  // vintage: required, integer, 1900–(current year + 1)
  const vintage = Number(b.vintage);
  if (!b.vintage && b.vintage !== 0) {
    errors.vintage = 'Vintage is required.';
  } else if (!Number.isInteger(vintage) || vintage < 1900 || vintage > currentYear + 1) {
    errors.vintage = `Vintage must be between 1900 and ${currentYear + 1}.`;
  }

  // wine_type: required, one of 8 enum values (case-sensitive)
  if (!b.wine_type) {
    errors.wine_type = 'Wine type is required.';
  } else if (!WINE_TYPES.includes(b.wine_type as typeof WINE_TYPES[number])) {
    errors.wine_type = 'Select a valid wine type.';
  }

  // quantity: required, integer, 1–9999 (create requires >=1; DB allows 0 for decrement)
  const quantity = Number(b.quantity);
  if (b.quantity === undefined || b.quantity === null || b.quantity === '') {
    errors.quantity = 'Quantity is required.';
  } else if (!Number.isInteger(quantity) || quantity < 1 || quantity > 9999) {
    errors.quantity = 'Quantity must be between 1 and 9999.';
  }

  // location_id: required, positive integer
  const locationId = Number(b.location_id);
  if (!b.location_id) {
    errors.location_id = 'Storage location is required.';
  } else if (!Number.isInteger(locationId) || locationId <= 0) {
    errors.location_id = 'Invalid storage location.';
  }

  // grape: optional, max 255
  if (b.grape && typeof b.grape === 'string' && b.grape.trim().length > 255) {
    errors.grape = 'Grape must be 255 characters or fewer.';
  }

  // country: optional, max 100
  if (b.country && typeof b.country === 'string' && b.country.trim().length > 100) {
    errors.country = 'Country must be 100 characters or fewer.';
  }

  // region: optional, max 100
  if (b.region && typeof b.region === 'string' && b.region.trim().length > 100) {
    errors.region = 'Region must be 100 characters or fewer.';
  }

  // bottle_size: optional, max 50
  if (b.bottle_size && typeof b.bottle_size === 'string' && b.bottle_size.trim().length > 50) {
    errors.bottle_size = 'Bottle size must be 50 characters or fewer.';
  }

  // purchase_price: optional, non-negative, max 2 decimals, max 99999.99
  if (b.purchase_price !== undefined && b.purchase_price !== null && b.purchase_price !== '') {
    const price = Number(b.purchase_price);
    if (isNaN(price) || price < 0 || price > 99999.99) {
      errors.purchase_price = 'Purchase price must be between 0 and 99999.99.';
    }
  }

  // purchase_date: optional, valid YYYY-MM-DD, not in future
  if (b.purchase_date && typeof b.purchase_date === 'string') {
    const d = new Date(b.purchase_date);
    if (isNaN(d.getTime())) {
      errors.purchase_date = 'Purchase date must be a valid date (YYYY-MM-DD).';
    } else if (d > new Date()) {
      errors.purchase_date = 'Purchase date cannot be in the future.';
    }
  }

  // drinking_window_start: optional, integer >= 1900
  if (b.drinking_window_start !== undefined && b.drinking_window_start !== null && b.drinking_window_start !== '') {
    const start = Number(b.drinking_window_start);
    if (!Number.isInteger(start) || start < 1900) {
      errors.drinking_window_start = 'Drinking window start must be an integer year (≥ 1900).';
    }
  }

  // drinking_window_end: optional, integer >= 1900, >= start if both set
  if (b.drinking_window_end !== undefined && b.drinking_window_end !== null && b.drinking_window_end !== '') {
    const end = Number(b.drinking_window_end);
    if (!Number.isInteger(end) || end < 1900) {
      errors.drinking_window_end = 'Drinking window end must be an integer year (≥ 1900).';
    } else if (
      b.drinking_window_start !== undefined &&
      b.drinking_window_start !== null &&
      b.drinking_window_start !== '' &&
      !errors.drinking_window_start
    ) {
      const start = Number(b.drinking_window_start);
      if (end < start) {
        errors.drinking_window_end = 'Drinking window end year must be ≥ start year.';
      }
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

// PUT replaces all fields — same validation rules as create
export const validateUpdateWine = validateCreateWine;
