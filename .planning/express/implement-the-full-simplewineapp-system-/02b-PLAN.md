---
phase: implement-the-full-simplewineapp-system
plan: 02b
type: execute
wave: 2b
depends_on: [1]
files_modified:
  - lib/db.ts
  - lib/readiness.ts
  - lib/rating.ts
  - lib/errors.ts
  - lib/validators/note.ts
  - app/api/wines/[id]/notes/route.ts
  - app/api/settings/route.ts
  - app/api/dashboard/route.ts
autonomous: true

features:
  implements: ["F4", "F5", "F6"]
  depends_on: ["F0", "F1", "F2"]
  enables: ["F3", "F4", "F5", "F6"]

must_haves:
  truths:
    - "POST /api/wines/[id]/notes accepts tasted_on + optional sensory fields + rating; normalizes rating to 1-100; returns 201 with TastingNote"
    - "GET /api/wines/[id]/notes returns notes array ordered by tasted_on DESC"
    - "GET /api/settings returns { rating_scale, updated_at }"
    - "PATCH /api/settings with { rating_scale } updates user_settings row id=1; returns 200 with updated UserSettings"
    - "GET /api/dashboard returns all 8 sections: stats, drink_now_wines, type_breakdown, country_breakdown, decade_breakdown, recently_added, recently_consumed, highest_rated"
    - "computeReadinessBadge() in lib/readiness.ts handles all 5 badge states and all edge cases (start-only, end-only, start=end)"
    - "normalizeRating() in lib/rating.ts converts five_star × 20 → stored; displayRating() divides stored ÷ 20 for five_star display"
    - "lib/validators/note.ts rejects future tasted_on, out-of-range ratings, invalid would_buy_again, invalid occasion"
  artifacts:
    - path: "lib/db.ts"
      provides: "PostgreSQL pool using pg library, reads DATABASE_URL, exports query() helper"
      exports: ["query", "pool"]
    - path: "lib/readiness.ts"
      provides: "computeReadinessBadge(start, end, currentYear) → ReadinessBadge"
      exports: ["computeReadinessBadge", "ReadinessBadge"]
    - path: "lib/rating.ts"
      provides: "normalizeRating(value, scale) → stored 1-100; displayRating(stored, scale) → display value"
      exports: ["normalizeRating", "displayRating", "RatingScale"]
    - path: "lib/errors.ts"
      provides: "Standard API error response constructors"
      exports: ["apiError", "validationError"]
    - path: "lib/validators/note.ts"
      provides: "validateCreateNote(body, ratingScale) → ValidationResult"
      exports: ["validateCreateNote"]
    - path: "app/api/wines/[id]/notes/route.ts"
      provides: "GET + POST /api/wines/[id]/notes"
      exports: ["GET", "POST"]
    - path: "app/api/settings/route.ts"
      provides: "GET + PATCH /api/settings"
      exports: ["GET", "PATCH"]
    - path: "app/api/dashboard/route.ts"
      provides: "GET /api/dashboard → DashboardResponse"
      exports: ["GET"]
  key_links:
    - from: "app/api/wines/[id]/notes/route.ts"
      to: "user_settings table"
      via: "reads rating_scale before normalizing incoming rating"
      pattern: "user_settings"
    - from: "app/api/wines/[id]/notes/route.ts"
      to: "lib/rating.ts normalizeRating"
      via: "normalizeRating(body.rating, ratingScale) before INSERT"
      pattern: "normalizeRating"
    - from: "app/api/dashboard/route.ts"
      to: "lib/readiness.ts SQL CASE expression"
      via: "server-side EXTRACT(YEAR FROM NOW()) in SQL WHERE/CASE"
      pattern: "EXTRACT.*YEAR.*NOW"
    - from: "lib/readiness.ts"
      to: "ReadinessBadge type"
      via: "export type ReadinessBadge = 'Drink Now' | 'Hold' | ..."
      pattern: "ReadinessBadge"

