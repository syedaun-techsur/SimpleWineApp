import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { apiError } from '@/lib/errors';
import { validateCreateNote } from '@/lib/validators/note';
import { normalizeRating } from '@/lib/rating';

interface RouteContext {
  params: { id: string };
}

export async function GET(
  _req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  const wineId = parseInt(params.id, 10);
  if (isNaN(wineId)) return apiError(404, 'WINE_NOT_FOUND', 'Wine not found.');

  try {
    // Verify wine exists
    const wineCheck = await query('SELECT id FROM wines WHERE id = $1', [wineId]);
    if (wineCheck.rows.length === 0) {
      return apiError(404, 'WINE_NOT_FOUND', 'Wine not found.');
    }

    const result = await query(
      `SELECT id, wine_id, tasted_on, appearance, aroma, flavor, finish,
              rating, would_buy_again, occasion, guest_feedback, created_at
       FROM tasting_notes
       WHERE wine_id = $1
       ORDER BY tasted_on DESC, created_at DESC`,
      [wineId]
    );

    return NextResponse.json({ notes: result.rows });
  } catch (err) {
    console.error('GET /api/wines/[id]/notes error:', err);
    return apiError(500, 'DB_READ_ERROR', 'Could not fetch tasting notes. Please try again.');
  }
}

export async function POST(
  req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  const wineId = parseInt(params.id, 10);
  if (isNaN(wineId)) return apiError(404, 'WINE_NOT_FOUND', 'Wine not found.');

  try {
    // Verify wine exists
    const wineCheck = await query('SELECT id FROM wines WHERE id = $1', [wineId]);
    if (wineCheck.rows.length === 0) {
      return apiError(404, 'WINE_NOT_FOUND', 'Wine not found.');
    }

    // Read current rating scale from user_settings (single row id=1)
    const settingsResult = await query(
      'SELECT rating_scale FROM user_settings WHERE id = 1'
    );
    const ratingScale: string = settingsResult.rows[0]?.rating_scale ?? 'five_star';

    const body = await req.json();

    // Server-side validation per lib/validators/note.ts
    const validation = validateCreateNote(body, ratingScale);
    if (!validation.valid) {
      const errors = validation.errors ?? {};
      // Map specific error codes from FRD §F04 Error States
      if (errors.tasted_on) {
        if (errors.tasted_on.includes('future')) {
          return apiError(422, 'TASTED_ON_FUTURE', errors.tasted_on, errors);
        }
      }
      if (errors.rating) {
        return apiError(422, 'RATING_OUT_OF_RANGE', errors.rating, errors);
      }
      if (errors.would_buy_again) {
        return apiError(422, 'INVALID_WOULD_BUY_AGAIN', errors.would_buy_again, errors);
      }
      if (errors.occasion) {
        return apiError(422, 'INVALID_OCCASION', errors.occasion, errors);
      }
      return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'Validation failed.', fields: errors }, { status: 422 });
    }

    // Normalize rating before storage
    let normalizedRating: number | null = null;
    if (body.rating !== undefined && body.rating !== null) {
      normalizedRating = normalizeRating(Number(body.rating), ratingScale as 'five_star' | 'hundred_point');
    }

    const insertResult = await query(
      `INSERT INTO tasting_notes
         (wine_id, tasted_on, appearance, aroma, flavor, finish,
          rating, would_buy_again, occasion, guest_feedback)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, wine_id, tasted_on, appearance, aroma, flavor, finish,
                 rating, would_buy_again, occasion, guest_feedback, created_at`,
      [
        wineId,
        body.tasted_on,
        body.appearance ?? null,
        body.aroma ?? null,
        body.flavor ?? null,
        body.finish ?? null,
        normalizedRating,
        body.would_buy_again ?? null,
        body.occasion ?? null,
        body.guest_feedback ?? null,
      ]
    );

    return NextResponse.json(insertResult.rows[0], { status: 201 });
  } catch (err) {
    console.error('POST /api/wines/[id]/notes error:', err);
    return apiError(500, 'DB_WRITE_ERROR', 'Could not save tasting note. Please try again.');
  }
}
