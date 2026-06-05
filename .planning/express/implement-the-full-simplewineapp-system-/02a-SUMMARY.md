---
phase: implement-the-full-simplewineapp-system
plan: "02a"
subsystem: api/wines+locations
tags: [nextjs, api-routes, postgresql, crud, wine, locations, bottle-events]
dependency_graph:
  requires:
    - lib/db.ts (Pool export)
    - db/001_create_locations.sql (locations table)
    - db/002_create_wines.sql (wines table)
    - db/003_create_bottle_events.sql (bottle_events table)
    - db/004_create_tasting_notes.sql (tasting_notes table)
  provides:
    - lib/db.ts (db Pool alias, plan 02b augmented with query helper + pool export)
    - lib/errors.ts (apiError() helper)
    - lib/validators/wine.ts (validateCreateWine, validateUpdateWine, WINE_TYPES)
    - lib/validators/location.ts (validateLocationName)
    - app/api/wines/route.ts (GET /api/wines, POST /api/wines)
    - app/api/wines/[id]/route.ts (GET/PUT/DELETE /api/wines/[id])
    - app/api/wines/[id]/quantity/route.ts (PATCH /api/wines/[id]/quantity)
    - app/api/wines/[id]/events/route.ts (GET /api/wines/[id]/events)
    - app/api/locations/route.ts (GET /api/locations, POST /api/locations)
    - app/api/locations/[id]/route.ts (PUT/DELETE /api/locations/[id])
  affects:
    - Wave 3a frontend components (WineCellarList, WineForm, QuantityControls, LocationsManager)
tech_stack:
  added:
    - "Next.js 14 App Router Route Handlers (typed GET/POST/PUT/DELETE/PATCH exports)"
    - "pg Pool parameterized queries (no string interpolation)"
    - "LATERAL JOIN for most_recent_rating (tasting_notes per wine)"
  patterns:
    - "FRD-driven error codes: WINE_NOT_FOUND, VINTAGE_OUT_OF_RANGE, INVALID_WINE_TYPE, QUANTITY_OUT_OF_RANGE, etc."
    - "NFR-009 non-destructive location delete: transaction nulls wines.location_id before DELETE"
    - "pg error code 23505 → 409 LOCATION_NAME_CONFLICT for unique constraint violations"
    - "PATCH quantity: delta:1 no-event, delta:-1 requires event_type + transactional bottle_events INSERT"
key_files:
  created:
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
  modified: []
decisions:
  - "LATERAL JOIN chosen over correlated subquery for most_recent_rating in GET /api/wines — cleaner query plan, explicit LIMIT 1, ordered by tasted_on DESC then created_at DESC"
  - "DELETE /api/locations/[id] uses SELECT FOR UPDATE on location row before nulling wines.location_id to prevent race conditions"
  - "POST /api/wines: INSERT first then re-fetch with JOIN to get location_name in single roundtrip (avoids redundant location JOIN in INSERT ... RETURNING)"
  - "validateUpdateWine aliased to validateCreateWine — PUT is a full-replace operation with identical field requirements"
  - "lib/db.ts augmented by parallel plan 02b with query() helper + pool export; backwards-compatible db alias preserved for 02a routes"
metrics:
  duration: "~15 minutes"
  completed_date: "2026-06-05"
  tasks_completed: 3
  files_created: 10
  files_modified: 0
---

# Phase implement-the-full-simplewineapp-system Plan 02a: P0 API Routes (Wines, Locations, Bottle Events) Summary

**One-liner:** Full Wine CRUD + Quantity/BottleEvent + Locations REST API using Next.js 14 App Router handlers with parameterized pg queries, FRD-spec error codes, and NFR-009 non-destructive location delete transaction.

---

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create shared lib modules — db client, error helpers, and validators | 9ff1680 | lib/db.ts, lib/errors.ts, lib/validators/wine.ts, lib/validators/location.ts |
| 2 | Implement Wine CRUD API routes (F0) | 3582e2d | app/api/wines/route.ts, app/api/wines/[id]/route.ts |
| 3 | Implement Quantity/Events API (F1) and Storage Locations API (F2) | 45cc84f | app/api/wines/[id]/quantity/route.ts, app/api/wines/[id]/events/route.ts, app/api/locations/route.ts, app/api/locations/[id]/route.ts |

---

## Files Created

