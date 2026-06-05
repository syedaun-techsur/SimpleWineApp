---
phase: implement-the-full-simplewineapp-system
plan: "02b"
subsystem: backend-api/tasting-notes-settings-dashboard
tags: [nextjs, api-routes, tasting-notes, settings, dashboard, postgresql, rating-normalization, readiness]
dependency_graph:
  requires:
    - "01: db/004_create_tasting_notes.sql (tasting_notes table)"
    - "01: db/005_create_user_settings.sql (user_settings table, seeded row id=1)"
    - "01: db/002_create_wines.sql (wines table with drinking_window_start/end)"
    - "01: db/003_create_bottle_events.sql (bottle_events table)"
  provides:
    - "lib/db.ts: PostgreSQL pool + query() helper + pool export"
    - "lib/readiness.ts: computeReadinessBadge() pure function"
    - "lib/rating.ts: normalizeRating() + displayRating() conversion utilities"
    - "lib/errors.ts: apiError() + validationError() standard error constructors"
    - "lib/validators/note.ts: validateCreateNote() server-side validation"
    - "GET /api/wines/[id]/notes: returns notes array ordered tasted_on DESC"
    - "POST /api/wines/[id]/notes: validates, normalizes rating, inserts, returns 201"
    - "GET /api/settings: returns { rating_scale, updated_at }"
    - "PATCH /api/settings: updates rating_scale, returns updated settings"
    - "GET /api/dashboard: all 8 sections in parallel SQL queries"
  affects:
    - "wave 3b: ReadinessBadge component imports computeReadinessBadge from lib/readiness.ts"
    - "wave 3b: RatingWidget imports normalizeRating/displayRating from lib/rating.ts"
    - "wave 3a/3b: all route handlers use lib/db.ts query() and lib/errors.ts apiError()"
tech_stack:
  added:
    - "tsconfig.json (Next.js 14 TypeScript config with @/* path alias)"
  patterns:
    - "Promise.all() for parallel dashboard queries (8 simultaneous DB calls)"
    - "DISTINCT ON PostgreSQL pattern for most-recent-per-group without subquery overhead"
    - "five_star × 20 = stored value normalization (1★=20, 2★=40 ... 5★=100)"
    - "COALESCE + ::int casts for null-safe integer stats"
    - "Server-side CY = new Date().getFullYear() at request time (never cached)"
    - "Partial drinking window SQL: handles both-set, start-only, end-only cases"
key_files:
  created:
    - lib/readiness.ts
    - lib/rating.ts
    - lib/validators/note.ts
    - app/api/wines/[id]/notes/route.ts
    - app/api/settings/route.ts
    - app/api/dashboard/route.ts
    - tsconfig.json
  modified:
    - lib/db.ts (added query() helper + pool export; kept db alias for 2a compatibility)
    - lib/errors.ts (updated to NextResponse with ApiErrorBody type; added validationError())
decisions:
  - "lib/db.ts augmented (not replaced): added query()/pool exports while keeping db alias export so wave 2a routes (which use `db`) continue to compile"
  - "lib/errors.ts updated to NextResponse instead of plain Response to enable typed ApiErrorBody return type needed by 02b routes"
  - "tsconfig.json created since it was missing — required for npx tsc --noEmit type-checking and @/* path alias resolution"
  - "Dashboard uses Promise.all() across all 8 queries for minimum latency on page load"
  - "Highest-rated section uses PostgreSQL DISTINCT ON per wine_id to get most recent tasting note, then outer ORDER BY rating DESC LIMIT 5 — avoids window function complexity"
  - "CY (current year) computed fresh on each request via new Date().getFullYear() — per TechArch §4.4, never cached so readiness reflects real time"
metrics:
  duration: "~4 minutes"
  completed_date: "2026-06-05"
  tasks_completed: 3
  files_created: 7
  files_modified: 2
---

