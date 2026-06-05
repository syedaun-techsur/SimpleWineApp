---
phase: implement-the-full-simplewineapp-system
plan: 02a
type: execute
wave: 2a
depends_on: [1]
files_modified:
  - lib/db.ts
  - lib/errors.ts
  - lib/validators/wine.ts
  - lib/validators/location.ts
  - app/api/wines/route.ts
  - app/api/wines/[id]/route.ts
  - app/api/wines/[id]/quantity/route.ts
  - app/api/wines/[id]/events/route.ts
  - app/api/locations/route.ts
  - app/api/locations/[id]/route.ts
autonomous: true

features:
  implements: ["F0", "F1", "F2"]
  depends_on: ["F0", "F1", "F2"]
  enables: ["F3", "F6"]

must_haves:
  truths:
    - "GET /api/wines returns 200 with { wines: Wine[] } including location_name and most_recent_rating"
    - "POST /api/wines creates a wine record and returns 201 with the full Wine object"
    - "GET /api/wines/[id] returns 200 with { wine, tasting_notes, bottle_events } or 404 WINE_NOT_FOUND"
    - "PUT /api/wines/[id] updates all fields and returns 200 Wine; returns 404 if not found"
    - "DELETE /api/wines/[id] returns 204; cascades to notes and events"
    - "PATCH /api/wines/[id]/quantity with delta:1 increments count, no event; delta:-1 with event_type decrements and logs bottle_events row"
    - "GET /api/wines/[id]/events returns 200 { events: BottleEvent[] } ordered newest-first"
    - "GET /api/locations returns 200 { locations: LocationWithCount[] } sorted by LOWER(name) ASC"
    - "POST /api/locations creates location, returns 201 LocationWithCount with wine_count:0"
    - "PUT /api/locations/[id] renames location, returns 200 Location"
    - "DELETE /api/locations/[id] NULLs wines.location_id in transaction, returns 204"
    - "All error codes from FRD are returned with correct HTTP status"
  artifacts:
    - path: "lib/db.ts"
      provides: "Exported PostgreSQL pool using pg; reads DATABASE_URL"
      exports: ["db (Pool)"]
    - path: "lib/errors.ts"
      provides: "Standard API error response helpers"
      exports: ["apiError", "ApiErrorCode"]
    - path: "lib/validators/wine.ts"
      provides: "Server-side wine field validation"
      exports: ["validateCreateWine", "validateUpdateWine"]
    - path: "lib/validators/location.ts"
      provides: "Server-side location name validation"
      exports: ["validateLocationName"]
    - path: "app/api/wines/route.ts"
      provides: "GET /api/wines, POST /api/wines"
      exports: ["GET", "POST"]
    - path: "app/api/wines/[id]/route.ts"
      provides: "GET/PUT/DELETE /api/wines/[id]"
      exports: ["GET", "PUT", "DELETE"]
    - path: "app/api/wines/[id]/quantity/route.ts"
      provides: "PATCH /api/wines/[id]/quantity"
      exports: ["PATCH"]
    - path: "app/api/wines/[id]/events/route.ts"
      provides: "GET /api/wines/[id]/events"
      exports: ["GET"]
    - path: "app/api/locations/route.ts"
      provides: "GET /api/locations, POST /api/locations"
      exports: ["GET", "POST"]
    - path: "app/api/locations/[id]/route.ts"
      provides: "PUT/DELETE /api/locations/[id]"
      exports: ["PUT", "DELETE"]
  key_links:
    - from: "app/api/wines/route.ts"
      to: "lib/db.ts"
      via: "import { db } from '@/lib/db'"
      pattern: "from.*lib/db"
    - from: "app/api/wines/route.ts"
      to: "lib/validators/wine.ts"
      via: "import { validateCreateWine } from '@/lib/validators/wine'"
      pattern: "validateCreateWine"
    - from: "app/api/locations/[id]/route.ts"
      to: "lib/db.ts"
      via: "db.query transaction: UPDATE wines SET location_id = NULL then DELETE location"
      pattern: "location_id.*NULL"
    - from: "app/api/wines/[id]/quantity/route.ts"
      to: "bottle_events table"
      via: "INSERT INTO bottle_events on delta:-1"
      pattern: "INSERT INTO bottle_events"