### Shared Library Modules

**lib/db.ts**
- PostgreSQL Pool using `pg`, reads `DATABASE_URL` env var, throws if unset
- Exports `db` (Pool instance); parallel plan 02b augmented with `query()` helper and `pool` named export (backwards-compatible)

**lib/errors.ts**
- `apiError(status, code, message, fields?)` — returns `Response.json({ error, message, fields? }, { status })`
- Used by all route handlers for consistent error shape per TechArch §4.1

**lib/validators/wine.ts**
- `WINE_TYPES` constant: `['Red', 'White', 'Rosé', 'Sparkling', 'Dessert', 'Fortified', 'Orange', 'Other']` — matches DDL CHECK constraint exactly
- `validateCreateWine(body)`: validates all 16 wine fields including vintage range (1900–currentYear+1), 8 wine_type enum values (case-sensitive including Rosé), quantity 1–9999, required location_id, optional fields with max lengths, drinking window end ≥ start
- `validateUpdateWine`: aliased to `validateCreateWine` (PUT is full-replace)

**lib/validators/location.ts**
- `validateLocationName(name)`: non-empty string, max 100 chars

---

### API Route Handlers

**app/api/wines/route.ts** — GET /api/wines + POST /api/wines
- GET: `SELECT w.*, l.name AS location_name, tn.rating AS most_recent_rating FROM wines w LEFT JOIN locations l ... LEFT JOIN LATERAL (SELECT rating FROM tasting_notes WHERE wine_id = w.id ORDER BY tasted_on DESC, created_at DESC LIMIT 1) tn ON true ORDER BY w.created_at DESC`
- POST: validates via `validateCreateWine`, checks location exists, inserts all 16 fields, re-fetches with JOIN to return `location_name`, returns 201

**app/api/wines/[id]/route.ts** — GET/PUT/DELETE /api/wines/[id]
- GET: returns `{ wine, tasting_notes, bottle_events }` with LATERAL join for most_recent_rating; 404 WINE_NOT_FOUND if not found
- PUT: validates all fields, checks wine exists (404) and location exists (422 LOCATION_NOT_FOUND), updates all 16 fields, returns updated wine with JOIN
- DELETE: `DELETE FROM wines WHERE id = $1 RETURNING id`; 404 if not found; DB CASCADE handles notes + events

**app/api/wines/[id]/quantity/route.ts** — PATCH /api/wines/[id]/quantity
- `delta: 1` → increment quantity, return `{ quantity: newQty, event_id: null }` (no event)
- `delta: -1` → validate `event_type` (required, must be `Consumed|Gifted|Opened`), run transaction: `UPDATE wines SET quantity` + `INSERT INTO bottle_events`, return `{ quantity: newQty, event_id: <id> }`
- 409 QUANTITY_AT_MAX (>=9999) and 409 QUANTITY_ALREADY_ZERO (<=0) boundary enforcement

**app/api/wines/[id]/events/route.ts** — GET /api/wines/[id]/events
- Checks wine exists (404 WINE_NOT_FOUND), returns `{ events: BottleEvent[] }` ordered by `event_date DESC, created_at DESC`

**app/api/locations/route.ts** — GET /api/locations + POST /api/locations
- GET: `SELECT l.*, COUNT(w.id)::integer AS wine_count FROM locations l LEFT JOIN wines w ON w.location_id = l.id GROUP BY l.id ... ORDER BY LOWER(l.name) ASC`
- POST: validates name, inserts, returns 201 `LocationWithCount` with `wine_count: 0`; pg error 23505 → 409 LOCATION_NAME_CONFLICT

**app/api/locations/[id]/route.ts** — PUT/DELETE /api/locations/[id]
- PUT: validates name, checks location exists (404), `UPDATE locations SET name = $1`, returns updated Location; 409 on duplicate name
- DELETE (NFR-009): `BEGIN` → `SELECT ... FOR UPDATE` → `UPDATE wines SET location_id = NULL WHERE location_id = $1` → `DELETE FROM locations WHERE id = $1` → `COMMIT`; rollback on error; returns 204

---

## API Endpoints Implemented

