import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiError } from '@/lib/errors';
import { validateUpdateWine } from '@/lib/validators/wine';

export const dynamic = 'force-dynamic';

// GET /api/wines/[id]
// Returns 200 { wine: Wine, tasting_notes: TastingNote[], bottle_events: BottleEvent[] }
// or 404 WINE_NOT_FOUND
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) return apiError(404, 'WINE_NOT_FOUND', 'Wine not found.');

  try {
    const wineResult = await db.query(
      `SELECT w.id, w.name, w.producer, w.vintage, w.wine_type, w.grape,
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
         SELECT rating FROM tasting_notes
         WHERE wine_id = w.id ORDER BY tasted_on DESC, created_at DESC LIMIT 1
       ) tn ON true
       WHERE w.id = $1`,
      [id]
    );

    if (wineResult.rows.length === 0) {
      return apiError(404, 'WINE_NOT_FOUND', 'Wine not found.');
    }

    const notesResult = await db.query(
      `SELECT * FROM tasting_notes WHERE wine_id = $1 ORDER BY tasted_on DESC, created_at DESC`,
      [id]
    );

    const eventsResult = await db.query(
      `SELECT * FROM bottle_events WHERE wine_id = $1 ORDER BY event_date DESC, created_at DESC`,
      [id]
    );

    return Response.json({
      wine: wineResult.rows[0],
      tasting_notes: notesResult.rows,
      bottle_events: eventsResult.rows,
    });
  } catch (err) {
    console.error('GET /api/wines/[id] error:', err);
    return apiError(500, 'DB_READ_ERROR', 'Could not retrieve wine. Please try again.');
  }
}

// PUT /api/wines/[id]
// Body: UpdateWineBody (same as CreateWineBody — full replace)
// Returns 200 Wine | 404 WINE_NOT_FOUND | 422 VALIDATION_ERROR | 500 DB_WRITE_ERROR
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) return apiError(404, 'WINE_NOT_FOUND', 'Wine not found.');

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(400, 'INVALID_JSON', 'Request body must be valid JSON.');
  }

  const validation = validateUpdateWine(body);
  if (!validation.valid) {
    const errors = validation.errors;
    if (errors.vintage) return apiError(422, 'VINTAGE_OUT_OF_RANGE', errors.vintage);
    if (errors.wine_type) return apiError(422, 'INVALID_WINE_TYPE', errors.wine_type);
    if (errors.quantity) return apiError(422, 'QUANTITY_OUT_OF_RANGE', errors.quantity);
    if (errors.drinking_window_end?.includes('≥ start')) return apiError(422, 'WINDOW_INVALID_RANGE', errors.drinking_window_end);
    return apiError(422, 'VALIDATION_ERROR', 'Validation failed.', errors);
  }

  const b = body as Record<string, unknown>;

  try {
    const exists = await db.query('SELECT id FROM wines WHERE id = $1', [id]);
    if (exists.rows.length === 0) return apiError(404, 'WINE_NOT_FOUND', 'Wine not found.');

    const locCheck = await db.query('SELECT id FROM locations WHERE id = $1', [b.location_id]);
    if (locCheck.rows.length === 0) {
      return apiError(422, 'LOCATION_NOT_FOUND', 'Selected storage location no longer exists. Please choose another.');
    }

    await db.query(
      `UPDATE wines SET
        name=$1, producer=$2, vintage=$3, wine_type=$4, grape=$5, country=$6,
        region=$7, bottle_size=$8, quantity=$9, location_id=$10,
        purchase_date=$11, purchase_source=$12, purchase_price=$13,
        drinking_window_start=$14, drinking_window_end=$15, notes=$16
       WHERE id=$17`,
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
        id,
      ]
    );

    const wine = await db.query(
      `SELECT w.*, l.name AS location_name,
              NULL::integer AS most_recent_rating,
              w.purchase_price::text AS purchase_price
       FROM wines w LEFT JOIN locations l ON w.location_id = l.id
       WHERE w.id = $1`,
      [id]
    );
    return Response.json(wine.rows[0]);
  } catch (err) {
    console.error('PUT /api/wines/[id] error:', err);
    return apiError(500, 'DB_WRITE_ERROR', 'Could not save wine. Please try again.');
  }
}

// DELETE /api/wines/[id]
// Returns 204 (empty) | 404 WINE_NOT_FOUND
// DB ON DELETE CASCADE handles tasting_notes and bottle_events
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) return apiError(404, 'WINE_NOT_FOUND', 'Wine not found.');

  try {
    const result = await db.query('DELETE FROM wines WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return apiError(404, 'WINE_NOT_FOUND', 'Wine not found.');
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error('DELETE /api/wines/[id] error:', err);
    return apiError(500, 'DB_WRITE_ERROR', 'Could not delete wine. Please try again.');
  }
}