integration_contracts:
  requires:
    - from_plan: "01"
      artifact: "db/002_create_wines.sql"
      exports: ["wines table"]
      verify: "grep -n 'CREATE TABLE IF NOT EXISTS wines' db/002_create_wines.sql && echo CONTRACT_OK"
    - from_plan: "01"
      artifact: "db/001_create_locations.sql"
      exports: ["locations table"]
      verify: "grep -n 'CREATE TABLE IF NOT EXISTS locations' db/001_create_locations.sql && echo CONTRACT_OK"
    - from_plan: "01"
      artifact: "db/003_create_bottle_events.sql"
      exports: ["bottle_events table"]
      verify: "grep -n 'CREATE TABLE IF NOT EXISTS bottle_events' db/003_create_bottle_events.sql && echo CONTRACT_OK"
    - from_plan: "01"
      artifact: "docker-compose.yml"
      exports: ["db service (postgres:16, port 5432)", "DATABASE_URL env"]
      verify: "grep -n 'service_healthy' docker-compose.yml && grep -n 'postgres:16' docker-compose.yml && echo CONTRACT_OK"
  provides:
    - artifact: "lib/db.ts"
      exports: ["db"]
      shape: |
        import { Pool } from 'pg';
        export const db = new Pool({ connectionString: process.env.DATABASE_URL });
      verify: "grep -n 'export.*db' lib/db.ts && grep -n 'DATABASE_URL' lib/db.ts && echo CONTRACT_OK"
    - artifact: "lib/errors.ts"
      exports: ["apiError"]
      shape: |
        export function apiError(status: number, code: string, message: string, fields?: Record<string,string>): Response
      verify: "grep -n 'export function apiError' lib/errors.ts && echo CONTRACT_OK"
    - artifact: "lib/validators/wine.ts"
      exports: ["validateCreateWine", "validateUpdateWine"]
      shape: |
        export function validateCreateWine(body: unknown): { valid: boolean; errors: Record<string,string> }
        export function validateUpdateWine(body: unknown): { valid: boolean; errors: Record<string,string> }
      verify: "grep -n 'export function validateCreateWine' lib/validators/wine.ts && echo CONTRACT_OK"
    - artifact: "lib/validators/location.ts"
      exports: ["validateLocationName"]
      shape: |
        export function validateLocationName(name: unknown): { valid: boolean; error?: string }
      verify: "grep -n 'export function validateLocationName' lib/validators/location.ts && echo CONTRACT_OK"
    - artifact: "app/api/wines/route.ts"
      exports: ["GET /api/wines → { wines: Wine[] }", "POST /api/wines → Wine (201)"]
      shape: |
        GET  200: { wines: Wine[] }   // includes location_name (LEFT JOIN), most_recent_rating (DISTINCT ON tasting_notes)
        POST 201: Wine                // all fields; 422 VALIDATION_ERROR on bad input
      verify: "grep -n 'export.*GET\\|export.*POST' app/api/wines/route.ts && echo CONTRACT_OK"
    - artifact: "app/api/wines/[id]/route.ts"
      exports: ["GET /api/wines/[id] → { wine, tasting_notes, bottle_events }", "PUT /api/wines/[id] → Wine", "DELETE /api/wines/[id] → 204"]
      shape: |
        GET    200: { wine: Wine, tasting_notes: TastingNote[], bottle_events: BottleEvent[] }
        PUT    200: Wine
        DELETE 204: (empty)
      verify: "grep -n 'export.*GET\\|export.*PUT\\|export.*DELETE' app/api/wines/\\[id\\]/route.ts && echo CONTRACT_OK"
    - artifact: "app/api/wines/[id]/quantity/route.ts"
      exports: ["PATCH /api/wines/[id]/quantity → PatchQuantityResponse"]
      shape: |
        PATCH 200: { quantity: number, event_id: number | null }
        // delta:1 → increment, no event (event_id: null)
        // delta:-1 → decrement + INSERT bottle_events (event_id: <id>)
      verify: "grep -n 'export.*PATCH' app/api/wines/\\[id\\]/quantity/route.ts && echo CONTRACT_OK"
    - artifact: "app/api/wines/[id]/events/route.ts"
      exports: ["GET /api/wines/[id]/events → { events: BottleEvent[] }"]
      shape: |
        GET 200: { events: BottleEvent[] }  // ordered by event_date DESC
      verify: "grep -n 'export.*GET' app/api/wines/\\[id\\]/events/route.ts && echo CONTRACT_OK"
    - artifact: "app/api/locations/route.ts"
      exports: ["GET /api/locations → { locations: LocationWithCount[] }", "POST /api/locations → LocationWithCount (201)"]
      shape: |
        GET  200: { locations: LocationWithCount[] }  // wine_count per location; ORDER BY LOWER(name) ASC
        POST 201: LocationWithCount                    // wine_count: 0 on create
      verify: "grep -n 'export.*GET\\|export.*POST' app/api/locations/route.ts && echo CONTRACT_OK"
    - artifact: "app/api/locations/[id]/route.ts"
      exports: ["PUT /api/locations/[id] → Location (200)", "DELETE /api/locations/[id] → 204"]
      shape: |
        PUT    200: Location   // renamed; same id
        DELETE 204: (empty)    // transaction: UPDATE wines SET location_id=NULL then DELETE location
      verify: "grep -n 'export.*PUT\\|export.*DELETE' app/api/locations/\\[id\\]/route.ts && echo CONTRACT_OK"
