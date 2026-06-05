import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiError } from '@/lib/errors';
import { validateCreateWine } from '@/lib/validators/wine';

// GET /api/wines
// Returns { wines: Wine[] } — full list with location_name (LEFT JOIN) and most_recent_rating (DISTINCT ON)
// TechArch: 200 { wines: Wine[] } | 500 DB_READ_ERROR
export async function GET() {
  try {
    const result = await db.query(`
      SELECT
        w.id, w.name, w.producer, w.vintage, w.wine_type, w.grape,
        w.country, w.region, w.bottle_size, w.quantity, w.location_id,
        l.name AS location_name,
        w.purchase_date, w.purchase_source,
        w.purchase_price::text AS purchase_price,
        w.drinking_window_start, w.drinking_window_end, w.notes,
        tn.rating AS most_recent_rating,
        w.created_at, w.updated_at
      FROM wines w
      LEFT JOIN locations l ON w.location_id = l.id
      LEFT JOIN LATERAL (
        SELECT rating
        FROM tasting_notes
        WHERE wine_id = w.id
        ORDER BY tasted_on DESC, created_at DESC
        LIMIT 1
      ) tn ON true
      ORDER BY w.created_at DESC
    `);
    return Response.json({ wines: result.rows });
  } catch (err) {
    console.error('GET /api/wines error:', err);
    return apiError(500, 'DB_READ_ERROR', 'Could not retrieve wines. Please try again.');
  }
}

// POST /api/wines
// Body: CreateWineBody (TechArch §4.2)
// Returns: 201 Wine | 422 VALIDATION_ERROR/VINTAGE_OUT_OF_RANGE/INVALID_WINE_TYPE/
//          QUANTITY_OUT_OF_RANGE/LOCATION_NOT_FOUND/WINDOW_INVALID_RANGE | 500 DB_WRITE_ERROR
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(400, 'INVALID_JSON', 'Request body must be valid JSON.');
  }

  const validation = validateCreateWine(body);
  if (!validation.valid) {
    // Map specific error types to FRD error codes
    const errors = validation.errors;
    if (errors.vintage) {
      return apiError(422, 'VINTAGE_OUT_OF_RANGE', errors.vintage);
    }
    if (errors.wine_type) {
      return apiError(422, 'INVALID_WINE_TYPE', errors.wine_type);
    }
    if (errors.quantity) {
      return apiError(422, 'QUANTITY_OUT_OF_RANGE', errors.quantity);
    }
    if (errors.drinking_window_end && errors.drinking_window_end.includes('≥ start')) {
      return apiError(422, 'WINDOW_INVALID_RANGE', errors.drinking_window_end);
    }
    return apiError(422, 'VALIDATION_ERROR', 'Validation failed.', errors);
  }

  const b = body as Record<string, unknown>;

  // Verify location exists
  try {
    const locCheck = await db.query('SELECT id FROM locations WHERE id = $1', [b.location_id]);
    if (locCheck.rows.length === 0) {
      return apiError(422, 'LOCATION_NOT_FOUND', 'Selected storage location no longer exists. Please choose another.');
    }
  } catch (err) {
    console.error('Location check error:', err);
    return apiError(500, 'DB_WRITE_ERROR', 'Could not save wine. Please try again.');
  }

  try {
    const result = await db.query(
      `INSERT INTO wines (
        name, producer, vintage, wine_type, grape, country, region,
        bottle_size, quantity, location_id, purchase_date, purchase_source,
        purchase_price, drinking_window_start, drinking_window_end, notes
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      RETURNING
        id, name, producer, vintage, wine_type, grape, country, region,
        bottle_size, quantity, location_id,
        purchase_date, purchase_source, purchase_price::text AS purchase_price,
        drinking_window_start, drinking_window_end, notes,
        NULL::text AS location_name, NULL::integer AS most_recent_rating,
        created_at, updated_at`,
      [
        (b.name as string).trim(),
        (b.producer as string).trim(),
        Number(b.vintage),
        b.wine_type,
        b.grape ? (b.grape as string).trim() : null,
        b.country ? (b.country as string).trim() : null,
        b.region ? (b.region as string).trim() : null,
        b.bottle_size ? (b.bottle_size as string).trim() : null,
        Number(b.quantity),
        Number(b.location_id),
        b.purchase_date || null,
        b.purchase_source ? (b.purchase_source as string).trim() : null,
        b.purchase_price != null && b.purchase_price !== '' ? Number(b.purchase_price) : null,
        b.drinking_window_start != null && b.drinking_window_start !== '' ? Number(b.drinking_window_start) : null,
        b.drinking_window_end != null && b.drinking_window_end !== '' ? Number(b.drinking_window_end) : null,
        b.notes || null,
      ]
    );

    // Fetch with JOIN to get location_name
    const wine = await db.query(
      `SELECT w.*, l.name AS location_name,
              NULL::integer AS most_recent_rating,
              w.purchase_price::text AS purchase_price
       FROM wines w LEFT JOIN locations l ON w.location_id = l.id
       WHERE w.id = $1`,
      [result.rows[0].id]
    );
    return Response.json(wine.rows[0], { status: 201 });
  } catch (err) {
    console.error('POST /api/wines error:', err);
    return apiError(500, 'DB_WRITE_ERROR', 'Could not save wine. Please try again.');
  }
}
