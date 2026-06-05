# Wave Schedule — SimpleWineApp Full Implementation

**Project:** SimpleWineApp
**Date:** 2026-06-05
**Features:** F0–F6 (all 7 PRD features + NFRs)

---

```yaml
wave: 1
domain: database
depends_on: []
features: [F0, F1, F2, F4, F5]
objective: "Bootstrap docker-compose stack and apply all 5 SQL migrations (locations, wines, bottle_events, tasting_notes, user_settings) with exact DDL from TechArch; establishes the complete schema — every subsequent layer depends on this."
estimated_plans: 1

---
wave: 2a
domain: backend-core
depends_on: [1]
features: [F0, F1, F2]
objective: "Implement P0 API routes — Wine CRUD (GET/POST /api/wines, GET/PUT/DELETE /api/wines/[id]), Quantity controls (PATCH /api/wines/[id]/quantity, GET /api/wines/[id]/events), and Storage Locations (GET/POST /api/locations, GET/PUT/DELETE /api/locations/[id]) — with server-side validators and all error codes from FRD."
estimated_plans: 2

---
wave: 2b
domain: backend-extended
depends_on: [1]
features: [F4, F5, F6]
objective: "Implement P1 API routes — Tasting Notes (POST /api/wines/[id]/notes), Settings (GET/PATCH /api/settings), Dashboard aggregate endpoint (GET /api/dashboard) with server-side SQL readiness computation for Drink Now shelf and stat tiles — and shared lib modules (lib/readiness.ts, lib/rating.ts, lib/validators/*)."
estimated_plans: 2

---
wave: 3a
domain: frontend-core
depends_on: [2a]
features: [F0, F1, F2]
objective: "Build P0 UI: WineForm (create + edit), wine detail page /wines/[id] with QuantityControls + RemoveBottleModal + bottle history, and /locations page with LocationsManager — all mobile-first at 375px with USWDS/TechSur brand system applied."
estimated_plans: 2

---
wave: 3b
domain: frontend-extended
depends_on: [2a, 2b]
features: [F3, F4, F5, F6]
objective: "Build P1 UI: /cellar WineCellarList with FilterPanel (8 dimensions, dismissible chips, 10 sort options, sessionStorage + URL param init), /wines/[id]/notes/new TastingNoteForm with RatingWidget and draft preservation, ReadinessBadge with live preview on WineForm, and Dashboard landing page (/) with stat tiles, Drink Now shelf, breakdowns, and activity lists."
estimated_plans: 3

---
wave: 4
domain: integration
depends_on: [1, 2a, 2b, 3a, 3b]
features: [F0, F1, F2, F3, F4, F5, F6]
objective: "End-to-end validation: docker compose up --build cold-start, NavBar routing (no dead links), cross-feature flows (bottle consume → tasting note prompt → note creation → dashboard refresh), URL query param drill-throughs from Dashboard and Locations to /cellar, WCAG AA audit, frame-compatibility header check, and NFR-001–010 sign-off."
estimated_plans: 1
```

---

## WAVE SCHEDULE

| Wave | Domain | Plans | Features | Objective |
|------|--------|-------|----------|-----------|
| 1 | database | 1 | F0, F1, F2, F4, F5 | Bootstrap docker-compose; apply all 5 SQL migrations (locations, wines, bottle_events, tasting_notes, user_settings) |
| 2a | backend-core | 2 | F0, F1, F2 | P0 API routes: Wine CRUD, Quantity/Events, Storage Locations + validators |
| 2b | backend-extended | 2 | F4, F5, F6 | P1 API routes: Tasting Notes, Settings, Dashboard aggregate + lib/readiness, lib/rating |
| 3a | frontend-core | 2 | F0, F1, F2 | P0 UI: WineForm, wine detail page, QuantityControls, RemoveBottleModal, /locations page |
| 3b | frontend-extended | 3 | F3, F4, F5, F6 | P1 UI: /cellar + FilterPanel, TastingNoteForm + RatingWidget, ReadinessBadge, Dashboard landing page |
| 4 | integration | 1 | F0–F6 | E2E flows, docker cold-start, routing, cross-feature flows, NFR audit (WCAG, frame-compat, mobile) |

**Total features:** 7 (F0–F6) | **Covered:** 7 | **Uncovered:** 0

---

### Feature Assignment Detail

| Feature | Wave(s) | Rationale |
|---------|---------|-----------|
| F0 — Wine Inventory CRUD | 1 (DB schema), 2a (API), 3a (UI) | Foundation feature; drives wines table and all core routes |
| F1 — Quantity & Bottle Status | 1 (DB schema), 2a (API), 3a (UI) | Depends on wines table; bottle_events table in wave 1 |
| F2 — Storage Locations | 1 (DB schema), 2a (API), 3a (UI) | locations table must precede wines (FK); managed on /locations |
| F3 — Search & Filter | 3b (UI only) | Pure client-side; reads wines data already delivered by wave 2a; no new API needed |
| F4 — Tasting Notes & Ratings | 1 (DB schema), 2b (API), 3b (UI) | tasting_notes + user_settings tables; POST /api/wines/[id]/notes; TastingNoteForm |
| F5 — Drinking Window | 1 (DB cols on wines), 2b (lib/readiness + dashboard SQL), 3b (ReadinessBadge + live preview) | Columns on wines table; shared lib used by both backend and frontend |
| F6 — Collection Dashboard | 2b (GET /api/dashboard), 3b (app/page.tsx) | Aggregates across all tables; depends on all prior API routes being stable |

### NFR Assignment

| NFR | Wave | Plan |
|-----|------|------|
| NFR-003 (Docker deploy), NFR-004 (db hostname), NFR-006 (next.config.mjs) | 1 | database plan |
| NFR-009 (location delete non-destructive) | 2a | backend-core |
| NFR-007 (1s render / 500 wines) | 2a | backend-core (indexes) |
| NFR-010 (no dead nav links) | 3a | frontend-core (NavBar) |
| NFR-001 (375px mobile), NFR-002 (WCAG AA), NFR-008 (brand fidelity) | 3a + 3b | frontend plans |
| NFR-005 (no frame-blocking headers) | 1 | database/infra plan (next.config.mjs headers) |
| All NFRs validated end-to-end | 4 | integration |
