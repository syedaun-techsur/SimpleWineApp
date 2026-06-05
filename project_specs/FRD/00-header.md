# Functional Requirements Document — SimpleWineApp

**Project:** SimpleWineApp
**Acronym:** SWA
**Version:** 1.0
**Date:** 2026-06-05
**Status:** Draft
**Based on PRD Version:** 1.0

---

## Scope

This document specifies the detailed functional behavior of every feature in SimpleWineApp MVP. It covers inputs, outputs, validation rules, process steps, error states, database schema, and REST API endpoints. It is the authoritative reference for implementation: any behavior not specified here requires a PRD/FRD amendment before building.

This FRD does **not** cover: authentication/authorization (excluded from MVP), AI recommendations, multi-tenant data isolation, or any feature marked "Out of Scope" in PROJECT.md.

---

## How to Read This Document

- **Feature chunks** are prefixed `F00`–`F06`, one per PRD feature.
- **Cross-feature chunks** are prefixed `Y0`–`Y3` (schema, API, errors, integrations).
- **Field notation:** `field_name` (type, required|optional) — constraint notes.
- **Route notation:** HTTP METHOD `/path` → handler.
- **Error codes** follow the pattern `DOMAIN_ERROR_REASON` (e.g., `WINE_NOT_FOUND`).
- All dates are stored as ISO 8601 (`YYYY-MM-DD`); years are stored as integers.
- "Current year" means `new Date().getFullYear()` evaluated at request/render time — never cached.

---

## Conventions

| Symbol | Meaning |
|--------|---------|
| `*` after field name | Required field |
| `(opt)` after field name | Optional field |
| `→` | Leads to / results in |
| `F{n}` | References PRD feature by ID |
| `§` | References a section within this document |

---

## Cross-Cutting Terminology

- **Wine Record:** A row in the `wines` table representing a single wine SKU in the collection.
- **Bottle:** A physical instance of a wine record; quantity tracks how many bottles are in the cellar.
- **Bottle Event:** A logged action that changes bottle count (Consumed, Gifted, Opened).
- **Storage Location:** A named physical place where bottles are stored (e.g., "Basement Rack A").
- **Drinking Window:** The optional year range `[start_year, end_year]` during which a wine is best consumed.
- **Readiness Badge:** Auto-derived label from drinking window + current year. One of: `Drink Now`, `Hold`, `Approaching Peak`, `Past Window`, `No Window Set`.
- **Tasting Note:** A dated record capturing sensory observations and a rating for a wine.
- **Rating Scale:** User preference — either 5-star (values 1–5) or 100-point (values 1–100). Stored in `user_settings`.
- **Location Unknown:** State applied to a wine whose storage location has been deleted.
- **Cellar Empty:** State displayed when a wine's quantity reaches 0. Record is retained; not deleted.
- **Session Storage:** Browser `sessionStorage` API; used to persist search/filter state across navigation within the same tab session.

---

## Master Table of Contents

| Chunk File | Contents |
|-----------|---------|
| `00-header.md` | This file: title, scope, conventions, terminology |
| `F00-wine-crud.md` | F0: Wine Inventory CRUD |
| `F01-quantity-bottle-status.md` | F1: Quantity & Bottle Status |
| `F02-storage-locations.md` | F2: Storage Locations |
| `F03-search-filter.md` | F3: Search & Filter |
| `F04-tasting-notes-ratings.md` | F4: Tasting Notes & Ratings |
| `F05-drinking-window.md` | F5: Drinking Window |
| `F06-dashboard.md` | F6: Collection Dashboard |
| `Y0-schema.md` | Full PostgreSQL 16 DDL |
| `Y1-api.md` | REST API endpoint catalog |
| `Y2-errors.md` | Cross-feature error catalog |
| `Y3-integrations.md` | External integration points |

---

## Technical Stack Constraints (Non-Negotiable)

- **Framework:** Next.js 14 App Router. Config file: `next.config.mjs` ONLY. Using `next.config.ts` causes a hard error.
- **Database:** PostgreSQL 16. Container service name: `db`. `DATABASE_URL` must use `db` as hostname.
- **Migrations:** SQL files in `db/` folder. Applied via `npm run migrate`. Must be idempotent (use `IF NOT EXISTS`).
- **Headers:** Do NOT set `X-Frame-Options: DENY` or `Content-Security-Policy: frame-ancestors 'none'` or `'self'`. App must render in an iframe preview.
- **Search:** Client-side only. No search server. Filtering happens in the browser on the already-loaded wine list.
- **Auth:** None. Single-user MVP. No session, no login flow.
- **Mobile-first:** All routes fully functional at 375px viewport width. No horizontal scroll.
- **Accessibility:** WCAG 2.1 AA compliance on all color pairings.

---

*Assembly: `cat project_specs/FRD/*.md > project_specs/FRD-SimpleWineApp.md`*
