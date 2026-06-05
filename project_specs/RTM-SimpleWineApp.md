# Requirements Traceability Matrix — SimpleWineApp

**Project:** SimpleWineApp (SWA)
**Version:** 1.0
**Date:** 2026-06-05
**Status:** Draft
**Based on:** PRD-SimpleWineApp v1.0 · FRD-SimpleWineApp v1.0 · TechArch-SimpleWineApp v1.0 · UserStories-SimpleWineApp v1.0

---

## 1. Overview

This Requirements Traceability Matrix (RTM) provides bidirectional traceability between all SimpleWineApp specification documents. It ensures every PRD feature is decomposed into functional requirements, each requirement is addressed by a technical architecture specification, and every architectural decision is validated by one or more user stories with testable acceptance criteria.

SimpleWineApp is a personal, single-user, mobile-first wine-collection web application built on Next.js 14 (App Router) and PostgreSQL 16. The MVP delivers seven core features — Wine Inventory CRUD (F0), Quantity & Bottle Status (F1), Storage Locations (F2), Search & Filter (F3), Tasting Notes & Ratings (F4), Drinking Window (F5), and Collection Dashboard (F6) — along with non-functional requirements covering accessibility (WCAG 2.1 AA), deployment (Docker Compose zero-setup), performance, and brand fidelity.

The RTM covers four traceability levels: (1) PRD Feature → FRD Functional Requirement, (2) FRD Requirement → TechArch Specification, (3) TechArch Specification → User Story, and (4) User Story → Test Case. It is organized to support both forward traceability (requirement flows down to implementation) and backward traceability (implementation traces up to business need). Any gap in this matrix signals a missing requirement, an unspecified technical decision, or an untested user story — all of which must be resolved before the feature is marked complete.

---

## 2. Requirements Summary

### 2.1 PRD Features

- **F0 — Wine Inventory CRUD** (P0 — Critical): Create, view, edit, delete wine records with a 13-field schema; vintage validation 1900–(current year + 1); cascading deletion of notes and events.
- **F1 — Quantity & Bottle Status** (P0 — Critical): Per-wine increment/decrement; bottle events (Consumed / Gifted / Opened) with immutable event log; "Cellar Empty" state at quantity 0; post-event tasting note prompt.
- **F2 — Storage Locations** (P0 — Critical): User-defined named locations with create/rename/delete; one required per wine; orphan-safe deletion sets `location_id = NULL` ("Location Unknown").
- **F3 — Search & Filter** (P1 — High): Client-side full-text search; 8 filter dimensions; dismissible filter chips; 10 sort options; session-persistent state via `sessionStorage`; URL query parameter initialization from Dashboard and Locations drill-throughs.
- **F4 — Tasting Notes & Ratings** (P1 — High): Multiple dated notes per wine; structured sensory fields (appearance, aroma, flavor, finish); 5-star or 100-point rating scale (user preference); `sessionStorage` draft preservation; most-recent rating on wine cards.
- **F5 — Drinking Window** (P1 — High): Optional `[start_year, end_year]` per wine; 5-state readiness badge auto-computed on every load (Drink Now / Hold / Approaching Peak / Past Window / No Window Set); color-coded; live badge preview on form; filterable.
- **F6 — Collection Dashboard** (P1 — High): Default landing page; 4 stat tiles; "Drink Now" shelf; type / country / decade breakdowns; recently added / consumed / highest-rated lists; all elements link to pre-filtered `/cellar`.

### 2.2 Functional Requirements by Category

- **Wine CRUD:** 6 sub-requirements (F00-FR-01 through F00-FR-06) covering create, view, edit, delete, validation, and inline error feedback.
- **Quantity & Events:** 5 sub-requirements (F01-FR-01 through F01-FR-05) covering increment, decrement with event logging, event log view, Cellar Empty state, and tasting note prompt.
- **Storage Locations:** 5 sub-requirements (F02-FR-01 through F02-FR-05) covering list, create, rename, delete with orphan handling, and form integration.
- **Search & Filter:** 5 sub-requirements (F03-FR-01 through F03-FR-05) covering text search, multi-dimension filtering, chip management, sort, and session state restoration.
- **Tasting Notes:** 5 sub-requirements (F04-FR-01 through F04-FR-05) covering direct note creation, event-triggered creation, note display, rating scale preference, and draft preservation.
- **Drinking Window:** 4 sub-requirements (F05-FR-01 through F05-FR-04) covering window input, badge computation, badge display, and dashboard/filter integration.
- **Dashboard:** 5 sub-requirements (F06-FR-01 through F06-FR-05) covering stat tiles, Drink Now shelf, breakdowns, activity lists, and pre-filtered navigation.

### 2.3 Non-Functional Requirements

- **NFR-001** — Mobile-first: fully functional at 375px viewport; no horizontal scroll.
- **NFR-002** — Accessibility: WCAG 2.1 AA on all color pairings; semantic HTML; keyboard navigation; 44×44px touch targets.
- **NFR-003** — Deployment: `docker compose up` cold-start within 60 seconds; zero manual migration steps.
- **NFR-004** — Database connection: `DATABASE_URL` uses hostname `db` (not `localhost`).
- **NFR-005** — Frame compatibility: no `X-Frame-Options: DENY` or `frame-ancestors` CSP restriction.
- **NFR-006** — Configuration: `next.config.mjs` only (never `next.config.ts`).
- **NFR-007** — Performance: collection list renders within 1 second for up to 500 wine records.
- **NFR-008** — Brand fidelity: Gold `#FBCA5C` accent on ≤10% surface; USWDS token system applied consistently.
- **NFR-009** — Data integrity: deleting a location sets `location_id = NULL`; no wine records lost.
- **NFR-010** — Navigation: all primary nav routes resolve to real pages; no dead links or 404s.