integration_contracts:
  requires:
    - from_plan: "01"
      artifact: "db/004_create_tasting_notes.sql"
      exports: ["tasting_notes table"]
      verify: "grep -n 'CREATE TABLE IF NOT EXISTS tasting_notes' db/004_create_tasting_notes.sql && echo CONTRACT_OK"
    - from_plan: "01"
      artifact: "db/005_create_user_settings.sql"
      exports: ["user_settings table", "seeded row id=1 rating_scale=five_star"]
      verify: "grep -n 'CREATE TABLE IF NOT EXISTS user_settings' db/005_create_user_settings.sql && grep -n 'ON CONFLICT' db/005_create_user_settings.sql && echo CONTRACT_OK"
    - from_plan: "01"
      artifact: "db/002_create_wines.sql"
      exports: ["wines table", "drinking_window_start", "drinking_window_end"]
      verify: "grep -n 'drinking_window_start' db/002_create_wines.sql && echo CONTRACT_OK"
    - from_plan: "01"
      artifact: "db/003_create_bottle_events.sql"
      exports: ["bottle_events table"]
      verify: "grep -n 'CREATE TABLE IF NOT EXISTS bottle_events' db/003_create_bottle_events.sql && echo CONTRACT_OK"
  provides:
    - artifact: "lib/db.ts"
      exports: ["query(text, params)", "pool"]
      shape: |
        import { Pool } from 'pg';
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });
        export async function query(text: string, params?: unknown[]) { return pool.query(text, params); }
        export { pool };
      verify: "grep -n 'export.*query' lib/db.ts && grep -n 'DATABASE_URL' lib/db.ts && echo CONTRACT_OK"
    - artifact: "lib/readiness.ts"
      exports: ["computeReadinessBadge", "ReadinessBadge"]
      shape: |
        export type ReadinessBadge = 'Drink Now' | 'Hold' | 'Approaching Peak' | 'Past Window' | 'No Window Set';
        export function computeReadinessBadge(start: number | null, end: number | null, currentYear?: number): ReadinessBadge
      verify: "grep -n 'export function computeReadinessBadge' lib/readiness.ts && grep -n 'ReadinessBadge' lib/readiness.ts && echo CONTRACT_OK"
    - artifact: "lib/rating.ts"
      exports: ["normalizeRating", "displayRating", "RatingScale"]
      shape: |
        export type RatingScale = 'five_star' | 'hundred_point';
        export function normalizeRating(value: number, scale: RatingScale): number
        export function displayRating(stored: number, scale: RatingScale): number | string
      verify: "grep -n 'export function normalizeRating' lib/rating.ts && grep -n 'export function displayRating' lib/rating.ts && echo CONTRACT_OK"
    - artifact: "lib/errors.ts"
      exports: ["apiError", "validationError"]
      shape: |
        export function apiError(status: number, code: string, message: string, fields?: Record<string,string>): Response
        export function validationError(fields: Record<string, string>): Response
      verify: "grep -n 'export function apiError' lib/errors.ts && grep -n 'export function validationError' lib/errors.ts && echo CONTRACT_OK"
    - artifact: "lib/validators/note.ts"
      exports: ["validateCreateNote"]
      shape: |
        export function validateCreateNote(body: unknown, ratingScale: string): { valid: boolean; errors?: Record<string,string> }
      verify: "grep -n 'export function validateCreateNote' lib/validators/note.ts && echo CONTRACT_OK"
    - artifact: "app/api/wines/[id]/notes/route.ts"
      exports: ["GET /api/wines/[id]/notes → { notes: TastingNote[] }", "POST /api/wines/[id]/notes → TastingNote (201)"]
      shape: |
        POST /api/wines/[id]/notes
        Request: CreateNoteBody { tasted_on: string, appearance?: string, aroma?: string, flavor?: string, finish?: string, rating?: number, would_buy_again?: 'yes'|'no'|'maybe', occasion?: string, guest_feedback?: string }
        Response (201): TastingNote { id, wine_id, tasted_on, appearance, aroma, flavor, finish, rating (normalized 1-100), would_buy_again, occasion, guest_feedback, created_at }
        Response (404): { error: 'WINE_NOT_FOUND', message: '...' }
        Response (422): { error: string, message: string, fields?: Record<string,string> }

        GET /api/wines/[id]/notes
        Response (200): { notes: TastingNote[] } ordered by tasted_on DESC
      verify: "grep -n 'export.*POST' app/api/wines/[id]/notes/route.ts && grep -n 'export.*GET' app/api/wines/[id]/notes/route.ts && echo CONTRACT_OK"
    - artifact: "app/api/settings/route.ts"
      exports: ["GET /api/settings → UserSettings", "PATCH /api/settings → UserSettings"]
      shape: |
        GET /api/settings
        Response (200): UserSettings { rating_scale: 'five_star'|'hundred_point', updated_at: string }

        PATCH /api/settings
        Request: PatchSettingsBody { rating_scale: 'five_star'|'hundred_point' }
        Response (200): UserSettings { rating_scale, updated_at }
        Response (422): { error: 'INVALID_RATING_SCALE', message: '...' }
      verify: "grep -n 'export.*PATCH' app/api/settings/route.ts && grep -n 'export.*GET' app/api/settings/route.ts && echo CONTRACT_OK"
    - artifact: "app/api/dashboard/route.ts"
      exports: ["GET /api/dashboard → DashboardResponse"]
      shape: |
        GET /api/dashboard
        Response (200): DashboardResponse {
          stats: { total_bottles: number, unique_wines: number, drink_now_count: number, approaching_peak_count: number },
          drink_now_wines: Wine[],
          type_breakdown: { wine_type, wine_count, bottle_count }[],
          country_breakdown: { country, wine_count }[],
          decade_breakdown: { decade, wine_count }[],
          recently_added: Wine[],
          recently_consumed: { event_id, event_type, event_date, wine_id, wine_name, producer, vintage }[],
          highest_rated: { wine_id, wine_name, producer, vintage, rating, tasted_on }[]
        }
      verify: "grep -n 'export.*GET' app/api/dashboard/route.ts && grep -n 'drink_now' app/api/dashboard/route.ts && echo CONTRACT_OK"
---

<objective>
Implement the P1 backend layer: shared lib modules (lib/db.ts, lib/readiness.ts, lib/rating.ts, lib/errors.ts, lib/validators/note.ts), the Tasting Notes API (GET/POST /api/wines/[id]/notes), the Settings API (GET/PATCH /api/settings), and the Dashboard aggregate API (GET /api/dashboard) with server-side SQL readiness computation.

Purpose: Wave 2b runs in parallel with wave 2a (backend-core). Together they complete the full API surface before the frontend waves begin. lib/readiness.ts and lib/rating.ts are pure utility modules shared by both the API layer (wave 2b) and the frontend layer (wave 3b, ReadinessBadge, RatingWidget).