---

<objective>
Implement all P0 API routes for features F0 (Wine CRUD), F1 (Quantity & Bottle Events), and F2 (Storage Locations), plus shared server-side lib modules (database client, error helpers, validators).

Purpose: These are the foundational data access APIs that wave 3a frontend components will call. Every wine CRUD operation, quantity increment/decrement, bottle event logging, and location management action runs through these routes.

Output:
- lib/db.ts: PostgreSQL pool using `pg`, reads DATABASE_URL
- lib/errors.ts: apiError() helper for standard JSON error responses
- lib/validators/wine.ts + lib/validators/location.ts: server-side field validation
- app/api/wines/route.ts: GET (full list with JOINs) + POST (create with validation)
- app/api/wines/[id]/route.ts: GET (detail + notes + events) / PUT (update) / DELETE (cascade)
- app/api/wines/[id]/quantity/route.ts: PATCH (increment/decrement + bottle event log)
- app/api/wines/[id]/events/route.ts: GET (event log for a wine)
- app/api/locations/route.ts: GET (list with wine counts) + POST (create)
- app/api/locations/[id]/route.ts: PUT (rename) + DELETE (null-orphan transaction)
</objective>

<feature_dependencies>
Implements: F0: Wine Inventory CRUD API (GET/POST /api/wines, GET/PUT/DELETE /api/wines/[id])
            F1: Quantity & Bottle Status API (PATCH /api/wines/[id]/quantity, GET /api/wines/[id]/events)
            F2: Storage Locations API (GET/POST /api/locations, PUT/DELETE /api/locations/[id])
Depends on: F0, F1, F2 DB schema from wave 1 (locations, wines, bottle_events tables)
Enables: F3 (Search & Filter reads GET /api/wines), F6 (Dashboard reads location data and wine list)
</feature_dependencies>

<execution_context>
@/root/.config/opencode/pivota_spec-framework/workflows/execute-plan.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/express/implement-the-full-simplewineapp-system-/WAVE-SCHEDULE.md
@project_specs/TechArch-SimpleWineApp.md
@project_specs/FRD-SimpleWineApp.md
@.planning/express/implement-the-full-simplewineapp-system-/01-SUMMARY.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create shared lib modules — db client, error helpers, and validators</name>
  <files>
    lib/db.ts
    lib/errors.ts
    lib/validators/wine.ts
    lib/validators/location.ts
  </files>
  <action>