---

## 3. Traceability Matrix

### 3.1 Forward Traceability — PRD → FRD → TechArch → User Stories

| PRD Feature | FRD Requirement | TechArch Specification | User Stories |
|-------------|-----------------|------------------------|--------------|
| **F0: Wine Inventory CRUD** | F00-FR-01: Create wine record via `POST /api/wines` with full field set and server-side validation | `app/api/wines/route.ts` (POST); `lib/validators/wine.ts`; `db/002_create_wines.sql`; `WineForm` component | US-0.1, US-0.2 |
| **F0: Wine Inventory CRUD** | F00-FR-02: View wine detail page at `/wines/[id]` with all fields, readiness badge, notes, and event log | `app/wines/[id]/page.tsx` (Server Component); `GET /api/wines/[id]`; `ReadinessBadge` component | US-0.3 |
| **F0: Wine Inventory CRUD** | F00-FR-03: Edit wine record via `PUT /api/wines/[id]`; pre-populate form; re-validate all fields | `app/wines/[id]/edit/page.tsx`; `PUT /api/wines/[id]`; `lib/validators/wine.ts`; `WineForm` component | US-0.4 |
| **F0: Wine Inventory CRUD** | F00-FR-04: Delete wine record via `DELETE /api/wines/[id]` with confirmation modal; cascade-delete notes and events | `app/wines/[id]/page.tsx`; `DELETE /api/wines/[id]`; `ConfirmModal` component; DB `ON DELETE CASCADE` | US-0.5 |
| **F0: Wine Inventory CRUD** | F00-FR-05: Vintage year validated 1900–(current year + 1); all required fields enforced with inline errors | `lib/validators/wine.ts` (client + server); `WineForm` client-side validation; DB CHECK constraint on `vintage` | US-0.2 |
| **F0: Wine Inventory CRUD** | F00-FR-06: `GET /api/wines` returns full wine list with JOIN-resolved `location_name` and `most_recent_rating` | `app/api/wines/route.ts` (GET); DB query with LEFT JOIN to `locations` and DISTINCT ON `tasting_notes` | US-0.3 |
| **F1: Quantity & Bottle Status** | F01-FR-01: Increment bottle count via `PATCH /api/wines/[id]/quantity` with `{delta:+1}`; no event created; max 9999 | `app/api/wines/[id]/quantity/route.ts`; `QuantityControls` component; DB CHECK `quantity <= 9999` | US-1.1 |
| **F1: Quantity & Bottle Status** | F01-FR-02: Decrement bottle count with event type selection (Consumed / Gifted / Opened); inserts `bottle_events` row | `PATCH /api/wines/[id]/quantity` (delta:-1); `RemoveBottleModal` component; `db/003_create_bottle_events.sql` | US-1.2 |
| **F1: Quantity & Bottle Status** | F01-FR-03: Bottle event log displayed reverse-chronologically on `/wines/[id]`; read-only | `app/wines/[id]/page.tsx`; `GET /api/wines/[id]/events`; `idx_bottle_events_event_date` index | US-1.3 |
| **F1: Quantity & Bottle Status** | F01-FR-04: "Cellar Empty" badge when `quantity = 0`; `−` button disabled; record retained | `WineCard` component; `QuantityControls` component; DB CHECK `quantity >= 0` | US-1.4 |
| **F1: Quantity & Bottle Status** | F01-FR-05: After Consumed/Gifted event, prompt user to optionally add a tasting note | `RemoveBottleModal` component (post-event navigation to `/wines/[id]/notes/new`) | US-1.2, US-4.2 |
| **F2: Storage Locations** | F02-FR-01: List all user-defined locations at `/locations` with wine counts; alphabetical sort; drill-through links | `app/locations/page.tsx`; `GET /api/locations`; `LocationsManager` component; DB COUNT JOIN query | US-2.1 |
| **F2: Storage Locations** | F02-FR-02: Create location via `POST /api/locations`; name required, max 100 chars, case-insensitive unique | `app/api/locations/route.ts` (POST); `lib/validators/location.ts`; DB UNIQUE (LOWER(name)) constraint | US-2.2 |
| **F2: Storage Locations** | F02-FR-03: Rename location via `PUT /api/locations/[id]`; same uniqueness rules; all wine FK references update implicitly | `app/api/locations/[id]/route.ts` (PUT); `lib/validators/location.ts`; DB FK relationship | US-2.3 |
| **F2: Storage Locations** | F02-FR-04: Delete location via `DELETE /api/locations/[id]`; sets `wines.location_id = NULL` in transaction before deleting row | `app/api/locations/[id]/route.ts` (DELETE); DB transaction (`UPDATE wines SET location_id = NULL` then DELETE); `ConfirmModal` | US-2.4 |
| **F2: Storage Locations** | F02-FR-05: Location selector on wine create/edit form; pre-populated from `locations` table; "Location Unknown" state on edit | `WineForm` component; `GET /api/locations` (called on form load); DB `ON DELETE SET NULL` | US-0.1, US-0.4, US-2.4 |
| **F3: Search & Filter** | F03-FR-01: Client-side full-text search (debounced 150ms) across name, producer, grape, country, region; result count label | `WineCellarList` component ("use client"); `sessionStorage` key `swa_cellar_search` | US-3.1 |
| **F3: Search & Filter** | F03-FR-02: Multi-dimension filter panel (8 dimensions); OR within dimension, AND across; dynamic option counts | `FilterPanel` component ("use client"); `WineCellarList` in-memory filtering; `sessionStorage` key `swa_cellar_filters` | US-3.2 |
| **F3: Search & Filter** | F03-FR-03: Active filters shown as dismissible chips; individual and bulk clear; "Clear All" resets `sessionStorage` | `FilterPanel` chip rendering; "Clear All" action in `WineCellarList` | US-3.2 |
| **F3: Search & Filter** | F03-FR-04: Sort dropdown with 10 options; default Name A–Z; stored in `sessionStorage` key `swa_cellar_sort` | `WineCellarList` sort logic; `FilterPanel` sort selector | US-3.3 |
| **F3: Search & Filter** | F03-FR-05: Session state restoration on back-navigation; URL query param initialization overrides `sessionStorage` | `WineCellarList` (reads `sessionStorage` on mount); URL param parsing in `app/cellar/page.tsx` | US-3.4, US-6.1 |
| **F4: Tasting Notes & Ratings** | F04-FR-01: Create tasting note at `/wines/[id]/notes/new` via `POST /api/wines/[id]/notes`; `tasted_on` required; no future dates | `app/wines/[id]/notes/new/page.tsx`; `TastingNoteForm` component; `lib/validators/note.ts`; `db/004_create_tasting_notes.sql` | US-4.1 |
| **F4: Tasting Notes & Ratings** | F04-FR-02: Tasting note creation triggered from F1 Consumed/Gifted event flow with `tasted_on` pre-filled | `RemoveBottleModal` → navigation to `/wines/[id]/notes/new`; `TastingNoteForm` | US-4.2 |
| **F4: Tasting Notes & Ratings** | F04-FR-03: Tasting notes displayed reverse-chronologically on `/wines/[id]`; most-recent rating on `/cellar` cards | `app/wines/[id]/page.tsx` (server fetch); `WineCard` component; `idx_tasting_notes_tasted_on` index | US-4.3 |
| **F4: Tasting Notes & Ratings** | F04-FR-04: Rating scale preference (5-star / 100-point) stored in `user_settings`; toggle from note form or wine card | `RatingWidget` component; `PATCH /api/settings`; `db/005_create_user_settings.sql`; `lib/rating.ts` | US-4.4 |
| **F4: Tasting Notes & Ratings** | F04-FR-05: Form draft auto-saved to `sessionStorage` key `swa_note_draft_[wine_id]`; restored on return | `TastingNoteForm` component ("use client"); `sessionStorage` read on mount, write on each change | US-4.1 |
| **F5: Drinking Window** | F05-FR-01: Optional `drinking_window_start` / `drinking_window_end` fields on wine create/edit form; validated ≥ 1900, end ≥ start | `WineForm` component; `lib/validators/wine.ts`; DB CHECK constraints `wines_window_order` | US-5.1 |
| **F5: Drinking Window** | F05-FR-02: Readiness badge computed per 5-state logic on every render; never cached; color-coded per badge state | `lib/readiness.ts` (`computeReadinessBadge()`); `ReadinessBadge` component; server-side SQL CASE in `GET /api/dashboard` | US-5.2 |
| **F5: Drinking Window** | F05-FR-03: Live badge preview on wine form updates on each blur/change event using current year | `WineForm` component (calls `computeReadinessBadge()` client-side); `ReadinessBadge` component | US-5.1 |
| **F5: Drinking Window** | F05-FR-04: Readiness is filterable dimension in F3; Dashboard Drink Now shelf driven by server-side SQL readiness filter | `FilterPanel` Readiness dimension; `WineCellarList` badge-based filter; `GET /api/dashboard` SQL WHERE clause | US-5.3, US-6.2 |
| **F6: Collection Dashboard** | F06-FR-01: Four stat tiles (Total Bottles, Unique Wines, Drink Now count, Approaching Peak count); server-rendered; graceful 0-state | `app/page.tsx` (Server Component); `GET /api/dashboard`; SQL aggregate queries | US-6.1 |
| **F6: Collection Dashboard** | F06-FR-02: "Drink Now" horizontal-scroll shelf; server-side SQL filter for readiness; alphabetical by name | `DashboardShelf` component; `GET /api/dashboard` → `drink_now_wines[]`; `ReadinessBadge` component | US-6.2 |
| **F6: Collection Dashboard** | F06-FR-03: Type / Country / Decade breakdown sections; each segment links to pre-filtered `/cellar` | `app/page.tsx` (server fetch); `GET /api/dashboard` → `type_breakdown`, `country_breakdown`, `decade_breakdown` | US-6.4 |
| **F6: Collection Dashboard** | F06-FR-04: Recently Added (5), Recently Consumed (5), Highest Rated (5) lists; all server-rendered; each links to `/wines/[id]` | `app/page.tsx`; `GET /api/dashboard` → `recently_added`, `recently_consumed`, `highest_rated`; indexed queries | US-6.3 |
| **F6: Collection Dashboard** | F06-FR-05: All dashboard elements navigate to `/cellar` with URL query params pre-applying corresponding filters | `app/page.tsx` link hrefs; `WineCellarList` URL param initialization (F03-FR-05) | US-6.1, US-6.4 |

