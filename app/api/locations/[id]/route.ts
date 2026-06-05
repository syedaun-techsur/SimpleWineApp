import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiError } from '@/lib/errors';
import { validateLocationName } from '@/lib/validators/location';

export const dynamic = 'force-dynamic';

// PUT /api/locations/[id]
// Body: { name: string }
// Returns 200 Location | 404 LOCATION_NOT_FOUND | 409 LOCATION_NAME_CONFLICT | 422 VALIDATION_ERROR | 500 DB_WRITE_ERROR
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) return apiError(404, 'LOCATION_NOT_FOUND', 'Location not found.');

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
    const exists = await db.query('SELECT id FROM locations WHERE id = $1', [id]);
    if (exists.rows.length === 0) {
      return apiError(404, 'LOCATION_NOT_FOUND', 'Location not found.');
    }

    const result = await db.query(
      `UPDATE locations SET name = $1 WHERE id = $2
       RETURNING id, name, created_at, updated_at`,
      [name, id]
    );
    return Response.json(result.rows[0]);
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      'code' in err &&
      (err as NodeJS.ErrnoException & { code: string }).code === '23505'
    ) {
      return apiError(409, 'LOCATION_NAME_CONFLICT', 'A location with that name already exists.');
    }
    console.error('PUT /api/locations/[id] error:', err);
    return apiError(500, 'DB_WRITE_ERROR', 'Could not save location. Please try again.');
  }
}

// DELETE /api/locations/[id]
// Returns 204 (empty) | 404 LOCATION_NOT_FOUND | 500 DB_WRITE_ERROR
// CRITICAL: Runs in a transaction — UPDATE wines SET location_id = NULL first, then DELETE location
// This implements NFR-009: deleting a location is non-destructive to wine records.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) return apiError(404, 'LOCATION_NOT_FOUND', 'Location not found.');

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const exists = await client.query('SELECT id FROM locations WHERE id = $1 FOR UPDATE', [id]);
    if (exists.rows.length === 0) {
      await client.query('ROLLBACK');
      return apiError(404, 'LOCATION_NOT_FOUND', 'Location not found.');
    }

    // Step 1: Null out location_id on all wines referencing this location
    await client.query('UPDATE wines SET location_id = NULL WHERE location_id = $1', [id]);

    // Step 2: Delete the location row
    await client.query('DELETE FROM locations WHERE id = $1', [id]);

    await client.query('COMMIT');
    return new Response(null, { status: 204 });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('DELETE /api/locations/[id] error:', err);
    return apiError(500, 'DB_WRITE_ERROR', 'Could not delete location. Please try again.');
  } finally {
    client.release();
  }
}