Create `lib/` directory and four shared modules. All imports use `@/` alias (Next.js default tsconfig paths).

---

**lib/db.ts** — PostgreSQL pool. Uses `pg` (already in package.json from wave 1). Reads `DATABASE_URL` from environment. Exports a single shared `Pool` instance:

```typescript
import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
});
```

---

**lib/errors.ts** — Standard API error response constructor per TechArch §4.1:

```typescript
export function apiError(
  status: number,
  code: string,
  message: string,
  fields?: Record<string, string>
): Response {
  const body: { error: string; message: string; fields?: Record<string, string> } = {
    error: code,
    message,
  };
  if (fields && Object.keys(fields).length > 0) {
    body.fields = fields;
  }
  return Response.json(body, { status });
}
```

---

**lib/validators/wine.ts** — Server-side wine field validation per FRD §F00 Validation Rules.

WINE_TYPES constant must exactly match TechArch DDL CHECK constraint:
`['Red', 'White', 'Rosé', 'Sparkling', 'Dessert', 'Fortified', 'Orange', 'Other']`

```typescript
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
```

---

**lib/validators/location.ts** — Server-side location name validation per FRD §F02 Validation Rules:

```typescript
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
```
  </action>
  <verify>
```bash
grep -n 'export const db' lib/db.ts && echo "DB EXPORT OK"
grep -n 'DATABASE_URL' lib/db.ts && echo "DB URL ENV OK"
grep -n 'export function apiError' lib/errors.ts && echo "API ERROR HELPER OK"
grep -n 'export function validateCreateWine' lib/validators/wine.ts && echo "WINE VALIDATOR OK"
grep -n 'export function validateLocationName' lib/validators/location.ts && echo "LOCATION VALIDATOR OK"
grep -n "Rosé" lib/validators/wine.ts && echo "WINE TYPES INCLUDE ROSE OK"
grep -n 'drinking_window_end.*start' lib/validators/wine.ts && echo "WINDOW RANGE CHECK OK"
```
  </verify>
  <done>
