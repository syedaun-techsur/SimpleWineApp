---
phase: implement-the-full-simplewineapp-system
plan: 03a
subsystem: frontend-ui
tags: [ui, brand, layout, forms, components, wine-crud, locations, quantity-controls]
dependency_graph:
  requires:
    - "01 (next.config.mjs, no X-Frame-Options header, output: standalone)"
    - "2a (GET/POST /api/wines, GET/PUT/DELETE /api/wines/[id], PATCH /api/wines/[id]/quantity, GET/POST /api/locations, PUT/DELETE /api/locations/[id])"
  provides:
    - "app/layout.tsx → NavBar, Montserrat/Open Sans fonts"
    - "app/globals.css → TechSur brand tokens"
    - "app/components/NavBar.tsx → NavBar"
    - "app/components/ConfirmModal.tsx → ConfirmModal"
    - "app/components/ReadinessBadge.tsx → ReadinessBadge, computeReadinessBadge, CellarEmptyBadge"
    - "app/components/QuantityControls.tsx → QuantityControls"
    - "app/components/RemoveBottleModal.tsx → RemoveBottleModal"
    - "app/wines/new/WineFormClient.tsx → WineFormClient (create + edit)"
    - "All P0 routes: /, /cellar, /wines/new, /wines/[id], /wines/[id]/edit, /locations"
  affects:
    - "wave 3b: WineCellarList, TastingNoteForm, Dashboard all depend on NavBar, QuantityControls, ReadinessBadge"
tech_stack:
  added:
    - "next/font/google: Montserrat 900, Open Sans 400/600/700"
  patterns:
    - "Server component → client component boundary: page.tsx (server fetches) → WineFormClient (client handles state/submit)"
    - "WineFormClient co-located in app/wines/new/ (shared by edit page via relative import)"
    - "Client components co-located near their server component shells"
    - "CSS custom properties for brand tokens (no Tailwind)"
key_files:
  created:
    - app/globals.css
    - app/layout.tsx
    - app/components/NavBar.tsx
    - app/components/ConfirmModal.tsx
    - app/components/ReadinessBadge.tsx
    - app/components/QuantityControls.tsx
    - app/components/RemoveBottleModal.tsx
    - app/wines/new/WineFormClient.tsx
    - app/wines/new/page.tsx
    - app/wines/[id]/page.tsx
    - app/wines/[id]/WineDeleteButton.tsx
    - app/wines/[id]/not-found.tsx
    - app/wines/[id]/edit/page.tsx
    - app/locations/page.tsx
    - app/page.tsx
  modified:
    - package.json (dev script: added -H 0.0.0.0 -p 3000 for preview access)
decisions:
  - "WineFormClient co-located in app/wines/new/ instead of app/components/ — reduces coupling; edit page imports via relative path ../../new/WineFormClient"
  - "ReadinessBadge is a pure synchronous function with no 'use client' directive — works in both server and client components without hydration overhead"
  - "RemoveBottleModal shows tasting note prompt inline (not a new modal) as specified in UX mockup — same scrim component, different inner content"
  - "ConfirmModal scrim click does NOT close — prevents accidental dismissal of destructive action (per spec)"
  - "cellar/page.tsx NOT overwritten — wave 3b already provided a more complete implementation; plan's placeholder was superseded"
metrics:
  duration: "~7 minutes"
  completed_date: "2026-06-05"
  tasks_completed: 2
  files_created: 15
  files_modified: 1
---

# Phase implement-the-full-simplewineapp-system Plan 03a: Frontend UI — Brand System, NavBar, Shared Components, Wine Pages, Locations Summary

**One-liner:** Full P0 frontend UI with TechSur brand tokens, mobile-first NavBar, QuantityControls/RemoveBottleModal/ConfirmModal/ReadinessBadge components, WineForm create/edit, wine detail page, and LocationsManager.

---

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Brand system, root layout, NavBar, and shared UI primitives | `4495c9c` | globals.css, layout.tsx, NavBar.tsx, ConfirmModal.tsx, ReadinessBadge.tsx, package.json |
| 2 | WineForm, wine detail, QuantityControls, RemoveBottleModal, locations page | `287637d` | QuantityControls.tsx, RemoveBottleModal.tsx, WineFormClient.tsx, wines/new/page.tsx, wines/[id]/page.tsx, WineDeleteButton.tsx, wines/[id]/not-found.tsx, wines/[id]/edit/page.tsx, locations/page.tsx, page.tsx |