---

### 3.2 Non-Functional Traceability

| NFR ID | Requirement | TechArch Specification | FRD Reference |
|--------|-------------|------------------------|---------------|
| NFR-001 | Mobile-first at 375px | `NavBar` component; all pages use CSS Modules + USWDS mobile-first tokens; 44×44px touch targets | FRD §Technical Stack Constraints |
| NFR-002 | WCAG 2.1 AA accessibility | Gold `#FBCA5C` on Black `#0A0A0A` (9.1:1); semantic HTML (`<nav>`, `<main>`, `<section>`); `aria-label`, `aria-live`, `role="dialog"`; focus trapping in modals | TechArch §5.6 |
| NFR-003 | Zero-setup Docker deployment | `docker-compose.yml` (db + app services); `depends_on` with `condition: service_healthy`; `CMD npm run migrate && npm start` | TechArch §1.3 |
| NFR-004 | DB hostname `db` | `DATABASE_URL=postgresql://postgres:postgres@db:5432/simplewineapp` in compose env | TechArch §3.2 |
| NFR-005 | No frame-blocking headers | `next.config.mjs` omits `X-Frame-Options` and `frame-ancestors` CSP; only sets `X-Content-Type-Options: nosniff` | TechArch §5.2 |
| NFR-006 | `next.config.mjs` only | Config file named `next.config.mjs`; `.ts` extension causes Next.js 14 hard error | TechArch §1.1 |
| NFR-007 | 1s render for 500 wines | Client-side filter (no search server); indexes on `wines(wine_type)`, `wines(vintage)`, `wines(created_at)`; full list loaded once | TechArch §3.4 |
| NFR-008 | Brand fidelity | Gold accent ≤10% surface; Montserrat 900 display / Open Sans body / JetBrains Mono labels; USWDS 3.x design tokens | TechArch §6.1 |
| NFR-009 | Location delete non-destructive | `ON DELETE SET NULL` on `wines.location_id`; DELETE wrapped in transaction with preceding UPDATE | TechArch §3.1, §4.3 |
| NFR-010 | No dead nav links | Routes: `/`, `/cellar`, `/wines/new`, `/wines/[id]`, `/wines/[id]/edit`, `/wines/[id]/notes/new`, `/locations` all implemented | TechArch §2.1, §2.5 |