- lib/db.ts exports `db` as a pg Pool reading DATABASE_URL
- lib/errors.ts exports `apiError(status, code, message, fields?)` returning a Response
- lib/validators/wine.ts exports `validateCreateWine` and `validateUpdateWine`; validates all FRD fields including vintage range, 8 wine_type enum values (case-sensitive including Rosé), quantity 1-9999, location_id required, window end >= start
- lib/validators/location.ts exports `validateLocationName`; validates non-empty, max 100 chars
  </done>

  <feature_dependencies>
  Implements: F0 (server-side validation for wine fields), F1 (no validators needed — delta/event_type validated inline), F2 (server-side validation for location name)
  Depends on: db/001_create_locations.sql, db/002_create_wines.sql (wave 1 schema)
  Enables: All API route handlers in Task 2 (import lib/db.ts, lib/errors.ts, lib/validators/*)
  </feature_dependencies>
</task>

<task type="auto">
  <name>Task 2: Implement Wine CRUD API routes (F0) — GET/POST /api/wines and GET/PUT/DELETE /api/wines/[id]</name>
  <files>
    app/api/wines/route.ts
    app/api/wines/[id]/route.ts
  </files>
  <action>
All routes are Next.js 14 App Router Route Handlers. Use `import { db } from '@/lib/db'`, `import { apiError } from '@/lib/errors'`, `import { validateCreateWine, validateUpdateWine, WINE_TYPES } from '@/lib/validators/wine'`. All parameterized queries — never string interpolation.

---

**app/api/wines/route.ts** — GET and POST per TechArch §4.3 Wines table:

```typescript
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
    const b = body as Record<string, unknown>;
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
```

---

**app/api/wines/[id]/route.ts** — GET, PUT, DELETE per TechArch §4.3:

```typescript
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiError } from '@/lib/errors';
import { validateUpdateWine } from '@/lib/validators/wine';

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
```
  </action>
  <verify>
```bash
grep -n 'export async function GET' app/api/wines/route.ts && echo "WINES GET OK"
grep -n 'export async function POST' app/api/wines/route.ts && echo "WINES POST OK"
grep -n 'location_name' app/api/wines/route.ts && echo "LOCATION JOIN OK"
grep -n 'most_recent_rating' app/api/wines/route.ts && echo "MOST RECENT RATING JOIN OK"
grep -n 'export async function GET' app/api/wines/\[id\]/route.ts && echo "WINE GET BY ID OK"
grep -n 'export async function PUT' app/api/wines/\[id\]/route.ts && echo "WINE PUT OK"
grep -n 'export async function DELETE' app/api/wines/\[id\]/route.ts && echo "WINE DELETE OK"
grep -n 'tasting_notes' app/api/wines/\[id\]/route.ts && echo "NOTES IN DETAIL OK"
grep -n 'bottle_events' app/api/wines/\[id\]/route.ts && echo "EVENTS IN DETAIL OK"
grep -n 'WINE_NOT_FOUND' app/api/wines/\[id\]/route.ts && echo "404 ERROR CODE OK"
```
  </verify>
  <done>
- app/api/wines/route.ts: GET returns { wines: Wine[] } with LEFT JOIN to locations (location_name) and LATERAL join to tasting_notes (most_recent_rating); POST validates all fields via validateCreateWine, checks location exists, returns 201 Wine
- app/api/wines/[id]/route.ts: GET returns { wine, tasting_notes, bottle_events } or 404; PUT validates, checks exists, updates all 16 fields, returns 200 Wine; DELETE cascades via DB, returns 204
- All error codes match FRD: WINE_NOT_FOUND (404), VINTAGE_OUT_OF_RANGE (422), INVALID_WINE_TYPE (422), QUANTITY_OUT_OF_RANGE (422), LOCATION_NOT_FOUND (422), WINDOW_INVALID_RANGE (422), DB_WRITE_ERROR (500)
- All queries use parameterized statements ($1, $2…) — no string interpolation
  </done>

  <feature_dependencies>
  Implements: F0: Wine Inventory CRUD API (all 5 endpoints: GET/POST /api/wines, GET/PUT/DELETE /api/wines/[id])
  Depends on: lib/db.ts, lib/errors.ts, lib/validators/wine.ts (Task 1); wines + locations + tasting_notes + bottle_events tables (wave 1)
  Enables: F3 (WineCellarList calls GET /api/wines), F6 (Dashboard calls GET /api/wines), wave 3a WineForm/detail page
  </feature_dependencies>
</task>

<task type="auto">
  <name>Task 3: Implement Quantity/Events API (F1) and Storage Locations API (F2)</name>
  <files>
    app/api/wines/[id]/quantity/route.ts
    app/api/wines/[id]/events/route.ts
    app/api/locations/route.ts
    app/api/locations/[id]/route.ts
  </files>
  <action>
Four route handlers for F1 (quantity PATCH + events GET) and F2 (locations GET/POST and location rename/delete).

---

**app/api/wines/[id]/quantity/route.ts** — PATCH per TechArch §4.3 Quantity & Bottle Events:

```typescript
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiError } from '@/lib/errors';

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
```

---

**app/api/wines/[id]/events/route.ts** — GET per TechArch §4.3:

```typescript
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
```

---

**app/api/locations/route.ts** — GET and POST per TechArch §4.3 Locations:

```typescript
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
```

---

**app/api/locations/[id]/route.ts** — PUT (rename) and DELETE (null-orphan transaction) per TechArch §4.3 and FRD §F02:

```typescript
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiError } from '@/lib/errors';
import { validateLocationName } from '@/lib/validators/location';

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
```
  </action>
  <verify>
```bash
grep -n 'export async function PATCH' app/api/wines/\[id\]/quantity/route.ts && echo "QUANTITY PATCH OK"
grep -n 'INSERT INTO bottle_events' app/api/wines/\[id\]/quantity/route.ts && echo "BOTTLE EVENT INSERT OK"
grep -n 'QUANTITY_ALREADY_ZERO\|QUANTITY_AT_MAX' app/api/wines/\[id\]/quantity/route.ts && echo "QUANTITY BOUNDARY ERRORS OK"
grep -n 'export async function GET' app/api/wines/\[id\]/events/route.ts && echo "EVENTS GET OK"
grep -n 'event_date DESC' app/api/wines/\[id\]/events/route.ts && echo "EVENTS ORDER OK"
grep -n 'export async function GET' app/api/locations/route.ts && echo "LOCATIONS GET OK"
grep -n 'export async function POST' app/api/locations/route.ts && echo "LOCATIONS POST OK"
grep -n 'LOWER.*name.*ASC' app/api/locations/route.ts && echo "LOCATIONS SORT OK"
grep -n 'wine_count' app/api/locations/route.ts && echo "LOCATIONS WINE COUNT OK"
grep -n 'export async function PUT' app/api/locations/\[id\]/route.ts && echo "LOCATION PUT OK"
grep -n 'export async function DELETE' app/api/locations/\[id\]/route.ts && echo "LOCATION DELETE OK"
grep -n 'UPDATE wines SET location_id = NULL' app/api/locations/\[id\]/route.ts && echo "LOCATION DELETE NULL ORPHAN OK"
grep -n 'BEGIN\|COMMIT\|ROLLBACK' app/api/locations/\[id\]/route.ts && echo "LOCATION DELETE TRANSACTION OK"
```
  </verify>
  <done>
- app/api/wines/[id]/quantity/route.ts: PATCH accepts {delta:1|-1}; delta:1 increments and returns {quantity, event_id:null}; delta:-1 validates event_type (required, one of Consumed/Gifted/Opened), runs transaction (UPDATE wines quantity + INSERT bottle_events), returns {quantity, event_id}; enforces min 0 (409 QUANTITY_ALREADY_ZERO) and max 9999 (409 QUANTITY_AT_MAX)
- app/api/wines/[id]/events/route.ts: GET returns {events: BottleEvent[]} ordered by event_date DESC; 404 if wine not found
- app/api/locations/route.ts: GET returns {locations: LocationWithCount[]} with wine_count per location via COUNT JOIN, sorted LOWER(name) ASC; POST creates location, returns 201 LocationWithCount with wine_count:0; 409 LOCATION_NAME_CONFLICT on duplicate (pg error code 23505)
- app/api/locations/[id]/route.ts: PUT renames location, returns 200 Location; 409 on duplicate name; DELETE runs transaction (UPDATE wines SET location_id=NULL then DELETE), returns 204; both return 404 LOCATION_NOT_FOUND if not found
- NFR-009 implemented: location delete is non-destructive; wines orphaned to NULL not deleted
  </done>

  <feature_dependencies>
  Implements: F1: Quantity & Bottle Status API (PATCH /api/wines/[id]/quantity, GET /api/wines/[id]/events)
              F2: Storage Locations API (GET/POST /api/locations, PUT/DELETE /api/locations/[id])
  Depends on: lib/db.ts, lib/errors.ts, lib/validators/location.ts (Task 1); bottle_events + locations tables (wave 1)
  Enables: Wave 3a QuantityControls component, LocationsManager component; wave 3b cellar location filter
  </feature_dependencies>
</task>

</tasks>

<verification>
```bash
# All lib files exist with correct exports
grep -n 'export const db' lib/db.ts && echo "LIB DB OK"
grep -n 'export function apiError' lib/errors.ts && echo "LIB ERRORS OK"
grep -n 'export function validateCreateWine' lib/validators/wine.ts && echo "LIB WINE VALIDATOR OK"
grep -n 'export function validateLocationName' lib/validators/location.ts && echo "LIB LOCATION VALIDATOR OK"

# All API route files exist
ls app/api/wines/route.ts \
   app/api/wines/\[id\]/route.ts \
   app/api/wines/\[id\]/quantity/route.ts \
   app/api/wines/\[id\]/events/route.ts \
   app/api/locations/route.ts \
   app/api/locations/\[id\]/route.ts && echo "ALL ROUTE FILES EXIST"

# FRD error codes present
grep -rn 'WINE_NOT_FOUND' app/api/wines/ && echo "WINE_NOT_FOUND OK"
grep -rn 'VINTAGE_OUT_OF_RANGE' app/api/wines/route.ts && echo "VINTAGE_OUT_OF_RANGE OK"
grep -rn 'INVALID_WINE_TYPE' app/api/wines/route.ts && echo "INVALID_WINE_TYPE OK"
grep -rn 'QUANTITY_ALREADY_ZERO\|QUANTITY_AT_MAX' app/api/wines/ && echo "QUANTITY BOUNDARY CODES OK"
grep -rn 'MISSING_EVENT_TYPE\|INVALID_EVENT_TYPE' app/api/wines/ && echo "EVENT TYPE CODES OK"
grep -rn 'LOCATION_NOT_FOUND' app/api/locations/ && echo "LOCATION_NOT_FOUND OK"
grep -rn 'LOCATION_NAME_CONFLICT' app/api/locations/ && echo "LOCATION_NAME_CONFLICT OK"

# NFR-009: location delete transaction
grep -n 'UPDATE wines SET location_id = NULL' app/api/locations/\[id\]/route.ts && echo "NFR-009 IMPLEMENTED"

# No string interpolation in SQL
! grep -rn 'query.*\$\{' app/api/ && echo "NO SQL INJECTION RISK"

# Integration contracts satisfied
grep -n 'export.*GET\|export.*POST' app/api/wines/route.ts && echo "WINES COLLECTION CONTRACT OK"
grep -n 'export.*PATCH' app/api/wines/\[id\]/quantity/route.ts && echo "QUANTITY CONTRACT OK"
grep -n 'export.*GET\|export.*POST' app/api/locations/route.ts && echo "LOCATIONS CONTRACT OK"
grep -n 'export.*PUT\|export.*DELETE' app/api/locations/\[id\]/route.ts && echo "LOCATIONS ID CONTRACT OK"
```
</verification>

<success_criteria>
- lib/db.ts, lib/errors.ts, lib/validators/wine.ts, lib/validators/location.ts all exist and export correct symbols
- 6 API route files exist covering all 10 endpoints (GET/POST /api/wines, GET/PUT/DELETE /api/wines/[id], PATCH /api/wines/[id]/quantity, GET /api/wines/[id]/events, GET/POST /api/locations, PUT/DELETE /api/locations/[id])
- GET /api/wines includes location_name (LEFT JOIN to locations) and most_recent_rating (LATERAL join on tasting_notes)
- POST /api/wines validates all 16 fields with correct FRD error codes; checks location exists
- PATCH /api/wines/[id]/quantity: delta:1 increments, no event; delta:-1 requires event_type, logs to bottle_events in transaction; enforces 0/9999 boundaries with 409 codes
- DELETE /api/locations/[id] wraps UPDATE wines SET location_id=NULL + DELETE in a single transaction (NFR-009)
- All SQL queries use parameterized statements ($1, $2…) — no string interpolation
- All FRD error codes returned with correct HTTP status codes
</success_criteria>

<output>
After completion, create `.planning/express/implement-the-full-simplewineapp-system-/02a-SUMMARY.md` with:
- Files created/modified
- Key decisions made (e.g., LATERAL join vs subquery, transaction approach for location delete)
- API endpoints implemented and their signatures
- Any deviations from spec (flag prominently)
</output>