| Method | Path | Returns | Key Error Codes |
|--------|------|---------|-----------------|
| GET | /api/wines | 200 { wines: Wine[] } | 500 DB_READ_ERROR |
| POST | /api/wines | 201 Wine | 422 VINTAGE_OUT_OF_RANGE, INVALID_WINE_TYPE, QUANTITY_OUT_OF_RANGE, LOCATION_NOT_FOUND, WINDOW_INVALID_RANGE, VALIDATION_ERROR |
| GET | /api/wines/[id] | 200 { wine, tasting_notes, bottle_events } | 404 WINE_NOT_FOUND |
| PUT | /api/wines/[id] | 200 Wine | 404 WINE_NOT_FOUND, 422 (same as POST) |
| DELETE | /api/wines/[id] | 204 | 404 WINE_NOT_FOUND |
| PATCH | /api/wines/[id]/quantity | 200 { quantity, event_id } | 400 INVALID_DELTA, 409 QUANTITY_ALREADY_ZERO/QUANTITY_AT_MAX, 422 MISSING_EVENT_TYPE/INVALID_EVENT_TYPE |
| GET | /api/wines/[id]/events | 200 { events: BottleEvent[] } | 404 WINE_NOT_FOUND |
| GET | /api/locations | 200 { locations: LocationWithCount[] } | 500 DB_READ_ERROR |
| POST | /api/locations | 201 LocationWithCount | 409 LOCATION_NAME_CONFLICT, 422 VALIDATION_ERROR |
| PUT | /api/locations/[id] | 200 Location | 404 LOCATION_NOT_FOUND, 409 LOCATION_NAME_CONFLICT, 422 VALIDATION_ERROR |
| DELETE | /api/locations/[id] | 204 | 404 LOCATION_NOT_FOUND |

---

## Key Decisions Made

1. **LATERAL JOIN for most_recent_rating** — Used `LEFT JOIN LATERAL (SELECT rating FROM tasting_notes WHERE wine_id = w.id ORDER BY tasted_on DESC, created_at DESC LIMIT 1) tn ON true` rather than a correlated subquery or window function. LATERAL is more explicit and readable while achieving correct ordering behavior.

2. **SELECT FOR UPDATE in location DELETE transaction** — Locks the location row before nulling wines.location_id to prevent race conditions where concurrent requests might re-assign wines to the being-deleted location.

3. **POST /api/wines two-step fetch** — INSERT ... RETURNING gives back the row data, then a second SELECT with JOIN retrieves `location_name`. Avoids a complex INSERT ... RETURNING with JOIN, trading one extra query for cleaner SQL.

4. **validateUpdateWine = validateCreateWine alias** — PUT is a full-replace operation (all fields required); identical validation rules apply for create and update.

5. **lib/db.ts parallel augmentation (02b)** — The parallel `02b` plan augmented `lib/db.ts` with a `query()` helper function and `pool` named export while preserving the `db` alias for backward compatibility. All 02a routes continue to work unchanged via `import { db } from '@/lib/db'`.

---

## Deviations from Plan

### Environment: Parallel 02b Plan Modified lib/db.ts

**[Non-breaking — parallel wave execution]**
- **Found during:** SUMMARY creation
- **Issue:** The parallel `02b` plan ran between Task 1 and Task 2 commits and augmented `lib/db.ts` with a `query()` helper and named `pool` export
- **Impact:** None — `db` alias preserved and all 02a routes use `import { db } from '@/lib/db'` which still works correctly
- **Net result:** lib/db.ts now has richer API than originally planned by 02a, which benefits downstream consumers

---

## Self-Check

### Files Exist
- [x] lib/db.ts ✓
- [x] lib/errors.ts ✓
- [x] lib/validators/wine.ts ✓
- [x] lib/validators/location.ts ✓
- [x] app/api/wines/route.ts ✓
- [x] app/api/wines/[id]/route.ts ✓
- [x] app/api/wines/[id]/quantity/route.ts ✓
- [x] app/api/wines/[id]/events/route.ts ✓
- [x] app/api/locations/route.ts ✓
- [x] app/api/locations/[id]/route.ts ✓

### Commits Exist
- [x] 9ff1680 — Task 1 (lib/db.ts, lib/errors.ts, lib/validators/wine.ts, lib/validators/location.ts)
- [x] 3582e2d — Task 2 (app/api/wines/route.ts, app/api/wines/[id]/route.ts)
- [x] 45cc84f — Task 3 (quantity, events, locations, locations/[id] routes)

## Self-Check: PASSED