---

## 4. Requirements Detail

### 4.1 F0: Wine Inventory CRUD

**PRD Priority:** P0 — Critical

**FRD Requirements:**
- **F00-FR-01 (Create):** `/wines/new` form submits to `POST /api/wines`. Required fields: name, producer, vintage, wine_type, quantity, location_id. Optional: grape, country, region, bottle_size, purchase_date, purchase_source, purchase_price, drinking_window_start, drinking_window_end, notes. On success: `201 Created` + redirect to `/wines/[id]`.
- **F00-FR-02 (View):** `/wines/[id]` server component fetches wine + notes + events. Renders all fields, readiness badge, tasting notes (reverse-chronological), bottle history. 404 if not found.
- **F00-FR-03 (Edit):** `/wines/[id]/edit` pre-populates all fields. `PUT /api/wines/[id]` on submit. Same validation as create. Updates `updated_at`. Redirects to detail page on success.
- **F00-FR-04 (Delete):** Confirmation modal with text "Delete [wine name]? This cannot be undone. All tasting notes and bottle events will also be deleted." `DELETE /api/wines/[id]`. DB `ON DELETE CASCADE` removes notes and events. Redirect to `/cellar`.
- **F00-FR-05 (Validation):** Vintage: integer, 1900–(current year + 1). Wine type: one of 8 enum values (case-sensitive). Quantity: integer 1–9999. Location: must exist at submit time. Drinking window: end ≥ start. Client validates before API call; server re-validates (defense-in-depth).
- **F00-FR-06 (List):** `GET /api/wines` returns full wine list with `location_name` (LEFT JOIN to `locations`) and `most_recent_rating` (DISTINCT ON from `tasting_notes`).

**TechArch Components:**
- Pages: `app/wines/new/page.tsx`, `app/wines/[id]/page.tsx`, `app/wines/[id]/edit/page.tsx`
- API: `app/api/wines/route.ts`, `app/api/wines/[id]/route.ts`
- Components: `WineForm`, `ConfirmModal`, `ReadinessBadge`
- Lib: `lib/validators/wine.ts`
- DB: `db/002_create_wines.sql` (`wines` table)

**User Stories:** US-0.1, US-0.2, US-0.3, US-0.4, US-0.5

---

### 4.2 F1: Quantity & Bottle Status

**PRD Priority:** P0 — Critical

**FRD Requirements:**
- **F01-FR-01 (Increment):** `PATCH /api/wines/[id]/quantity` with `{delta: 1}`. No bottle event created. Max 9999 enforced at DB and API (409 QUANTITY_AT_MAX). UI disables `+` at max.
- **F01-FR-02 (Decrement + Event):** `−` tap opens "Remove a Bottle" modal. User selects event type (required). Optional note (max 500 chars). `PATCH` with `{delta: -1, event_type, note}`. Server decrements quantity (min 0) and inserts `bottle_events` row. Returns `{quantity, event_id}`.
- **F01-FR-03 (Event Log):** `GET /api/wines/[id]/events`. Rendered in "Bottle History" section on detail page. Reverse-chronological. Read-only. Each row: date, color-coded event type badge, optional note.
- **F01-FR-04 (Cellar Empty):** When `quantity = 0`: "Cellar Empty" badge displayed; `−` disabled; `+` active; record retained with all notes and events.
- **F01-FR-05 (Note Prompt):** After Consumed or Gifted event: prompt "Would you like to add a tasting note for this bottle?" Yes → navigate to `/wines/[id]/notes/new`. Skip → dismiss. No prompt after Opened.

