import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiError } from '@/lib/errors';

// GET /api/wines/[id]/events
// Returns 200 { events: BottleEvent[] } ordered by event_date DESC | 404 WINE_NOT_FOUND
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) return apiError(404, 'WINE_NOT_FOUND', 'Wine not found.');

  try {
    const wineCheck = await db.query('SELECT id FROM wines WHERE id = $1', [id]);
    if (wineCheck.rows.length === 0) {
      return apiError(404, 'WINE_NOT_FOUND', 'Wine not found.');
    }

    const result = await db.query(
      `SELECT id, wine_id, event_type, event_date, note, created_at
       FROM bottle_events
       WHERE wine_id = $1
       ORDER BY event_date DESC, created_at DESC`,
      [id]
    );

    return Response.json({ events: result.rows });
  } catch (err) {
    console.error('GET /api/wines/[id]/events error:', err);
    return apiError(500, 'DB_READ_ERROR', 'Could not retrieve events. Please try again.');
  }
}
