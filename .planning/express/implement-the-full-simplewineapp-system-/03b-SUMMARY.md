---
phase: implement-the-full-simplewineapp-system
plan: 03b
subsystem: frontend-extended
tags: [frontend, cellar, filter, dashboard, tasting-notes, readiness, rating]
dependency_graph:
  requires:
    - "02a: GET /api/wines, GET /api/locations"
    - "02b: GET /api/dashboard, POST /api/wines/[id]/notes, GET/PATCH /api/settings, lib/readiness.ts, lib/rating.ts"
  provides:
    - "app/cellar/page.tsx: /cellar page Server Component"
    - "components/WineCellarList.tsx: client-side search/filter/sort engine"
    - "components/FilterPanel.tsx: 8-dimension filter UI"
    - "components/ReadinessBadge.tsx: color-coded readiness pill"
    - "components/RatingWidget.tsx: 5-star or 100-pt rating input"
    - "components/TastingNoteForm.tsx: full tasting note form with draft"
    - "app/wines/[id]/notes/new/page.tsx: tasting note creation page"
    - "app/page.tsx: Dashboard landing page"
    - "components/DashboardShelf.tsx: Drink Now horizontal-scroll shelf"
  affects:
    - "Wave 4 integration: all frontend routes now functional"
tech_stack:
  added: []
  patterns:
    - "Next.js 14 App Router Server Components for pages with data fetching"
    - "'use client' for interactive components (WineCellarList, FilterPanel, WineCard, RatingWidget, TastingNoteForm)"
    - "sessionStorage graceful degradation (try/catch in private browsing)"
    - "Debounced search (150ms useRef timer)"
    - "Client-side filter pipeline: search → wine_type → readiness → location → country → grape → producer → vintage range → rating"
    - "Inline types per component (no separate lib/types.ts)"
key_files:
  created:
    - components/ReadinessBadge.tsx
    - components/RatingWidget.tsx
    - components/WineCard.tsx
    - components/WineCellarList.tsx
    - components/FilterPanel.tsx
    - app/cellar/page.tsx
    - components/TastingNoteForm.tsx
    - app/wines/[id]/notes/new/page.tsx
    - components/DashboardShelf.tsx
  modified:
    - app/page.tsx (replaced placeholder with full Dashboard implementation)
decisions:
  - "Wine type exported from WineCard.tsx and re-exported by WineCellarList.tsx for DashboardShelf to consume without circular deps"
  - "WineCard uses local useState for quantity (optimistic updates) rather than prop-drilling refetch"
  - "FilterPanel uses internal desktop/mobile layout split via CSS class + style tag to avoid ResizeObserver complexity"
  - "Rating scale not fetched in WineCellarList (kept as 'five_star' default); fetch happens at page level for TastingNoteForm and Dashboard"
  - "CellarFilterState type AND DEFAULT_FILTERS exported from FilterPanel.tsx so WineCellarList can use both"
metrics:
  completed: "2026-06-05"
  tasks: 3
  files: 10
---

# Phase implement-the-full-simplewineapp-system Plan 03b: P1 Frontend Components Summary

**One-liner:** Complete P1 UI — /cellar with 8-dimension FilterPanel + sessionStorage, TastingNoteForm with RatingWidget draft preservation, ReadinessBadge, and Dashboard landing page with stat tiles + Drink Now shelf + breakdowns.

## Files Created / Modified

### Created
| File | Purpose |
|------|---------|
| `components/ReadinessBadge.tsx` | Color-coded pill for 5 readiness states + Cellar Empty; uses `computeReadinessBadge` |
| `components/RatingWidget.tsx` | Interactive 5-star (Gold `#FBCA5C`) or 100-pt numeric input; supports null |
| `components/WineCard.tsx` | Wine list card with name link, producer/vintage, location, ReadinessBadge, rating, qty controls |
| `components/FilterPanel.tsx` | 8-dimension filter panel; exports `CellarFilterState` type and `DEFAULT_FILTERS` |
| `components/WineCellarList.tsx` | Client-side search/filter/sort engine with sessionStorage persistence |
| `app/cellar/page.tsx` | Server Component: fetches wines + locations, parses URL searchParams |
| `components/TastingNoteForm.tsx` | Full tasting note form with sessionStorage draft, RatingWidget, scale switch |
| `app/wines/[id]/notes/new/page.tsx` | Server Component: fetches wine + settings, renders TastingNoteForm |
| `components/DashboardShelf.tsx` | Horizontal-scroll 160×120px Drink Now wine cards |

### Modified
| File | Change |
|------|--------|
| `app/page.tsx` | Replaced placeholder with full Dashboard Server Component |

## Key Implementation Decisions

### 1. Client-side Filter Pipeline Order
Applied in this order: search → wine_type → readiness → location → country → grape → producer → vintage range → rating_min. This order was chosen so the most discriminating filters (search, wine_type) run first for performance.