**TechArch Components:**
- API: `app/api/wines/[id]/quantity/route.ts`, `app/api/wines/[id]/events/route.ts`
- Components: `QuantityControls`, `RemoveBottleModal`, `WineCard`
- DB: `db/003_create_bottle_events.sql` (`bottle_events` table); `idx_bottle_events_wine_id`, `idx_bottle_events_event_date`

**User Stories:** US-1.1, US-1.2, US-1.3, US-1.4

---

### 4.3 F2: Storage Locations

**PRD Priority:** P0 — Critical

**FRD Requirements:**
- **F02-FR-01 (List):** `GET /api/locations` returns `LocationWithCount[]` sorted by `LOWER(name) ASC`. `/locations` page renders each with Rename / Delete actions. Location name links to `/cellar?location=[encoded_name]`.
- **F02-FR-02 (Create):** `POST /api/locations` with `{name}`. Name: non-empty after trim, max 100 chars, case-insensitively unique (`UNIQUE (LOWER(name))` DB constraint). Returns `201` with `wine_count: 0`.
- **F02-FR-03 (Rename):** `PUT /api/locations/[id]` with `{name}`. Same uniqueness rules, excluding current location. FK relationship means all associated wine records implicitly reflect the new name — no wine row updates needed.
- **F02-FR-04 (Delete):** `DELETE /api/locations/[id]`. Server runs `UPDATE wines SET location_id = NULL WHERE location_id = $1` then `DELETE FROM locations WHERE id = $1` in a single transaction. Affected wines display "Location Unknown".
- **F02-FR-05 (Form Selector):** Wine create/edit form populates location `<select>` from `GET /api/locations`. `/wines/new`: placeholder "Select a storage location…". `/wines/[id]/edit`: pre-selects current; highlights "Location Unknown — please select a new location" if deleted.

**TechArch Components:**
- Pages: `app/locations/page.tsx`
- API: `app/api/locations/route.ts`, `app/api/locations/[id]/route.ts`
- Components: `LocationsManager`, `ConfirmModal`, `WineForm`
- Lib: `lib/validators/location.ts`
- DB: `db/001_create_locations.sql` (`locations` table); `idx_wines_location_id`

**User Stories:** US-2.1, US-2.2, US-2.3, US-2.4

---

### 4.4 F3: Search & Filter

**PRD Priority:** P1 — High

**FRD Requirements:**
- **F03-FR-01 (Text Search):** Debounced 150ms. Case-insensitive substring match on name, producer, grape, country, region. Result count: "Showing N of Total wines". Empty collection → "Your cellar is empty. [Add your first wine →]". No match → "No wines match your current filters. [Clear All Filters]".
- **F03-FR-02 (Filters):** 8 dimensions: wine type, producer, country/region, vintage year, grape variety, storage location, readiness (computed badge), rating. OR within dimension, AND across. Dynamic option counts from loaded wine list.
- **F03-FR-03 (Chips):** Each active filter rendered as dismissible chip. ✕ removes individual filter. "Clear All" removes all filters and search; resets `sessionStorage`.
- **F03-FR-04 (Sort):** 10 sort options. Default: Name A–Z. Unrecognized `sessionStorage` key falls back to default. Client-side re-sort, no server round-trip.
- **F03-FR-05 (Session + URL Params):** `swa_cellar_search`, `swa_cellar_filters`, `swa_cellar_sort` in `sessionStorage`. URL query params (`readiness`, `wine_type`, `location`, `country`, `vintage_min`, `vintage_max`) override `sessionStorage` on load. Back-navigation restores state with no server round-trip.

**TechArch Components:**
- Pages: `app/cellar/page.tsx` (server shell + client list)
- Components: `WineCellarList`, `FilterPanel`, `WineCard`
- DB (read-only): `wines`, `locations`, `tasting_notes` (for rating filter/sort), `bottle_events` (for recently consumed sort)

**User Stories:** US-3.1, US-3.2, US-3.3, US-3.4

---

### 4.5 F4: Tasting Notes & Ratings

**PRD Priority:** P1 — High

