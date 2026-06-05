import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiError } from '@/lib/errors';
import { validateLocationName } from '@/lib/validators/location';

// GET /api/locations
// Returns 200 { locations: LocationWithCount[] } sorted by LOWER(name) ASC
// LocationWithCount: { id, name, wine_count, created_at, updated_at }
export async function GET() {
  try {
    const result = await db.query(`
      SELECT
        l.id, l.name,
        COUNT(w.id)::integer AS wine_count,
        l.created_at, l.updated_at
      FROM locations l
      LEFT JOIN wines w ON w.location_id = l.id
      GROUP BY l.id, l.name, l.created_at, l.updated_at
      ORDER BY LOWER(l.name) ASC
    `);
    return Response.json({ locations: result.rows });
  } catch (err) {
    console.error('GET /api/locations error:', err);
    return apiError(500, 'DB_READ_ERROR', 'Could not retrieve locations. Please try again.');
  }
}

// POST /api/locations
// Body: { name: string }
// Returns 201 LocationWithCount (wine_count: 0) | 422 VALIDATION_ERROR | 409 LOCATION_NAME_CONFLICT | 500 DB_WRITE_ERROR
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(400, 'INVALID_JSON', 'Request body must be valid JSON.');
  }

  const b = body as Record<string, unknown>;
  const validation = validateLocationName(b.name);
  if (!validation.valid) {
    return apiError(422, 'VALIDATION_ERROR', validation.error!);
  }

  const name = (b.name as string).trim();

  try {
    const result = await db.query(
      `INSERT INTO locations (name) VALUES ($1)
       RETURNING id, name, created_at, updated_at`,
      [name]
    );
    const location = { ...result.rows[0], wine_count: 0 };
    return Response.json(location, { status: 201 });
  } catch (err: unknown) {
    // Handle unique constraint violation (LOWER(name) unique)
    if (
      err instanceof Error &&
      'code' in err &&
      (err as NodeJS.ErrnoException & { code: string }).code === '23505'
    ) {
      return apiError(409, 'LOCATION_NAME_CONFLICT', 'A location with that name already exists.');
    }
    console.error('POST /api/locations error:', err);
    return apiError(500, 'DB_WRITE_ERROR', 'Could not save location. Please try again.');
  }
}
