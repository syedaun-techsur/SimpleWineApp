import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { apiError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

const VALID_RATING_SCALES = ['five_star', 'hundred_point'] as const;
type RatingScale = typeof VALID_RATING_SCALES[number];

export async function GET(): Promise<NextResponse> {
  try {
    const result = await query(
      'SELECT rating_scale, updated_at FROM user_settings WHERE id = 1'
    );
    if (result.rows.length === 0) {
      // Should not happen after migration 005 seeding — but handle gracefully
      return NextResponse.json({ rating_scale: 'five_star', updated_at: new Date().toISOString() });
    }
    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error('GET /api/settings error:', err);
    return apiError(500, 'DB_READ_ERROR', 'Could not load settings. Please try again.');
  }
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { rating_scale } = body as { rating_scale?: unknown };

    if (!rating_scale || !VALID_RATING_SCALES.includes(rating_scale as RatingScale)) {
      return apiError(
        422,
        'INVALID_RATING_SCALE',
        "Rating scale must be 'five_star' or 'hundred_point'."
      );
    }

    // Upsert single row id=1 (seeded in migration 005; always exists)
    const result = await query(
      `UPDATE user_settings SET rating_scale = $1, updated_at = NOW()
       WHERE id = 1
       RETURNING rating_scale, updated_at`,
      [rating_scale]
    );

    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error('PATCH /api/settings error:', err);
    return apiError(500, 'DB_WRITE_ERROR', 'Could not update settings. Please try again.');
  }
}
