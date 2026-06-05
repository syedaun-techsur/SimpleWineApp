import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

const VALID_EVENT_TYPES = ['Consumed', 'Gifted', 'Opened'] as const;

// PATCH /api/wines/[id]/quantity
// Body: PatchQuantityBody { delta: 1 | -1, event_type?: EventType, note?: string }
// Returns: 200 PatchQuantityResponse { quantity: number, event_id: number | null }
// Errors: 400 INVALID_DELTA | 404 WINE_NOT_FOUND | 409 QUANTITY_ALREADY_ZERO | 409 QUANTITY_AT_MAX
//         422 MISSING_EVENT_TYPE | 422 INVALID_EVENT_TYPE
export async function PATCH(
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

  const b = body as Record<string, unknown>;
  const delta = b.delta;

  // delta must be exactly 1 or -1
  if (delta !== 1 && delta !== -1) {
    return apiError(400, 'INVALID_DELTA', 'delta must be 1 or -1.');
  }

  // On decrement, event_type is required and must be valid
  if (delta === -1) {
    if (!b.event_type) {
      return apiError(422, 'MISSING_EVENT_TYPE', 'Please select what happened to this bottle.');
    }
    if (!VALID_EVENT_TYPES.includes(b.event_type as typeof VALID_EVENT_TYPES[number])) {
      return apiError(422, 'INVALID_EVENT_TYPE', 'Invalid event type.');
    }
  }

  // note: optional; max 500 chars
  const note = b.note ? String(b.note).substring(0, 500) : null;

  try {
    // Fetch current quantity
    const wineResult = await db.query('SELECT id, quantity FROM wines WHERE id = $1', [id]);
    if (wineResult.rows.length === 0) {
      return apiError(404, 'WINE_NOT_FOUND', 'Wine not found.');
    }

    const currentQty: number = wineResult.rows[0].quantity;

    if (delta === 1 && currentQty >= 9999) {
      return apiError(409, 'QUANTITY_AT_MAX', 'Maximum bottle count reached.');
    }
    if (delta === -1 && currentQty <= 0) {
      return apiError(409, 'QUANTITY_ALREADY_ZERO', 'No bottles left to remove.');
    }

    const newQty = currentQty + delta;

    if (delta === 1) {
      // Increment — no event logged
      await db.query('UPDATE wines SET quantity = $1 WHERE id = $2', [newQty, id]);
      return Response.json({ quantity: newQty, event_id: null });
    } else {
      // Decrement — log bottle event in a transaction
      const client = await db.connect();
      try {
        await client.query('BEGIN');
        await client.query('UPDATE wines SET quantity = $1 WHERE id = $2', [newQty, id]);
        const eventResult = await client.query(
          `INSERT INTO bottle_events (wine_id, event_type, event_date, note)
           VALUES ($1, $2, CURRENT_DATE, $3)
           RETURNING id`,
          [id, b.event_type, note]
        );
        await client.query('COMMIT');
        return Response.json({ quantity: newQty, event_id: eventResult.rows[0].id });
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }
  } catch (err) {
    console.error('PATCH /api/wines/[id]/quantity error:', err);
    return apiError(500, 'DB_WRITE_ERROR', 'Could not update quantity. Please try again.');
  }
}