Output:
- lib/db.ts: PostgreSQL pool + query helper (reads DATABASE_URL — hostname 'db' per TechArch §3.2)
- lib/readiness.ts: pure computeReadinessBadge() function per TechArch §4.4 algorithm
- lib/rating.ts: normalizeRating() + displayRating() per TechArch §4.5 conversion table
- lib/errors.ts: standard API error response constructors used by all route handlers
- lib/validators/note.ts: server-side validation for CreateNoteBody fields
- app/api/wines/[id]/notes/route.ts: GET + POST with rating normalization via user_settings
- app/api/settings/route.ts: GET + PATCH (upsert single user_settings row id=1)
- app/api/dashboard/route.ts: single GET returning all 8 dashboard data sections via SQL
</objective>

<feature_dependencies>
Implements: F4: Tasting Notes API (POST/GET /api/wines/[id]/notes), Settings API (GET/PATCH /api/settings), rating normalization (lib/rating.ts), note validation (lib/validators/note.ts)
            F5: Drinking window readiness computation (lib/readiness.ts computeReadinessBadge per TechArch §4.4), dashboard SQL CASE for drink_now_wines
            F6: Dashboard aggregate API (GET /api/dashboard) with 8 data sections — stat tiles, drink_now shelf, type/country/decade breakdowns, recently added/consumed, highest rated
Depends on: F0 (wines table), F1 (bottle_events table), F2 (locations table), F4 schema (tasting_notes table), F5 schema (user_settings table) — all from wave 1
Enables: F3 (rating-based sort/filter reads tasting_notes via lib/rating.ts), F4 UI (TastingNoteForm posts to /api/wines/[id]/notes), F5 UI (ReadinessBadge imports computeReadinessBadge from lib/readiness.ts), F6 UI (Dashboard page fetches GET /api/dashboard)
</feature_dependencies>

<execution_context>
@/root/.config/opencode/pivota_spec-framework/workflows/execute-plan.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/express/implement-the-full-simplewineapp-system-/WAVE-SCHEDULE.md
@project_specs/TechArch-SimpleWineApp.md
@project_specs/FRD-SimpleWineApp.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create shared lib modules — lib/db.ts, lib/readiness.ts, lib/rating.ts, lib/errors.ts, lib/validators/note.ts</name>
  <files>
    lib/db.ts
    lib/readiness.ts
    lib/rating.ts
    lib/errors.ts
    lib/validators/note.ts
  </files>
  <action>
Create the `lib/` directory and all shared modules. These are pure utilities consumed by all route handlers in waves 2a, 2b, and client components in wave 3b.

---

**lib/db.ts** — PostgreSQL pool using `pg` library. Reads `DATABASE_URL` from environment (set by docker-compose to `postgresql://postgres:postgres@db:5432/simplewineapp` per TechArch §3.2). Exports a `query()` helper for parameterized queries (no string interpolation — TechArch §5.3):

```typescript
import { Pool, QueryResult, QueryResultRow } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  return pool.query<T>(text, params);
}

export { pool };
```

Note: If `lib/db.ts` was already created by wave 2a (backend-core), skip creating it — just verify it exports `query` and `pool`. Do NOT overwrite an existing working db.ts.

---

**lib/readiness.ts** — Pure function implementing the 5-state badge logic from TechArch §4.4. Copy the TypeScript implementation EXACTLY:

```typescript
export type ReadinessBadge =
  | 'Drink Now'
  | 'Hold'
  | 'Approaching Peak'
  | 'Past Window'
  | 'No Window Set';

/**
 * Compute readiness badge from drinking window + current year.
 * Pure function — no side effects; never cached.
 * From TechArch §4.4 client-side TypeScript specification.
 */
export function computeReadinessBadge(
  start: number | null,
  end: number | null,
  currentYear: number = new Date().getFullYear()
): ReadinessBadge {
  if (start === null && end === null) return 'No Window Set';
  if (start !== null && end !== null) {
    if (currentYear >= start && currentYear <= end) return 'Drink Now';
    if (currentYear >= start - 2 && currentYear < start) return 'Approaching Peak';
    if (currentYear < start - 2) return 'Hold';
    if (currentYear > end) return 'Past Window';
  }
  if (start !== null && end === null) {
    if (currentYear >= start) return 'Drink Now';
    if (currentYear >= start - 2) return 'Approaching Peak';
    return 'Hold';
  }
  if (end !== null && start === null) {
    if (currentYear <= end) return 'Drink Now';
    return 'Past Window';
  }
  return 'No Window Set';
}
```

---

**lib/rating.ts** — Rating scale conversion utilities from TechArch §4.5. Exact conversion table: 5-star × 20 = stored value (1★=20, 2★=40, 3★=60, 4★=80, 5★=100). hundred_point stores as-is. Display: stored ÷ 20 = stars, rounded to nearest 0.5:

```typescript
export type RatingScale = 'five_star' | 'hundred_point';

/**
 * Normalize user-input rating to stored 1-100 scale.
 * From TechArch §4.5: five_star × 20 = stored; hundred_point stored as-is.
 * Called server-side on POST /api/wines/[id]/notes.
 */
export function normalizeRating(value: number, scale: RatingScale): number {
  return scale === 'five_star' ? value * 20 : value;
}

/**
 * Convert stored normalized value back to display value.
 * From TechArch §4.5: stored ÷ 20 = stars (round to nearest 0.5 for display).
 * Called client-side for display; also used in API responses for display fields.
 */
export function displayRating(stored: number, scale: RatingScale): number | string {
  if (scale === 'five_star') return Math.round((stored / 20) * 2) / 2; // 0.5 increments
  return stored;
}
```

