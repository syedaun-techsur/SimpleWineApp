---
slug: implement-the-full-simplewineapp-system-
verified: 2026-06-05T16:10:00Z
build: passed
app_url: http://localhost:3000
smoke: passed
dead_links: 0
routes_failed: 0
test_attempts: 8
playwright_pass: 55
playwright_fail: 0
playwright_skip: 0
---

# UAT — Express Task: implement-the-full-simplewineapp-system-

**Verified:** 2026-06-05
**Build:** ✓ Passed (attempt 4/10 after fixes)
**Application:** http://localhost:3000

## Test Results

| Status | Count |
|--------|-------|
| ✓ Pass | 55 |
| ✗ Fail | 0 |
| — Skip | 0 |
| **Total** | **55** |

**Fix cycles used:** 8/10

## User Story Coverage

| Story | Title | Status |
|-------|-------|--------|
| US-0.1 | Add a New Wine | ✓ Pass |
| US-0.2 | Validate Wine Form Inputs | ✓ Pass |
| US-0.3 | View Wine Detail | ✓ Pass |
| US-0.4 | Edit an Existing Wine | ✓ Pass |
| US-0.5 | Delete a Wine Record | ✓ Pass |
| US-1.1 | Increment Bottle Count | ✓ Pass |
| US-1.2 | Log a Bottle Removal Event | ✓ Pass |
| US-1.3 | View Bottle Event History | ✓ Pass |
| US-1.4 | See "Cellar Empty" State | ✓ Pass |
| US-2.1 | View All Storage Locations | ✓ Pass |
| US-2.2 | Create a Storage Location | ✓ Pass |
| US-2.3 | Rename a Storage Location | ✓ Pass |
| US-2.4 | Delete a Storage Location | ✓ Pass |
| US-3.1 | Search the Collection by Text | ✓ Pass |
| US-3.2 | Filter the Collection by Multiple Dimensions | ✓ Pass |
| US-3.3 | Sort the Collection List | ✓ Pass |
| US-4.1 | Add a Tasting Note | ✓ Pass |
| US-4.3 | View All Tasting Notes for a Wine | ✓ Pass |
| US-5.1 | Set a Drinking Window | ✓ Pass |
| US-5.2 | See Readiness Badge | ✓ Pass |
| US-6.1 | View Summary Stats at a Glance | ✓ Pass |
| US-6.2 | Browse the "Drink Now" Shelf | ✓ Pass |
| US-6.3 | See Recently Added, Consumed, and Highest Rated | ✓ Pass |
| US-6.4 | Explore Collection Breakdowns | ✓ Pass |

## Failing Tests

None — all tests passed.

## Playwright Report

Test file: `e2e/uat/implement-the-full-simplewineapp-system-.spec.ts`
Results: `playwright-results.json`

## Build Log

Build system: docker-compose (Next.js 14 + PostgreSQL 16)
Build attempts: 4/10
Build status: ✓ Passed

### Build fixes applied:
1. **Lazy DB pool initialization** — `lib/db.ts` threw at module-load time when `DATABASE_URL` was unset during `next build`. Fixed with lazy getter pattern.
2. **`force-dynamic` on API routes** — Added `export const dynamic = 'force-dynamic'` to all 9 API routes and 3 DB-fetching pages to prevent static generation.
3. **`public/` directory missing** — Dockerfile COPY step referenced `/app/public` which didn't exist. Created `public/.gitkeep`.
4. **SQL migration syntax error** — `CONSTRAINT UNIQUE (LOWER(name))` is not valid PostgreSQL inline syntax. Replaced with `CREATE UNIQUE INDEX ... ON locations (LOWER(name))`.

### Application fixes applied during UAT:
5. **Tasting note prompt unmount bug** — `QuantityControls.onSuccess` called `setShowModal(false)` immediately, unmounting `RemoveBottleModal` before `showNotePrompt` could render. Fixed by passing `showingNotePrompt` flag to `onSuccess` and deferring modal close until after the prompt is dismissed.

## Smoke Test

| Route | Status |
|-------|--------|
| / | 200 ✓ |
| /cellar | 200 ✓ |
| /locations | 200 ✓ |
| /wines/new | 200 ✓ |
| /api/wines | 200 ✓ |
| /api/locations | 200 ✓ |
| /api/dashboard | 200 ✓ |
| /api/settings | 200 ✓ |

## Next Steps

All acceptance criteria verified. Express task `implement-the-full-simplewineapp-system-` is production-ready.
