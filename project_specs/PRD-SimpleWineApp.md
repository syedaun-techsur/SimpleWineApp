# Product Requirements Document — SimpleWineApp

**Project:** SimpleWineApp
**Version:** 1.0
**Date:** 2026-06-05
**Status:** Draft

---

## 1. Executive Summary

SimpleWineApp is a personal, single-user, mobile-first wine-collection web application that replaces spreadsheets with a structured, searchable digital cellar. Built on Next.js 14 (App Router) and PostgreSQL 16, it answers three questions fast: *What wine do I have? Where is it stored? What should I drink next?* The MVP scope is deliberately narrow — no authentication, no AI, no multi-tenant — to deliver a fully functional product quickly and validate real-world usage.

---

## 2. Problem Statement

Wine enthusiasts who manage personal collections today face a fragmented and fragile experience. The most common solution — a spreadsheet — quickly becomes unwieldy:

- **No mobile-first interface.** Spreadsheets are difficult to update on a phone, which is the device most likely at hand in a cellar or at a shop.
- **No structured storage tracking.** Bottles spread across multiple racks, rooms, or storage units are tracked inconsistently or not at all.
- **No drinking-window awareness.** There is no automated way to flag wines that are ready to drink now, approaching peak, or past their window.
- **No tasting history.** Notes live in a separate document or are lost entirely, making it impossible to recall why a wine was rated a certain way.
- **No quick-glance overview.** Getting a count of total bottles, drink-now candidates, or highest-rated wines requires manual formulas and filtering.

SimpleWineApp solves all of these with a purpose-built web app, optimized for 375px mobile screens, backed by a real relational database, and containerized for zero-setup deployment.

---

## 3. Product Vision

**Vision Statement:** Provide a wine enthusiast with a fast, beautiful, always-available digital cellar that lives in a browser and behaves like a native app — making it effortless to log, find, and decide on any bottle in the collection.

**Strategic Goals:**

- Deliver a fully functional MVP that covers the entire lifecycle of a bottle: acquisition → storage → drinking window → tasting → consumption.
- Achieve mobile-first usability at 375px without sacrificing desktop comfort.
- Maintain zero-friction deployment: a single `docker compose up` brings the entire stack online with migrations applied automatically.
- Build on a maintainable, conventional stack (Next.js 14 App Router + PostgreSQL 16) with no experimental dependencies.
- Apply the USWDS + TechSur brand system consistently — Gold `#FBCA5C` accent (≤10% surface area), Black `#0A0A0A`, Bone `#FAFAF7` canvas, Montserrat 900 display, Open Sans body, JetBrains Mono uppercase labels — delivering a polished, trustworthy aesthetic with WCAG 2.1 AA compliance.

---

## 4. Technical Architecture

| Layer | Technology | Notes |
|---|---|---|
| Frontend framework | Next.js 14 (App Router) | `next.config.mjs` only — `.ts` config causes hard errors in Next 14 |
| Database | PostgreSQL 16 | Containerized; hostname `db` in compose network |
| Containerization | Docker Compose | Services: `db` (postgres:16) + `app` (Next.js on port 3000) |
| Migrations | SQL files in `db/` | Auto-applied via `npm run migrate` on container start |
| UI system | USWDS + TechSur overlay | Gold `#FBCA5C`, Black `#0A0A0A`, Bone `#FAFAF7`; Montserrat / Open Sans / JetBrains Mono |
| Styling | USWDS design tokens + custom CSS | 2px-radius buttons, uppercase labels, mobile-first at 375px |
| Search/filter | Client-side (in-browser) | No search server required at personal-cellar scale |
| Auth | None (single-user) | No session, no login — MVP scope |
| Deployment target | Local / Docker preview | No frame-blocking headers; app must render in iframe preview |

**Required Routes:**