---

**lib/errors.ts** — Standard API error response constructors used by all route handlers. Shape from TechArch §4.1:

```typescript
import { NextResponse } from 'next/server';

interface ApiErrorBody {
  error: string;
  message: string;
  fields?: Record<string, string>;
}

/**
 * Standard API error response.
 * TechArch §4.1 standard error shape: { error: ERROR_CODE, message: string, fields?: Record<string,string> }
 */
export function apiError(
  status: number,
  code: string,
  message: string,
  fields?: Record<string, string>
): NextResponse<ApiErrorBody> {
  const body: ApiErrorBody = { error: code, message };
  if (fields && Object.keys(fields).length > 0) body.fields = fields;
  return NextResponse.json(body, { status });
}

/**
 * Shorthand for 422 Unprocessable Entity with field-level errors.
 */
export function validationError(fields: Record<string, string>): NextResponse<ApiErrorBody> {
  return apiError(422, 'VALIDATION_ERROR', 'Validation failed.', fields);
}
```

---

**lib/validators/note.ts** — Server-side validation for tasting note creation. Validates all fields per FRD §F04 Validation Rules:

```typescript
import type { RatingScale } from '../rating';

interface NoteValidationResult {
  valid: boolean;
  errors?: Record<string, string>;
}

const VALID_WOULD_BUY_AGAIN = ['yes', 'no', 'maybe'] as const;
const VALID_OCCASIONS = ['dinner', 'gift', 'casual', 'celebration', 'restaurant', 'tasting', 'other'] as const;

/**
 * Validate tasting note creation body.
 * ratingScale determines valid range for rating field:
 *   - five_star: integer 1-5
 *   - hundred_point: integer 1-100
 * From FRD §F04 Validation Rules.
 */
export function validateCreateNote(
  body: unknown,
  ratingScale: string
): NoteValidationResult {
  if (!body || typeof body !== 'object') {
    return { valid: false, errors: { _: 'Invalid request body.' } };
  }

  const b = body as Record<string, unknown>;
  const errors: Record<string, string> = {};

  // tasted_on: required, valid date, not in the future
  if (!b.tasted_on || typeof b.tasted_on !== 'string') {
    errors.tasted_on = 'Tasting date is required.';
  } else {
    const d = new Date(b.tasted_on);
    if (isNaN(d.getTime())) {
      errors.tasted_on = 'Tasting date must be a valid date (YYYY-MM-DD).';
    } else {
      const today = new Date();
      today.setHours(23, 59, 59, 999); // end of today
      if (d > today) {
        errors.tasted_on = 'Tasting date cannot be in the future.';
      }
    }
  }

  // rating: optional; if provided, integer in allowed range
  if (b.rating !== undefined && b.rating !== null) {
    const r = Number(b.rating);
    if (!Number.isInteger(r)) {
      errors.rating = 'Rating must be a whole number.';
    } else if (ratingScale === 'five_star' && (r < 1 || r > 5)) {
      errors.rating = 'Rating must be between 1 and 5.';
    } else if (ratingScale === 'hundred_point' && (r < 1 || r > 100)) {
      errors.rating = 'Rating must be between 1 and 100.';
    }
  }

  // would_buy_again: optional; if provided must be yes/no/maybe
  if (b.would_buy_again !== undefined && b.would_buy_again !== null) {
    if (!VALID_WOULD_BUY_AGAIN.includes(b.would_buy_again as typeof VALID_WOULD_BUY_AGAIN[number])) {
      errors.would_buy_again = "Invalid 'Would Buy Again' value.";
    }
  }

  // occasion: optional; if provided must be one of 7 enum values
  if (b.occasion !== undefined && b.occasion !== null) {
    if (!VALID_OCCASIONS.includes(b.occasion as typeof VALID_OCCASIONS[number])) {
      errors.occasion = 'Invalid occasion value.';
    }
  }

  // appearance/aroma/flavor/finish: optional; max 1000 chars each
  for (const field of ['appearance', 'aroma', 'flavor', 'finish'] as const) {
    if (b[field] !== undefined && b[field] !== null && typeof b[field] === 'string') {
      if ((b[field] as string).length > 1000) {
        errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} must be 1000 characters or fewer.`;
      }
    }
  }

  // guest_feedback: optional; max 2000 chars
  if (b.guest_feedback !== undefined && b.guest_feedback !== null && typeof b.guest_feedback === 'string') {
    if ((b.guest_feedback as string).length > 2000) {
      errors.guest_feedback = 'Guest feedback must be 2000 characters or fewer.';
    }
  }

  return Object.keys(errors).length === 0 ? { valid: true } : { valid: false, errors };
}
```
  </action>
  <verify>
```bash
# Confirm all lib files exist
ls lib/db.ts lib/readiness.ts lib/rating.ts lib/errors.ts lib/validators/note.ts && echo "ALL LIB FILES EXIST"

# Verify db.ts exports
grep -n 'export.*query' lib/db.ts && grep -n 'DATABASE_URL' lib/db.ts && echo "DB.TS EXPORTS OK"