**FRD Requirements:**
- **F04-FR-01 (Create Direct):** `POST /api/wines/[id]/notes`. Required: `tasted_on` (date, not future). Optional: appearance, aroma, flavor, finish (max 1000 chars each), rating (in user's scale), would_buy_again (yes/no/maybe), occasion (7 enum values), guest_feedback (max 2000 chars). Server normalizes rating to 1–100. Returns `201`.
- **F04-FR-02 (Create from Event):** After Consumed/Gifted event (F01-FR-05), navigate to `/wines/[id]/notes/new` with `tasted_on` pre-filled to today.
- **F04-FR-03 (View Notes):** Notes on `/wines/[id]` ordered by `tasted_on DESC`. Each note: date, rating (per scale), would-buy-again, occasion, sensory fields, guest feedback. No notes → "No tasting notes yet. [Add a Tasting Note →]". Most-recent rating on `/cellar` wine cards.
- **F04-FR-04 (Rating Scale):** `user_settings.rating_scale` (`five_star` | `hundred_point`). Default `five_star`. Toggle via `PATCH /api/settings`. Conversion: 5-star × 20 = stored value. Display: stored ÷ 20 = stars.
- **F04-FR-05 (Draft Preservation):** Form values auto-saved to `sessionStorage` key `swa_note_draft_[wine_id]` on each change. Restored on page load. Cleared on successful submit.

**TechArch Components:**
- Pages: `app/wines/[id]/notes/new/page.tsx`
- API: `app/api/wines/[id]/notes/route.ts`, `app/api/settings/route.ts`
- Components: `TastingNoteForm`, `RatingWidget`
- Lib: `lib/validators/note.ts`, `lib/rating.ts`
- DB: `db/004_create_tasting_notes.sql`, `db/005_create_user_settings.sql`; `idx_tasting_notes_tasted_on`, `idx_tasting_notes_rating`

**User Stories:** US-4.1, US-4.2, US-4.3, US-4.4

---

### 4.6 F5: Drinking Window

**PRD Priority:** P1 — High

**FRD Requirements:**
- **F05-FR-01 (Input):** Two optional integer fields on wine form: `drinking_window_start` (≥ 1900) and `drinking_window_end` (≥ 1900, ≥ start if both set). Non-integer → `VALIDATION_ERROR`. End < start → `WINDOW_INVALID_RANGE`.
- **F05-FR-02 (Badge Logic):** 5 states computed from current year (CY) vs. window: **No Window Set** (both null) · **Hold** (CY < start − 2) · **Approaching Peak** (CY in [start−2, start−1]) · **Drink Now** (CY in [start, end]) · **Past Window** (CY > end). Edge cases: start-only, end-only, start = end. Colors: green / blue / amber / grey / muted grey.
- **F05-FR-03 (Live Preview):** `WineForm` calls `computeReadinessBadge()` client-side on each blur/change event and renders `ReadinessBadge` below the year inputs. No preview when both fields empty.
- **F05-FR-04 (Integration):** Readiness available as filter dimension in F3 `FilterPanel`. Dashboard Drink Now shelf uses server-side SQL CASE/WHERE. Badges never cached — recomputed each load.

**TechArch Components:**
- Components: `WineForm`, `ReadinessBadge`
- Lib: `lib/readiness.ts` (`computeReadinessBadge()`)
- API: `GET /api/dashboard` (server-side SQL readiness computation)
- DB: `wines.drinking_window_start`, `wines.drinking_window_end` (columns on `wines` table; no separate table)

**User Stories:** US-5.1, US-5.2, US-5.3

---

### 4.7 F6: Collection Dashboard

**PRD Priority:** P1 — High

**FRD Requirements:**
- **F06-FR-01 (Stat Tiles):** Total Bottles (`SUM(quantity)`), Unique Wines (`COUNT(*)`), Drink Now count, Approaching Peak count. Server-rendered. All show `0` gracefully. Drink Now → `/cellar?readiness=Drink+Now`. Approaching Peak → `/cellar?readiness=Approaching+Peak`.
- **F06-FR-02 (Drink Now Shelf):** Server-side SQL selects wines where computed badge = Drink Now (handles partial windows). Horizontal-scroll `DashboardShelf`. Alphabetical by name. Empty: "No wines are ready to drink right now."
- **F06-FR-03 (Breakdowns):** Wine Type (wine_count + bottle_count), Country/Region (top 10 by wine_count), Vintage Decade (10-year bands, DESC). Each segment links to pre-filtered `/cellar`. NULL vintage excluded from decade; NULL country grouped as "Unknown".
- **F06-FR-04 (Activity Lists):** Recently Added: 5 wines by `created_at DESC`. Recently Consumed: 5 `bottle_events` with type IN (Consumed, Gifted) by `event_date DESC`. Highest Rated: top 5 by most-recent `tasting_notes.rating` using `DISTINCT ON (wine_id)`. All server-rendered.
- **F06-FR-05 (Navigation Hub):** Every tile, shelf card, and breakdown segment navigates to `/cellar` with matching URL query params. Recently Added/Consumed/Highest Rated items link directly to `/wines/[id]`.

**TechArch Components:**
- Pages: `app/page.tsx` (Server Component)
- API: `app/api/dashboard/route.ts` (`GET /api/dashboard` → `DashboardResponse`)
- Components: `DashboardShelf`, `WineCard`, `ReadinessBadge`
- DB: `idx_wines_created_at`, `idx_bottle_events_event_date`, `idx_bottle_events_event_type`, `idx_tasting_notes_rating`, `idx_tasting_notes_tasted_on`

**User Stories:** US-6.1, US-6.2, US-6.3, US-6.4

---

## 5. Test Case Coverage

### 5.1 Test Case Mapping

| Feature | User Story | Test Case ID | Test Description | Type |
|---------|------------|--------------|------------------|------|
| F0 | US-0.1 | TEST-001 | Submit `/wines/new` form with all required fields; verify redirect to `/wines/[id]` and record created | Integration |
| F0 | US-0.1 | TEST-002 | Verify 8 wine type options in dropdown; verify location selector shows user-defined locations | UI |
| F0 | US-0.2 | TEST-003 | Submit form with empty required fields; verify inline error messages on each required field | UI / Validation |
| F0 | US-0.2 | TEST-004 | Submit vintage = 1899 and vintage = (current year + 2); verify `VINTAGE_OUT_OF_RANGE` error | Validation |
| F0 | US-0.2 | TEST-005 | Submit drinking window end < start; verify `WINDOW_INVALID_RANGE` error | Validation |
| F0 | US-0.2 | TEST-006 | Submit negative purchase price; verify rejection | Validation |
| F0 | US-0.3 | TEST-007 | Navigate to `/wines/[id]`; verify all 13 fields displayed, readiness badge present, notes section present, bottle history section present | UI |
| F0 | US-0.3 | TEST-008 | Navigate to `/wines/[non-existent-id]`; verify 404 page renders "Wine not found." | Error Handling |
| F0 | US-0.4 | TEST-009 | Edit a wine record; change producer; verify `updated_at` changes and new value persists | Integration |
| F0 | US-0.4 | TEST-010 | Edit wine with deleted location; verify "Location Unknown — please select a new location" state on form | UI |
| F0 | US-0.5 | TEST-011 | Click Delete; verify confirmation modal text; confirm; verify redirect to `/cellar` and record gone | Integration |
| F0 | US-0.5 | TEST-012 | Cancel delete modal; verify user remains on `/wines/[id]` and record intact | UI |
| F1 | US-1.1 | TEST-013 | Tap `+` on wine detail; verify quantity increments and no bottle event is created | Integration |
| F1 | US-1.1 | TEST-014 | Tap `+` when quantity = 9999; verify button disabled and `QUANTITY_AT_MAX` on direct API call | Edge Case |
| F1 | US-1.2 | TEST-015 | Tap `−`; select Consumed; add optional note; confirm; verify quantity decrements and bottle event created with correct date/type/note | Integration |
| F1 | US-1.2 | TEST-016 | Tap `−`; attempt confirm without selecting event type; verify confirm button disabled | UI |
| F1 | US-1.2 | TEST-017 | After Consumed event: verify tasting note prompt appears with Yes/Skip buttons | UI |
| F1 | US-1.2 | TEST-018 | After Opened event: verify no tasting note prompt | UI |
| F1 | US-1.3 | TEST-019 | View wine with 3 bottle events; verify events displayed in reverse-chronological order with correct badges | UI |
| F1 | US-1.4 | TEST-020 | Decrement to quantity 0; verify "Cellar Empty" badge displayed, `−` disabled, `+` active, record not deleted | UI / Integration |
| F2 | US-2.1 | TEST-021 | Navigate to `/locations`; verify all locations listed alphabetically with correct wine counts | UI |
| F2 | US-2.1 | TEST-022 | Click location name link; verify navigation to `/cellar?location=[name]` with filter chip active | Integration |
| F2 | US-2.2 | TEST-023 | Create location with valid name; verify appears in list with wine count 0 | Integration |
| F2 | US-2.2 | TEST-024 | Create location with duplicate name (different case); verify `LOCATION_NAME_CONFLICT` error | Validation |
| F2 | US-2.3 | TEST-025 | Rename a location; verify new name appears in list and on associated wine records without wine data loss | Integration |
| F2 | US-2.4 | TEST-026 | Delete location with assigned wines; confirm modal shows correct wine count; verify wines show "Location Unknown" after deletion | Integration |
| F2 | US-2.4 | TEST-027 | Delete empty location (0 wines); verify location removed; no wine impact | Integration |
| F3 | US-3.1 | TEST-028 | Type in search bar; verify only matching wines shown (case-insensitive); verify result count label | UI |
| F3 | US-3.1 | TEST-029 | Clear search bar; verify full collection restored (subject to active filters) | UI |
| F3 | US-3.2 | TEST-030 | Apply 2 wine type filters; verify OR logic within dimension | UI |
| F3 | US-3.2 | TEST-031 | Apply wine type filter AND location filter; verify AND logic across dimensions | UI |
| F3 | US-3.2 | TEST-032 | Verify active filter chips rendered for each active filter; click ✕ removes individual chip | UI |
| F3 | US-3.3 | TEST-033 | Select "Rating Highest" sort; verify list re-ordered by most recent rating DESC with no server call | UI |
| F3 | US-3.3 | TEST-034 | First visit (no sessionStorage): verify default sort is Name A–Z | UI |
| F3 | US-3.4 | TEST-035 | Apply filters on `/cellar`; navigate to wine detail; navigate back; verify filters and sort order restored | Integration |
| F3 | US-3.4 | TEST-036 | Navigate to `/cellar?readiness=Drink+Now`; verify readiness filter chip active with no sessionStorage dependency | Integration |
| F4 | US-4.1 | TEST-037 | Submit tasting note form with all fields; verify `201` response, note appears on wine detail page | Integration |
| F4 | US-4.1 | TEST-038 | Submit with future `tasted_on` date; verify `TASTED_ON_FUTURE` error | Validation |
| F4 | US-4.1 | TEST-039 | Submit 5-star rating of 4; verify stored value is 80 | Integration |
| F4 | US-4.2 | TEST-040 | Tap Yes on post-Consumed note prompt; verify navigation to note form with `tasted_on` pre-filled to today | Integration |
| F4 | US-4.3 | TEST-041 | Wine with 3 notes; verify reverse-chronological order; verify each note's fields rendered | UI |
| F4 | US-4.3 | TEST-042 | Most-recent rating displayed on `/cellar` wine card; verify correct scale (5-star vs 100-point) | UI |
| F4 | US-4.4 | TEST-043 | Switch to 100-point scale; verify rating widget changes and all existing ratings re-displayed in new scale | UI / Integration |
| F4 | US-4.1 | TEST-044 | Fill note form; navigate away (simulate); navigate back; verify draft restored from sessionStorage | UI |
| F5 | US-5.1 | TEST-045 | Enter valid drinking window (2022–2030); verify badge preview shows correct state immediately | UI |
| F5 | US-5.1 | TEST-046 | Enter end year < start year on wine form; verify `WINDOW_INVALID_RANGE` shown on form | Validation |
| F5 | US-5.2 | TEST-047 | Verify readiness badges on `/cellar` cards match expected state based on current year | UI |
| F5 | US-5.2 | TEST-048 | Verify badge with start-only window (no end): Drink Now when CY ≥ start | Edge Case |
| F5 | US-5.2 | TEST-049 | Verify badge with end-only window (no start): Past Window when CY > end | Edge Case |
| F5 | US-5.3 | TEST-050 | Apply "Hold" readiness filter; verify only wines with Hold badge shown; badge computed at render time | Integration |
| F6 | US-6.1 | TEST-051 | Load `/` with 50+ wine collection; verify all 4 stat tiles show correct values | Integration |
| F6 | US-6.1 | TEST-052 | Load `/` with empty collection; verify all stat tiles show 0 with no errors | Edge Case |
| F6 | US-6.1 | TEST-053 | Click "Drink Now" stat tile; verify navigation to `/cellar?readiness=Drink+Now` with filter chip active | Integration |
| F6 | US-6.2 | TEST-054 | Load dashboard with Drink Now wines; verify horizontal shelf shows all matching wines alphabetically | UI |
| F6 | US-6.2 | TEST-055 | No Drink Now wines: verify "No wines are ready to drink right now." message | Edge Case |
| F6 | US-6.3 | TEST-056 | Verify "Recently Added" shows last 5 wines by created_at DESC; each links to correct `/wines/[id]` | Integration |
| F6 | US-6.3 | TEST-057 | Verify "Recently Consumed" shows last 5 Consumed/Gifted events; Opened events excluded | Integration |
| F6 | US-6.3 | TEST-058 | Verify "Highest Rated" shows top 5 by most-recent rating; displayed in user's current rating scale | Integration |
| F6 | US-6.4 | TEST-059 | Click wine type breakdown segment "Red"; verify navigation to `/cellar?wine_type=Red` | Integration |
| F6 | US-6.4 | TEST-060 | Click decade breakdown "2010s"; verify navigation to `/cellar?vintage_min=2010&vintage_max=2019` | Integration |

### 5.2 Coverage Summary

| Feature | User Stories | Test Cases | Story Coverage | Test Coverage |
|---------|-------------|------------|----------------|---------------|
| F0: Wine Inventory CRUD | US-0.1–US-0.5 (5 stories) | TEST-001–TEST-012 (12 tests) | 100% | 100% |
| F1: Quantity & Bottle Status | US-1.1–US-1.4 (4 stories) | TEST-013–TEST-020 (8 tests) | 100% | 100% |
| F2: Storage Locations | US-2.1–US-2.4 (4 stories) | TEST-021–TEST-027 (7 tests) | 100% | 100% |
| F3: Search & Filter | US-3.1–US-3.4 (4 stories) | TEST-028–TEST-036 (9 tests) | 100% | 100% |
| F4: Tasting Notes & Ratings | US-4.1–US-4.4 (4 stories) | TEST-037–TEST-044 (8 tests) | 100% | 100% |
| F5: Drinking Window | US-5.1–US-5.3 (3 stories) | TEST-045–TEST-050 (6 tests) | 100% | 100% |
| F6: Collection Dashboard | US-6.1–US-6.4 (4 stories) | TEST-051–TEST-060 (10 tests) | 100% | 100% |
| **Total** | **28 stories** | **60 tests** | **100%** | **100%** |

---

## 6. Change Management

### 6.1 Change Log

| Change ID | Date | Description | Affected Documents | Status |
|-----------|------|-------------|-------------------|--------|
| CHG-001 | 2026-06-05 | Initial RTM created from PRD v1.0, FRD v1.0, TechArch v1.0, UserStories v1.0 | PRD, FRD, TechArch, UserStories, RTM | Approved |

### 6.2 Change Control Process

Any change to a requirement must follow this process:

1. **Submit change request** — identify the impacted document(s) and requirement ID(s).
2. **Impact analysis** — trace forward (PRD → FRD → TechArch → UserStory → Test) and backward; identify all affected rows in this RTM.
3. **Update all affected spec documents** — PRD, FRD, TechArch, UserStories must be updated consistently before implementation begins.
4. **Update RTM** — add a new CHG-NNN entry; update affected traceability rows.
5. **Re-approve** — obtain sign-off from all stakeholders listed in Section 7.
6. **Begin implementation** — no code changes for a requirement that lacks a complete, approved RTM row.

---

## 7. Approval

### 7.1 Sign-Off

| Role | Name | Signature | Date | Status |
|------|------|-----------|------|--------|
| Product Owner | — | | 2026-06-05 | Pending |
| Technical Lead | — | | 2026-06-05 | Pending |
| QA Lead | — | | 2026-06-05 | Pending |

### 7.2 RTM Validity Statement

This RTM is valid as of **2026-06-05** and is based on:

- **PRD-SimpleWineApp v1.0** — 7 features (F0–F6); 10 non-functional requirements
- **FRD-SimpleWineApp v1.0** — 35 functional sub-requirements across F00–F06 + cross-cutting specs (Y0–Y3)
- **TechArch-SimpleWineApp v1.0** — Full-stack Next.js 14 + PostgreSQL 16 architecture; 5 DB migrations; 9 API route handlers; 13 UI components; 7 lib modules
- **UserStories-SimpleWineApp v1.0** — 28 user stories across 7 epics (US-0.1–US-6.4)

All 7 PRD features have complete forward traceability from PRD → FRD → TechArch → User Story → Test Case. No orphaned requirements, no untraced architectural components, and no user stories without a corresponding functional requirement were identified at the time of this RTM's creation.

---

*Related documents: PRD-SimpleWineApp.md · FRD-SimpleWineApp.md · TechArch-SimpleWineApp.md · UserStories-SimpleWineApp.md*
*Last updated: 2026-06-05*