### 2. sessionStorage Graceful Degradation
All sessionStorage reads/writes are wrapped in try/catch. In private browsing (Safari), sessionStorage.setItem throws a QuotaExceededError; the app degrades gracefully by simply not persisting state.

### 3. Rating Scale Input Convention
The RatingWidget returns a "stored value" internally (star × 20 for five_star mode). The TastingNoteForm converts back to raw API input before POSTing: `apiRating = scale === 'five_star' ? Math.round(rating / 20) : rating`. The server then normalizes via `normalizeRating(input, scale)`. This matches the API contract from wave 2b.

### 4. Wine Type Re-export Pattern
`Wine` interface is defined in `components/WineCard.tsx` and re-exported from `components/WineCellarList.tsx` (`export type { Wine }`). `DashboardShelf` imports from `WineCard` directly to avoid circular dependencies.

### 5. FilterPanel Desktop/Mobile Split
Uses inline `<style>` with media queries and CSS classes (`.filter-mobile`, `.filter-desktop`) to show the mobile bottom drawer only on small screens and the desktop sidebar only on large screens. This avoids the need for ResizeObserver or a useMediaQuery hook.

### 6. WineCard Optimistic Quantity Updates
`WineCard` maintains its own `quantity` state (initialized from `wine.quantity` prop) to show instant feedback on +/- clicks without needing parent state refresh. The PATCH `/api/wines/[id]/quantity` call is fire-and-forget with fallback rollback on error.

## Integration Contracts Consumed

From wave 2a:
- `GET /api/wines → { wines: Wine[] }` — consumed by `app/cellar/page.tsx`
- `GET /api/locations → { locations: LocationWithCount[] }` — consumed by `app/cellar/page.tsx`

From wave 2b:
- `GET /api/dashboard → DashboardResponse` — consumed by `app/page.tsx`
- `POST /api/wines/[id]/notes → 201 TastingNote` — consumed by `TastingNoteForm`
- `GET /api/settings → { rating_scale }` — consumed by both `app/page.tsx` and `app/wines/[id]/notes/new/page.tsx`
- `PATCH /api/settings → { rating_scale }` — consumed by `TastingNoteForm` scale switch
- `lib/readiness.ts: computeReadinessBadge` — consumed by `ReadinessBadge`, `WineCellarList`, `FilterPanel`
- `lib/rating.ts: displayRating` — consumed by `WineCard`, `DashboardShelf`

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | `36e655c` | ReadinessBadge, RatingWidget, WineCard, WineCellarList, FilterPanel, /cellar page |
| Task 2 | `7699504` | TastingNoteForm, /wines/[id]/notes/new page |
| Task 3 | `f24c30f` | Dashboard page, DashboardShelf |

## Deviations from Plan

### Auto-added: Minimal app/layout.tsx (Rule 3 - blocking issue)
- **Found during:** Task 1 (pre-execution check)
- **Issue:** `app/layout.tsx` was referenced by the plan's cellar page but might not exist if wave 3a was not executed. Wave 3a was found to have been partially executed, providing a functional layout.tsx and NavBar.tsx. No deviation was needed — the existing layout.tsx was preserved.
- **Files modified:** None (pre-existing wave 3a output used)

### Auto-fixed: RatingWidget displayRating import (Rule 2 - missing critical)
- **Found during:** Task 1
- **Issue:** Plan spec imported `displayRating` in `RatingWidget.tsx` but didn't use it in the provided code. TypeScript `skipLibCheck` would still lint unused imports. Added `void displayRating` comment guard to suppress while keeping the import for future extensibility.
- **Fix:** Added `void displayRating;` suppressor (no behavioral change)
- **Files modified:** `components/RatingWidget.tsx`

### Design choice: WineCard uses 'use client'
- **Reason:** WineCard needs to track optimistic quantity state (`useState`) for inline +/- controls. The plan's code sample showed it as a pure function but required `onClick` handlers calling fetch — which requires client context.

## Self-Check: PASSED

All created files confirmed:
- `components/ReadinessBadge.tsx` ✓
- `components/RatingWidget.tsx` ✓
- `components/WineCard.tsx` ✓
- `components/WineCellarList.tsx` ✓
- `components/FilterPanel.tsx` ✓
- `app/cellar/page.tsx` ✓
- `components/TastingNoteForm.tsx` ✓
- `app/wines/[id]/notes/new/page.tsx` ✓
- `app/page.tsx` ✓ (modified)
- `components/DashboardShelf.tsx` ✓

All commits verified:
- `36e655c` feat(express-03b): Build ReadinessBadge... ✓
- `7699504` feat(express-03b): Build TastingNoteForm... ✓
- `f24c30f` feat(express-03b): Build Dashboard landing page... ✓

TypeScript: `npx tsc --noEmit` exits 0 ✓