---

## Routes Implemented

| Route | Status | Notes |
|-------|--------|-------|
| `/` | Minimal placeholder | Full dashboard in wave 3b |
| `/cellar` | Full implementation | Wave 3b already implemented WineCellarList |
| `/wines/new` | Full | WineFormClient with 6 required fields + optional section |
| `/wines/[id]` | Full | Hero, drinking window, purchase, notes, tasting notes, bottle history, delete |
| `/wines/[id]/edit` | Full | Pre-populated WineFormClient; Location Unknown state |
| `/locations` | Full | Add/rename/delete + ConfirmModal; drill-through links |

---

## Integration Contracts Satisfied

| Contract | From Plan | Status |
|----------|-----------|--------|
| GET /api/wines, POST /api/wines | 2a | ✅ Consumed by WineFormClient (POST) and cellar page (GET) |
| GET /api/wines/[id], PUT, DELETE | 2a | ✅ Consumed by wines/[id]/page.tsx, WineFormClient (PUT), WineDeleteButton (DELETE) |
| PATCH /api/wines/[id]/quantity | 2a | ✅ Consumed by QuantityControls (+) and RemoveBottleModal (−) |
| GET /api/locations, POST | 2a | ✅ Consumed by LocationsPage, WineFormClient dropdown |
| PUT /api/locations/[id], DELETE | 2a | ✅ Consumed by LocationsPage inline rename and delete |
| next.config.mjs no X-Frame-Options | 01 | ✅ Verified — only X-Content-Type-Options present |

---

## Key Implementation Decisions

1. **WineFormClient co-location**: Kept in `app/wines/new/WineFormClient.tsx` rather than `app/components/` — the form is tightly coupled to the wine create/edit flow. Edit page imports via relative path `../../new/WineFormClient`.

2. **ReadinessBadge as pure synchronous function**: No `'use client'` required. `computeReadinessBadge()` calls `new Date().getFullYear()` on every render — never cached, works correctly in both server and client component trees.

3. **RemoveBottleModal tasting note prompt**: Implemented as same-modal inline state flip (`showNotePrompt` boolean) rather than a separate component — keeps the scrim/bottom-sheet pattern consistent with spec.

4. **ConfirmModal scrim click intentionally non-closing**: Per spec requirement — prevents accidental dismissal of destructive delete actions.

5. **cellar/page.tsx preserved**: Wave 3b had already implemented the full WineCellarList page. The plan's placeholder was not applied to avoid regression.

---

## Deviations from Plan

None — plan executed exactly as written. 

**Note:** `app/cellar/page.tsx` was NOT overwritten with the placeholder because wave 3b had already provided a more complete WineCellarList implementation. The plan's placeholder was for "no dead nav links (NFR-010)" which was already satisfied.

---

## Self-Check

### Files Exist
- ✅ app/globals.css
- ✅ app/layout.tsx
- ✅ app/components/NavBar.tsx
- ✅ app/components/ConfirmModal.tsx
- ✅ app/components/ReadinessBadge.tsx
- ✅ app/components/QuantityControls.tsx
- ✅ app/components/RemoveBottleModal.tsx
- ✅ app/wines/new/WineFormClient.tsx
- ✅ app/wines/new/page.tsx
- ✅ app/wines/[id]/page.tsx
- ✅ app/wines/[id]/WineDeleteButton.tsx
- ✅ app/wines/[id]/not-found.tsx
- ✅ app/wines/[id]/edit/page.tsx
- ✅ app/locations/page.tsx
- ✅ app/page.tsx

### Commits Exist
- ✅ 4495c9c: feat(03a): brand system, root layout, NavBar, and shared UI primitives
- ✅ 287637d: feat(03a): WineForm, wine detail, QuantityControls, RemoveBottleModal, locations page

### TypeScript
- ✅ `npx tsc --noEmit` passes with no errors

## Self-Check: PASSED