| Route | Purpose |
|---|---|
| `/` | Dashboard (default landing page) |
| `/cellar` | Collection list with search & filter |
| `/wines/[id]` | Wine detail view |
| `/wines/new` | Add wine form |
| `/wines/[id]/edit` | Edit wine form |
| `/wines/[id]/notes/new` | Add tasting note form |
| `/locations` | Storage locations management |

---

## 5. Feature Requirements

### F0: Wine Inventory CRUD

**Description:** The foundational feature. Every wine in the collection is represented as a structured record with a comprehensive field set. Users can create, view, edit, and delete wine entries. Vintage year input is validated to the range 1900 through the current year plus one, preventing obviously invalid entries while allowing futures releases.

**Capabilities:**
- Create a new wine record with all standard fields: name, producer, vintage, wine type, grape variety, country, region, bottle size, quantity, storage location, purchase date, purchase price, drinking window (start/end year), and free-text notes.
- View full wine detail on a dedicated page (`/wines/[id]`).
- Edit any field on an existing wine record (`/wines/[id]/edit`).
- Delete a wine record with a confirmation prompt.
- Vintage year validated between 1900 and (current year + 1).
- All required fields enforced with inline validation feedback.

**Priority:** P0 — Critical, MVP foundation

---

### F1: Quantity & Bottle Status

**Description:** Tracks the number of bottles of each wine and records what happens to them. Users can increment or decrement the bottle count; when a bottle is removed, they are prompted to log the event as Consumed, Gifted, or Opened. Each event is recorded in a per-wine event log. When quantity reaches zero, the wine entry displays a "Cellar Empty" state. Consuming or gifting a bottle prompts the user to optionally add a tasting note.

**Capabilities:**
- Increment/decrement bottle quantity from the wine detail page and collection list cards.
- Removal events prompt selection of event type: Consumed, Gifted, or Opened.
- Per-wine event log records date, event type, and optional note for each bottle removal.
- "Cellar Empty" badge/state displayed when quantity reaches 0 (record retained for history).
- Consume and Gift events prompt an optional tasting note entry flow.

**Priority:** P0 — Critical, MVP requirement

---

### F2: Storage Locations

**Description:** Users define named storage locations (e.g., "Basement Rack A", "Temperature Locker") and assign exactly one location to each wine. Locations are managed on a dedicated `/locations` route. If a location is deleted, all wines previously assigned to it are flagged with a "Location Unknown" indicator rather than being silently orphaned.

**Capabilities:**
- Create, rename, and delete user-defined named storage locations.
- Each wine requires exactly one storage location (required field on wine form with helper text explaining split-location handling).
- Location selector on wine create/edit form populated from user-defined locations.
- Deleting a location flags all assigned wines as "Location Unknown" (non-destructive to wine records).
- `/locations` route lists all locations with wine counts per location; each location name links to `/cellar` pre-filtered to that location.

**Priority:** P0 — Critical, MVP requirement

---

### F3: Search & Filter

**Description:** The collection list (`/cellar`) provides fast, client-side full-text search across wine records plus a rich filter panel. Filters appear as dismissible chips for transparency. Sort order is configurable. All search, filter, and sort state persists in the session so returning to the list after viewing a detail page restores the previous context. The cellar list also accepts URL query parameters (e.g., `?readiness=Drink+Now`, `?wine_type=Red`, `?location=Basement+Rack+A`) so that dashboard tiles and location drill-throughs can link directly to a pre-filtered view.

**Capabilities:**
- Client-side full-text search across wine name, producer, grape, country, and region fields.
- Filter dimensions: wine type, producer, country/region, vintage year, grape variety, storage location, drinking readiness (badge), and rating.
- Active filters displayed as dismissible chips; individual or bulk clear.
- Sort options: name (A–Z / Z–A), vintage (newest / oldest), rating (highest / lowest), quantity (most / fewest), recently added, recently consumed.
- Filter and sort state persisted in session storage; restored on back-navigation.
- URL query params accepted on page load to pre-apply filters from dashboard links and location drill-throughs; params take precedence over sessionStorage when present.