# Verify readiness.ts exports computeReadinessBadge and ReadinessBadge type
grep -n 'export function computeReadinessBadge' lib/readiness.ts && grep -n 'ReadinessBadge' lib/readiness.ts && echo "READINESS.TS OK"

# Verify rating.ts exports both functions
grep -n 'export function normalizeRating' lib/rating.ts && grep -n 'export function displayRating' lib/rating.ts && echo "RATING.TS OK"

# Verify errors.ts exports apiError and validationError
grep -n 'export function apiError' lib/errors.ts && grep -n 'export function validationError' lib/errors.ts && echo "ERRORS.TS OK"

# Verify note validator exports validateCreateNote
grep -n 'export function validateCreateNote' lib/validators/note.ts && echo "NOTE VALIDATOR OK"

# TypeScript compile check (if tsconfig exists)
npx tsc --noEmit 2>&1 | head -20 || echo "TSC CHECK DONE"
```
  </verify>
  <done>
- lib/db.ts exports `query(text, params)` and `pool`; reads `process.env.DATABASE_URL` (no hardcoded connection string)
- lib/readiness.ts exports `computeReadinessBadge(start, end, currentYear?)` implementing exact 5-state logic from TechArch §4.4; also exports `ReadinessBadge` type
- lib/rating.ts exports `normalizeRating(value, scale)` (five_star × 20 → stored) and `displayRating(stored, scale)` (stored ÷ 20 → 0.5-increment stars or raw); also exports `RatingScale` type
- lib/errors.ts exports `apiError(status, code, message, fields?)` and `validationError(fields)` matching TechArch §4.1 error shape
- lib/validators/note.ts exports `validateCreateNote(body, ratingScale)`: rejects future tasted_on (TASTED_ON_FUTURE), out-of-range rating (RATING_OUT_OF_RANGE), invalid would_buy_again, invalid occasion, oversized text fields
  </done>
</task>

<task type="auto">
  <name>Task 2: Implement Tasting Notes API (GET/POST /api/wines/[id]/notes) and Settings API (GET/PATCH /api/settings)</name>
  <files>
    app/api/wines/[id]/notes/route.ts
    app/api/settings/route.ts
  </files>
  <action>
Create Next.js 14 App Router route handlers for tasting notes and user settings. Both consume `lib/db.ts` for DB access and `lib/errors.ts` for error responses.

---

**app/api/wines/[id]/notes/route.ts** — From TechArch §4.3 Tasting Notes endpoint spec:

```
POST /api/wines/[id]/notes
Request: CreateNoteBody { tasted_on, appearance?, aroma?, flavor?, finish?, rating?, would_buy_again?, occasion?, guest_feedback? }
Response (201): TastingNote { id, wine_id, tasted_on, appearance, aroma, flavor, finish, rating (normalized 1-100), would_buy_again, occasion, guest_feedback, created_at }
Response (404): { error: 'WINE_NOT_FOUND', message: 'Wine not found.' }
Response (422): TASTED_ON_FUTURE | RATING_OUT_OF_RANGE | INVALID_WOULD_BUY_AGAIN | INVALID_OCCASION | VALIDATION_ERROR

GET /api/wines/[id]/notes
Response (200): { notes: TastingNote[] } ordered by tasted_on DESC, then created_at DESC
Response (404): { error: 'WINE_NOT_FOUND', message: 'Wine not found.' }
```

Key implementation notes from FRD §F04 + TechArch §4.3:
- Server reads `user_settings.rating_scale` (row id=1) to determine normalization before storing
- Rating normalized: five_star × 20 = stored value (use `normalizeRating` from lib/rating.ts)
- `tasted_on` stored as DATE; must not be future date
- `rating` stored as INTEGER 1-100 normalized; null if not provided
- Response `rating` is the stored normalized value (1-100), NOT the user-input scale value

```typescript
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
```

---

**app/api/settings/route.ts** — From TechArch §4.3 Settings endpoint spec:

```
GET /api/settings
Response (200): UserSettings { rating_scale: 'five_star'|'hundred_point', updated_at: string }

PATCH /api/settings
Request: PatchSettingsBody { rating_scale: 'five_star'|'hundred_point' }
Response (200): UserSettings { rating_scale, updated_at }
Response (422): { error: 'INVALID_RATING_SCALE', message: '...' }
```

Key notes: Upserts single row id=1; seeded in migration 005. Always exactly one row exists (TechArch §3.2 Migration 005).

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { apiError } from '@/lib/errors';

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
```
  </action>
  <verify>
```bash
# Verify route files exist
ls app/api/wines/[id]/notes/route.ts app/api/settings/route.ts && echo "ROUTE FILES EXIST"

# Verify notes route exports GET and POST
grep -n 'export async function GET' "app/api/wines/[id]/notes/route.ts" && grep -n 'export async function POST' "app/api/wines/[id]/notes/route.ts" && echo "NOTES ROUTE EXPORTS OK"

# Verify settings route exports GET and PATCH
grep -n 'export async function GET' app/api/settings/route.ts && grep -n 'export async function PATCH' app/api/settings/route.ts && echo "SETTINGS ROUTE EXPORTS OK"

# Verify rating normalization in notes route
grep -n 'normalizeRating' "app/api/wines/[id]/notes/route.ts" && echo "NORMALIZATION IN NOTES OK"

# Verify user_settings read in notes route (must read rating_scale before normalizing)
grep -n 'user_settings' "app/api/wines/[id]/notes/route.ts" && echo "SETTINGS READ IN NOTES OK"

# Verify settings route validates rating_scale enum
grep -n 'INVALID_RATING_SCALE' app/api/settings/route.ts && echo "SETTINGS VALIDATION OK"

# TypeScript compile check
npx tsc --noEmit 2>&1 | head -20 || echo "TSC CHECK DONE"
```
  </verify>
  <done>
