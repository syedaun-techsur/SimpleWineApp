# SimpleWineApp

## What This Is

SimpleWineApp is a personal, single-user, mobile-first wine-collection web app that replaces spreadsheets with a structured, searchable digital cellar. It answers three questions fast: *What wine do I have? Where is it stored? What should I drink next?* MVP only — no multi-tenant, no AI.

## Core Value

A collector can add wines, track quantities and storage locations, log tasting notes, and see which bottles to drink now — all from a phone, with real data persisted in a PostgreSQL database.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] **F0** — Wine Inventory CRUD: add/view/edit/delete wines with full field set (name, producer, vintage, type, grape, country/region, bottle size, quantity, storage location, purchase info, drinking window, notes); vintage validation 1900–current+1
- [ ] **F1** — Quantity & Bottle Status: per-wine increment/decrement; bottle events (Consumed/Gifted/Opened) with event log; "Cellar Empty" at quantity 0; consume/gift prompts tasting note
- [ ] **F2** — Storage Locations: user-defined named locations (create/rename/delete); one required per wine; delete location flags wines "Location Unknown"
- [ ] **F3** — Search & Filter: client-side full-text search; filters by type/producer/country-region/vintage/grape/location/readiness/rating; dismissible filter chips; sorts; session-persistent state
- [ ] **F4** — Tasting Notes & Ratings: multiple dated notes per wine (appearance/aroma/flavor/finish); 5-star or 100-pt rating (user setting); would-buy-again; occasion; guest feedback; latest rating on cards
- [ ] **F5** — Drinking Window: start/end year → auto readiness badges (Drink Now / Hold / Approaching Peak / Past Window / No Window Set); color-coded; filterable; recalculated each load
- [ ] **F6** — Collection Dashboard: default landing page; summary stats (total bottles, unique wines, drink-now count, approaching-peak count); "Drink Now" shelf; type/region/decade breakdowns; recently added/consumed; highest rated; cards link to filtered lists

### Out of Scope

- Multi-tenant / user accounts — MVP is single-user; auth adds scope with no MVP value
- AI recommendations — excluded per PRD ("no AI")
- Mobile native app — web-first (mobile-first responsive is sufficient)
- Real-time sync / collaboration — single-user personal cellar
- Wine marketplace / external APIs — no integrations in MVP
- Settings page (generic) — settings limited to rating scale preference; no standalone settings route unless built

## Context

- **Target user:** A wine enthusiast (personal use) who currently tracks their cellar in a spreadsheet and wants a faster, more structured tool accessible on mobile.
- **Stack:** Next.js 14 (App Router) + PostgreSQL 16, containerized via docker-compose. Next 14 requires `next.config.mjs` (not `.ts`). Docker-compose has two services: `db` (postgres:16) and `app` (Next.js, built from Dockerfile), exposed on port 3000.
- **Migrations:** SQL migrations in `db/` applied automatically via `npm run migrate` on container start.
- **Preview compatibility:** No `X-Frame-Options: DENY` or `frame-ancestors 'none'/'self'` — app must render in an iframe preview.
- **UI system:** USWDS foundation + TechSur brand overlay (Gold #FBCA5C accent ≤10%, Black #0A0A0A / Bone #FAFAF7 canvas, Montserrat 900 display, Open Sans body, JetBrains Mono uppercase labels, 2px-radius uppercase buttons). WCAG 2.1 AA. Mobile-first at 375px.

## Constraints

- **Tech Stack:** Next.js 14 App Router + PostgreSQL — pinned. `next.config.mjs` ONLY (never `.ts`).
- **Docker:** Full docker-compose stack required — `docker compose up` must bring up app + DB and run migrations with zero manual steps. `DATABASE_URL` must use hostname `db` (not `localhost`).
- **No frame-blocking headers:** Do not emit `X-Frame-Options: DENY` or equivalent CSP.
- **Routes:** Every primary nav item must resolve to a real route (no dead links / 404s). Required routes: `/` (dashboard), `/cellar` (collection list), `/wines/[id]` (detail), `/wines/new` + `/wines/[id]/edit` (add/edit form), `/wines/[id]/notes/new` (tasting-note form), `/locations` (storage locations).
- **Mobile-first:** Fully functional at 375px width; WCAG 2.1 AA.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js 14 App Router | Specified in PRD; stable, well-supported | — Pending |
| PostgreSQL 16 via docker-compose | Required by PRD; enables zero-setup preview sandboxes | — Pending |
| next.config.mjs (not .ts) | Next 14 hard-errors on next.config.ts | — Pending |
| Single-user (no auth) | MVP scope; auth adds complexity with no MVP value | — Pending |
| USWDS + TechSur overlay | Specified brand system; gold accent ≤10% | — Pending |
| Client-side search/filter | Simplicity; no search server needed for personal cellar scale | — Pending |

---
*Last updated: 2026-06-05 after initialization*