**Priority:** P1 — High, core usability

---

### F4: Tasting Notes & Ratings

**Description:** Each wine can have multiple tasting notes, each dated. A note captures structured sensory observations (appearance, aroma, flavor, finish), a rating, a "would buy again" flag, an occasion label, and optional guest feedback. The rating scale — 5-star or 100-point — is a user-level preference setting. The most recent rating is displayed on wine cards in the collection list.

**Capabilities:**
- Create a tasting note for any wine via `/wines/[id]/notes/new`.
- Note fields: date, appearance, aroma, flavor, finish (all free text), rating, would-buy-again (yes/no/maybe), occasion (dinner, gift, casual, celebration, etc.), guest feedback (free text).
- Rating scale preference: 5-star or 100-point; stored as a user setting; affects display everywhere.
- Multiple notes per wine, displayed in reverse-chronological order on the wine detail page.
- Most recent rating displayed on wine collection list cards.
- Tasting note entry optionally triggered from bottle-consumption flow (F1).
- Form field values auto-saved to sessionStorage as a draft; restored if user navigates away and returns, preventing data loss on accidental navigation or phone lock.

**Priority:** P1 — High, core value proposition

---

### F5: Drinking Window

**Description:** Each wine record includes an optional drinking window defined as start and end year. The system derives a readiness badge automatically based on the current year and recalculates on every page load — no stale badge states. Badges are color-coded for instant visual scanning and are a filterable dimension in the collection list.

**Capabilities:**
- Drinking window fields (start year, end year) on wine create/edit form; both optional.
- Readiness badge auto-derived on load from current year vs. window:
  - **Drink Now** — current year is within the window.
  - **Hold** — current year is before the window start.
  - **Approaching Peak** — current year is within 2 years of the window start.
  - **Past Window** — current year is after the window end.
  - **No Window Set** — no drinking window defined.
- Live badge preview on the wine form: as the user enters start/end years, a computed readiness badge is displayed immediately below the inputs — updated on each change, giving immediate confidence before saving.
- Color-coded badges: distinct colors per state (green / blue / amber / grey / muted).
- Readiness is a filterable dimension in F3 Search & Filter.
- Dashboard "Drink Now" shelf (F6) driven by this calculation.

**Priority:** P1 — High, core value proposition

---

### F6: Collection Dashboard

**Description:** The default landing page (`/`) provides an at-a-glance summary of the entire collection. It surfaces the most actionable information first — how many bottles are ready to drink — alongside collection-level analytics. All cards and counts link to the collection list pre-filtered to the relevant subset, so the dashboard doubles as a navigation hub.

**Capabilities:**
- Summary stat tiles: total bottle count, unique wine count, drink-now count, approaching-peak count.
- "Drink Now" shelf: horizontal-scroll card list of wines with Drink Now readiness badge.
- Collection breakdowns: by wine type (e.g., Red 60%, White 25%, Sparkling 15%), by country/region, by decade of vintage.
- Recently added list: last 5 wines added to the collection.
- Recently consumed list: last 5 bottle-removal events of type Consumed or Gifted.
- Highest rated: top 5 wines by most recent rating.
- All summary cards and list items link to `/cellar` pre-filtered to the corresponding subset.

**Priority:** P1 — High, primary landing experience

---

## 6. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Mobile-first breakpoint | Fully functional and usable at 375px viewport width |
| Accessibility | WCAG 2.1 AA — color contrast, focus management, semantic HTML |
| Deployment | `docker compose up` brings app + DB online with zero manual steps |
| Database connection | `DATABASE_URL` must use hostname `db` (not `localhost`) in container network |
| Frame compatibility | No `X-Frame-Options: DENY` or `frame-ancestors 'none'`/`'self'` CSP — app must render in iframe preview |
| Configuration | `next.config.mjs` only — never `next.config.ts` |
| Navigation | All primary nav routes resolve to real pages; no dead links or 404s |
| Performance | Collection list renders within 1s on a warm Docker container for up to 500 wine records |
| Brand fidelity | Gold `#FBCA5C` accent used on ≤10% of any screen surface; USWDS token system applied consistently |
| Data integrity | Deleting a location does not delete wine records; sets location to "Unknown" |