- app/api/wines/[id]/notes/route.ts exports GET and POST:
  - GET: returns `{ notes: TastingNote[] }` ordered by `tasted_on DESC, created_at DESC`; 404 if wine not found
  - POST: reads `user_settings.rating_scale` before normalization; validates via `validateCreateNote`; normalizes rating via `normalizeRating`; inserts into `tasting_notes`; returns 201 with stored normalized values
  - Error codes: WINE_NOT_FOUND (404), TASTED_ON_FUTURE (422), RATING_OUT_OF_RANGE (422), INVALID_WOULD_BUY_AGAIN (422), INVALID_OCCASION (422), DB_WRITE_ERROR (500)
- app/api/settings/route.ts exports GET and PATCH:
  - GET: returns `{ rating_scale, updated_at }` from `user_settings WHERE id = 1`
  - PATCH: validates rating_scale is `five_star` or `hundred_point`; UPDATEs single row id=1; returns updated settings
  - Error codes: INVALID_RATING_SCALE (422), DB_READ_ERROR (500), DB_WRITE_ERROR (500)
  </done>
</task>

<task type="auto">
  <name>Task 3: Implement Dashboard aggregate API (GET /api/dashboard)</name>
  <files>
    app/api/dashboard/route.ts
  </files>
  <action>
Create the dashboard route handler. This is the most complex API endpoint — it executes 8 SQL queries (or a batched set) and returns all data in one `DashboardResponse`.

From TechArch §4.3 Dashboard endpoint spec:
```
GET /api/dashboard
Response (200): DashboardResponse {
  stats: DashboardStats,
  drink_now_wines: Wine[],
  type_breakdown: TypeBreakdownItem[],
  country_breakdown: CountryBreakdownItem[],
  decade_breakdown: DecadeBreakdownItem[],
  recently_added: Wine[],
  recently_consumed: RecentlyConsumedItem[],
  highest_rated: HighestRatedItem[]
}
```

Use exact SQL queries from FRD §F06 Data Queries section. Server-side `CY` = `EXTRACT(YEAR FROM NOW())::int`:

**Readiness SQL CASE** for Drink Now filter (from TechArch §4.4 server-side SQL):
```sql
-- Drink Now condition:
(w.drinking_window_start IS NOT NULL AND w.drinking_window_end IS NOT NULL
  AND CY >= w.drinking_window_start AND CY <= w.drinking_window_end)
OR (w.drinking_window_start IS NOT NULL AND w.drinking_window_end IS NULL
  AND CY >= w.drinking_window_start)
OR (w.drinking_window_end IS NOT NULL AND w.drinking_window_start IS NULL
  AND CY <= w.drinking_window_end)
```