# Phase implement-the-full-simplewineapp-system Plan 02b: P1 Backend API Layer Summary

**One-liner:** Tasting Notes + Settings + Dashboard APIs with five_star×20 rating normalization and 8-section parallel SQL dashboard queries.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Create shared lib modules | af2c8e0 | lib/db.ts, lib/errors.ts, lib/readiness.ts, lib/rating.ts, lib/validators/note.ts, tsconfig.json |
| 2 | Implement Tasting Notes API and Settings API | dce3d58 | app/api/wines/[id]/notes/route.ts, app/api/settings/route.ts |
| 3 | Implement Dashboard aggregate API | db24fb3 | app/api/dashboard/route.ts |

## Exported Function Signatures (consumed by wave 3b frontend)

### lib/readiness.ts
```typescript
export type ReadinessBadge = 'Drink Now' | 'Hold' | 'Approaching Peak' | 'Past Window' | 'No Window Set';
export function computeReadinessBadge(start: number | null, end: number | null, currentYear?: number): ReadinessBadge
```

### lib/rating.ts
```typescript
export type RatingScale = 'five_star' | 'hundred_point';
export function normalizeRating(value: number, scale: RatingScale): number
// five_star: value × 20 → stored (1★→20, 2★→40, 3★→60, 4★→80, 5★→100)
// hundred_point: stored as-is

export function displayRating(stored: number, scale: RatingScale): number | string
// five_star: stored ÷ 20, rounded to nearest 0.5 increment
// hundred_point: returned as-is
```

### lib/errors.ts
```typescript
export function apiError(status: number, code: string, message: string, fields?: Record<string,string>): NextResponse<ApiErrorBody>
export function validationError(fields: Record<string, string>): NextResponse<ApiErrorBody>
```

### lib/validators/note.ts
```typescript
export function validateCreateNote(body: unknown, ratingScale: string): { valid: boolean; errors?: Record<string,string> }
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Wave 2a partial execution required augmented lib/db.ts**
- **Found during:** Task 1
- **Issue:** Wave 2a had already created `lib/db.ts` (exported `db` Pool) and `lib/errors.ts` (used plain `Response.json`). This plan requires `query()` helper and `pool` exports from lib/db.ts, and `NextResponse<ApiErrorBody>` from lib/errors.ts.
- **Fix:** Augmented lib/db.ts to add `query()` + `pool` exports while keeping `db` alias for wave 2a backward compatibility. Updated lib/errors.ts to use `NextResponse` with proper TypeScript typing and added `validationError()`.
- **Files modified:** lib/db.ts, lib/errors.ts
- **Commit:** af2c8e0

**2. [Rule 3 - Blocking] Missing tsconfig.json prevented TypeScript compilation**
- **Found during:** Task 1 verification
- **Issue:** No `tsconfig.json` existed in the project root — required for `npx tsc --noEmit` and `@/*` path alias resolution used by all route handlers.
- **Fix:** Created standard Next.js 14 tsconfig.json with `moduleResolution: bundler`, `@/*` path alias, and `noEmit: true`.
- **Files modified:** tsconfig.json (created)
- **Commit:** af2c8e0

## Self-Check: PASSED

**Files verified:**
- FOUND: lib/db.ts
- FOUND: lib/readiness.ts
- FOUND: lib/rating.ts
- FOUND: lib/errors.ts
- FOUND: lib/validators/note.ts
- FOUND: app/api/wines/[id]/notes/route.ts
- FOUND: app/api/settings/route.ts
- FOUND: app/api/dashboard/route.ts
- FOUND: tsconfig.json

**Commits verified:**
- FOUND: af2c8e0 (Task 1 - shared lib modules)
- FOUND: dce3d58 (Task 2 - Tasting Notes API + Settings API)
- FOUND: db24fb3 (Task 3 - Dashboard aggregate API)

**TypeScript:** `npx tsc --noEmit` passes with zero errors.