---

## 7. Success Metrics

- **Deployment:** `docker compose up --build` completes successfully and app is reachable at `localhost:3000` within 60 seconds on a cold start.
- **Full CRUD flow:** A wine can be created, edited, have a tasting note added, have a bottle consumed (with event logged), and be deleted — all without page errors.
- **Location management:** Creating, renaming, and deleting a location works correctly; deleting a location with assigned wines updates those wines to "Location Unknown" without data loss.
- **Search & filter:** Filtering by any single dimension returns the correct subset in under 200ms client-side for a 200-wine dataset.
- **Drinking window:** Readiness badges reflect the correct state based on the current date on every page load with no stale cache state.
- **Dashboard:** Dashboard loads and displays all summary stats and shelves correctly for a collection of 50+ wines.
- **Mobile usability:** All routes are fully navigable and all forms are submittable on a 375px-wide viewport with no horizontal scroll.
- **Accessibility:** Zero WCAG AA contrast failures on all brand color pairings (verified via automated scan).

---

## 8. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Next.js 14 App Router complexity (server vs. client components) | Medium | High | Establish clear conventions early: server components for data fetch, client components for interactivity; document in code comments |
| Docker compose network hostname confusion (`db` vs `localhost`) | Medium | High | Hardcode `DATABASE_URL` with `db` hostname in compose env; add health check to `app` service that waits for `db` |
| Migration failures on cold start (app starts before DB ready) | Medium | High | Use `depends_on` with health check in compose; add retry logic in `npm run migrate` script |
| `next.config.ts` accidentally created by tooling | Low | High | Add `.ts` extension check to CI lint step; document constraint prominently in PROJECT.md |
| WCAG AA failures with Gold `#FBCA5C` on light backgrounds | Medium | Medium | Use Gold exclusively on dark (`#0A0A0A`) backgrounds or as decorative accent; verify contrast ratios during design |
| Frame-blocking headers set by default Next.js security config | Low | Medium | Audit `next.config.mjs` headers; explicitly omit or override `X-Frame-Options` and relevant CSP directives |
| Scope creep (auth, AI, multi-tenant) | Low | High | Maintain hard "Out of Scope" list in PROJECT.md; require explicit PRD amendment to add any excluded feature |

---

## 9. Feature Index

| ID | Feature Name | Priority | Status | Key Routes |
|---|---|---|---|---|
| F0 | Wine Inventory CRUD | P0 — Critical | Pending | `/wines/new`, `/wines/[id]`, `/wines/[id]/edit` |
| F1 | Quantity & Bottle Status | P0 — Critical | Pending | `/wines/[id]`, `/cellar` |
| F2 | Storage Locations | P0 — Critical | Pending | `/locations`, `/wines/new`, `/wines/[id]/edit` |
| F3 | Search & Filter | P1 — High | Pending | `/cellar` |
| F4 | Tasting Notes & Ratings | P1 — High | Pending | `/wines/[id]/notes/new`, `/wines/[id]` |
| F5 | Drinking Window | P1 — High | Pending | `/wines/[id]`, `/cellar`, `/` |
| F6 | Collection Dashboard | P1 — High | Pending | `/` |

**Priority definitions:**
- **P0 — Critical:** Must ship in MVP; app is not useful without this feature.
- **P1 — High:** Ships in MVP; significantly reduces app value if absent.
- **P2 — Medium:** Target for next iteration post-MVP.
- **P3 — Low:** Nice-to-have; deferred indefinitely.

---

*Related documents: FRD-SimpleWineApp.md, TechArch-SimpleWineApp.md, UserStories-SimpleWineApp.md*
*Last updated: 2026-06-05*