```typescript
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { apiError } from '@/lib/errors';

export async function GET(): Promise<NextResponse> {
  try {
    const CY = new Date().getFullYear();

    // Run all queries in parallel for performance
    const [
      statsResult,
      drinkNowResult,
      typeBreakdownResult,
      countryBreakdownResult,
      decadeBreakdownResult,
      recentlyAddedResult,
      recentlyConsumedResult,
      highestRatedResult,
    ] = await Promise.all([
      // ── Stat tiles ───────────────────────────────────────────────────────
      query(
        `SELECT
          COALESCE(SUM(quantity), 0)::int AS total_bottles,
          COUNT(*)::int AS unique_wines,
          COUNT(CASE WHEN
            (drinking_window_start IS NOT NULL AND drinking_window_end IS NOT NULL
              AND $1 >= drinking_window_start AND $1 <= drinking_window_end)
            OR (drinking_window_start IS NOT NULL AND drinking_window_end IS NULL
              AND $1 >= drinking_window_start)
            OR (drinking_window_end IS NOT NULL AND drinking_window_start IS NULL
              AND $1 <= drinking_window_end)
            THEN 1 END)::int AS drink_now_count,
          COUNT(CASE WHEN drinking_window_start IS NOT NULL
            AND $1 >= (drinking_window_start - 2)
            AND $1 < drinking_window_start
            THEN 1 END)::int AS approaching_peak_count
        FROM wines`,
        [CY]
      ),

      // ── Drink Now shelf (Wine objects with location_name JOIN) ────────────
      query(
        `SELECT w.id, w.name, w.producer, w.vintage, w.wine_type,
                w.grape, w.country, w.region, w.bottle_size,
                w.quantity, w.location_id,
                l.name AS location_name,
                w.purchase_date, w.purchase_source, w.purchase_price,
                w.drinking_window_start, w.drinking_window_end,
                w.notes, w.created_at, w.updated_at
         FROM wines w
         LEFT JOIN locations l ON w.location_id = l.id
         WHERE
           (w.drinking_window_start IS NOT NULL AND w.drinking_window_end IS NOT NULL
             AND $1 >= w.drinking_window_start AND $1 <= w.drinking_window_end)
           OR (w.drinking_window_start IS NOT NULL AND w.drinking_window_end IS NULL
             AND $1 >= w.drinking_window_start)
           OR (w.drinking_window_end IS NOT NULL AND w.drinking_window_start IS NULL
             AND $1 <= w.drinking_window_end)
         ORDER BY w.name ASC`,
        [CY]
      ),

      // ── Type breakdown ────────────────────────────────────────────────────
      query(
        `SELECT wine_type, COUNT(*)::int AS wine_count,
                COALESCE(SUM(quantity), 0)::int AS bottle_count
         FROM wines GROUP BY wine_type ORDER BY bottle_count DESC`
      ),

      // ── Country/region breakdown (top 10) ─────────────────────────────────
      query(
        `SELECT COALESCE(country, 'Unknown') AS country, COUNT(*)::int AS wine_count
         FROM wines GROUP BY country ORDER BY wine_count DESC LIMIT 10`
      ),

      // ── Decade breakdown ──────────────────────────────────────────────────
      query(
        `SELECT (FLOOR(vintage / 10) * 10)::int AS decade, COUNT(*)::int AS wine_count
         FROM wines WHERE vintage IS NOT NULL
         GROUP BY decade ORDER BY decade DESC`
      ),

      // ── Recently Added (5 wines) ──────────────────────────────────────────
      query(
        `SELECT w.id, w.name, w.producer, w.vintage, w.wine_type,
                w.grape, w.country, w.region, w.bottle_size,
                w.quantity, w.location_id,
                l.name AS location_name,
                w.purchase_date, w.purchase_source, w.purchase_price,
                w.drinking_window_start, w.drinking_window_end,
                w.notes, w.created_at, w.updated_at
         FROM wines w
         LEFT JOIN locations l ON w.location_id = l.id
         ORDER BY w.created_at DESC LIMIT 5`
      ),

      // ── Recently Consumed (5 events) ──────────────────────────────────────
      query(
        `SELECT be.id AS event_id, be.event_type, be.event_date,
                w.id AS wine_id, w.name AS wine_name, w.producer, w.vintage
         FROM bottle_events be
         JOIN wines w ON be.wine_id = w.id
         WHERE be.event_type IN ('Consumed', 'Gifted')
         ORDER BY be.event_date DESC, be.created_at DESC LIMIT 5`
      ),

      // ── Highest Rated (top 5 by most-recent tasting note rating) ──────────
      // Uses DISTINCT ON to get most recent note per wine, then outer sort by rating DESC
      query(
        `SELECT wine_id, wine_name, producer, vintage, rating, tasted_on
         FROM (
           SELECT DISTINCT ON (tn.wine_id)
             tn.wine_id,
             w.name AS wine_name,
             w.producer,
             w.vintage,
             tn.rating,
             tn.tasted_on
           FROM tasting_notes tn
           JOIN wines w ON tn.wine_id = w.id
           ORDER BY tn.wine_id, tn.tasted_on DESC, tn.created_at DESC
         ) most_recent
         WHERE rating IS NOT NULL
         ORDER BY rating DESC
         LIMIT 5`
      ),
    ]);

    const statsRow = statsResult.rows[0];

    return NextResponse.json({
      stats: {
        total_bottles: statsRow.total_bottles,
        unique_wines: statsRow.unique_wines,
        drink_now_count: statsRow.drink_now_count,
        approaching_peak_count: statsRow.approaching_peak_count,
      },
      drink_now_wines: drinkNowResult.rows,
      type_breakdown: typeBreakdownResult.rows,
      country_breakdown: countryBreakdownResult.rows,
      decade_breakdown: decadeBreakdownResult.rows,
      recently_added: recentlyAddedResult.rows,
      recently_consumed: recentlyConsumedResult.rows,
      highest_rated: highestRatedResult.rows,
    });
  } catch (err) {
    console.error('GET /api/dashboard error:', err);
    return apiError(500, 'DB_READ_ERROR', 'Could not load dashboard. Please try again.');
  }
}
```
  </action>
  <verify>
```bash
# Verify dashboard route file exists
ls app/api/dashboard/route.ts && echo "DASHBOARD ROUTE EXISTS"

# Verify route exports GET
grep -n 'export async function GET' app/api/dashboard/route.ts && echo "DASHBOARD GET EXPORT OK"

# Verify all 8 data sections are returned
grep -n 'drink_now_wines' app/api/dashboard/route.ts && echo "DRINK NOW SHELF OK"
grep -n 'type_breakdown' app/api/dashboard/route.ts && echo "TYPE BREAKDOWN OK"
grep -n 'country_breakdown' app/api/dashboard/route.ts && echo "COUNTRY BREAKDOWN OK"
grep -n 'decade_breakdown' app/api/dashboard/route.ts && echo "DECADE BREAKDOWN OK"
grep -n 'recently_added' app/api/dashboard/route.ts && echo "RECENTLY ADDED OK"
grep -n 'recently_consumed' app/api/dashboard/route.ts && echo "RECENTLY CONSUMED OK"
grep -n 'highest_rated' app/api/dashboard/route.ts && echo "HIGHEST RATED OK"

# Verify server-side current year (never cached)
grep -n 'getFullYear' app/api/dashboard/route.ts && echo "CURRENT YEAR COMPUTED AT REQUEST TIME OK"

# Verify DISTINCT ON pattern for most recent rating
grep -n 'DISTINCT ON' app/api/dashboard/route.ts && echo "DISTINCT ON FOR HIGHEST RATED OK"

# Verify Drink Now SQL handles partial window cases
grep -n 'drinking_window_start IS NULL' app/api/dashboard/route.ts && echo "PARTIAL WINDOW HANDLED OK"

# TypeScript compile check
npx tsc --noEmit 2>&1 | head -20 || echo "TSC CHECK DONE"
```
  </verify>
  <done>
- app/api/dashboard/route.ts exports GET returning DashboardResponse with all 8 sections:
  - stats: `{ total_bottles, unique_wines, drink_now_count, approaching_peak_count }` (all integers, 0 when empty)
  - drink_now_wines: Wine[] with location_name JOIN; SQL handles all 3 Drink Now partial-window cases
  - type_breakdown: `[{ wine_type, wine_count, bottle_count }]` ordered by bottle_count DESC
  - country_breakdown: top 10 `[{ country, wine_count }]`; NULL country shown as 'Unknown'
  - decade_breakdown: `[{ decade, wine_count }]` ordered by decade DESC; NULL vintages excluded
  - recently_added: 5 Wine objects ordered by created_at DESC with location_name JOIN
  - recently_consumed: 5 `[{ event_id, event_type, event_date, wine_id, wine_name, producer, vintage }]` where event_type IN (Consumed, Gifted)
  - highest_rated: top 5 `[{ wine_id, wine_name, producer, vintage, rating, tasted_on }]` using DISTINCT ON to get most recent note per wine, then outer ORDER BY rating DESC LIMIT 5
  - CY computed via `new Date().getFullYear()` at request time — never cached
  - All queries run in parallel via Promise.all()
  - 500 DB_READ_ERROR returned on any DB failure
  </done>
</task>

</tasks>

<verification>
```bash
# 1. All lib modules exist with correct exports
ls lib/db.ts lib/readiness.ts lib/rating.ts lib/errors.ts lib/validators/note.ts && echo "ALL LIB FILES OK"
grep -n 'export function computeReadinessBadge' lib/readiness.ts && echo "READINESS FUNCTION OK"
grep -n 'export function normalizeRating' lib/rating.ts && grep -n 'export function displayRating' lib/rating.ts && echo "RATING FUNCTIONS OK"

# 2. All route handlers exist with correct exports
grep -n 'export async function POST' "app/api/wines/[id]/notes/route.ts" && echo "NOTES POST OK"
grep -n 'export async function PATCH' app/api/settings/route.ts && echo "SETTINGS PATCH OK"
grep -n 'export async function GET' app/api/dashboard/route.ts && echo "DASHBOARD GET OK"

# 3. Integration contract: notes route reads user_settings for rating normalization
grep -n 'user_settings' "app/api/wines/[id]/notes/route.ts" && grep -n 'normalizeRating' "app/api/wines/[id]/notes/route.ts" && echo "NOTES NORMALIZATION CONTRACT OK"

# 4. Dashboard SQL correctness: drink_now partial window handling
grep -n 'drinking_window_start IS NULL' app/api/dashboard/route.ts && echo "PARTIAL WINDOW IN DASHBOARD OK"

# 5. TypeScript compile
npx tsc --noEmit 2>&1 | tail -5 && echo "TSC FINAL CHECK DONE"

# 6. Contract verification from wave 1 (DB tables must exist)
grep -n 'CREATE TABLE IF NOT EXISTS tasting_notes' db/004_create_tasting_notes.sql && echo "CONTRACT_OK"
grep -n 'CREATE TABLE IF NOT EXISTS user_settings' db/005_create_user_settings.sql && grep -n 'ON CONFLICT' db/005_create_user_settings.sql && echo "CONTRACT_OK"
```
</verification>

<success_criteria>
- lib/readiness.ts: `computeReadinessBadge(null, null)` → 'No Window Set'; `computeReadinessBadge(2020, 2030, 2025)` → 'Drink Now'; `computeReadinessBadge(2030, null, 2025)` → 'Approaching Peak'; `computeReadinessBadge(2010, 2015, 2025)` → 'Past Window'
- lib/rating.ts: `normalizeRating(4, 'five_star')` → 80; `normalizeRating(75, 'hundred_point')` → 75; `displayRating(80, 'five_star')` → 4
- POST /api/wines/[id]/notes: rating 4 + five_star → stored as 80; future tasted_on → 422 TASTED_ON_FUTURE; invalid occasion → 422 INVALID_OCCASION; wine not found → 404 WINE_NOT_FOUND
- GET /api/settings → `{ rating_scale: 'five_star', updated_at: '...' }`; PATCH /api/settings `{ rating_scale: 'hundred_point' }` → 200 updated; PATCH with invalid value → 422 INVALID_RATING_SCALE
- GET /api/dashboard: returns JSON object with all 8 keys (stats, drink_now_wines, type_breakdown, country_breakdown, decade_breakdown, recently_added, recently_consumed, highest_rated); all keys present even when collection is empty (empty arrays, stats show 0)
- No hardcoded connection strings — all DB access via lib/db.ts reading `DATABASE_URL`
</success_criteria>

<output>
After completion, create `.planning/express/implement-the-full-simplewineapp-system-/02b-SUMMARY.md` with:
- Files created/modified
- Key implementation decisions (e.g., Promise.all for dashboard queries, rating normalization flow)
- Exported function signatures for lib/readiness.ts and lib/rating.ts (consumed by wave 3b frontend)
- Any deviations from spec (flag prominently)
</output>
