# Story Map — SimpleWineApp

| Field | Value |
|---|---|
| **Product** | SimpleWineApp |
| **Version** | 1.0 |
| **Date** | 2026-06-05 |
| **Status** | Draft |
| **Author** | Pivota Spec Story Map Generator |
| **Related Documents** | PERSONAS-SimpleWineApp.md, JOURNEYS-SimpleWineApp.md, JTBD-SimpleWineApp.md, UserStories-SimpleWineApp.md, PRD-SimpleWineApp.md |

---

## Overview

This story map organizes all 27 user stories (US-0.1 – US-6.4) across two dimensions:

- **X-axis (Journey Stages):** The six canonical stages a user moves through — derived from JRN-01.x and JRN-02.x journey maps. Each stage maps to one or more route touchpoints.
- **Y-axis (Epics → Stories):** Stories grouped by feature epic, ordered from lowest to highest detail level (P0 foundation → P1 depth).

**Natural Acceptance Criteria (NaC)** appear in the rightmost column of each story row. Every NaC is derived by intersecting a specific JTBD outcome with the journey stage the story lives in, producing a testable, user-observable criterion. NaC are **not invented** — they are traceable to a specific JTBD-ID.

**Map Entry IDs** follow the convention `SM-{Epic}.{NN}` (e.g., SM-0.1 = first entry in Epic 0).

**Release assignments:**
- **R1 — MVP Core:** All P0 stories. Delivers a complete foundation journey for both personas (add, track, locate).
- **R2 — MVP Complete:** All P1 stories. Delivers the full value loop (find, consume, note, decide).

---

## Journey Stage Definitions

| Stage ID | Stage Name | Route(s) | Primary Journeys |
|---|---|---|---|
| **S1** | Arrive | `/` (dashboard) | JRN-01.2, JRN-02.1, JRN-02.3 |
| **S2** | Capture | `/wines/new`, `/wines/[id]/edit` | JRN-01.1, JRN-02.3 |
| **S3** | Locate & Filter | `/cellar`, `/locations` | JRN-01.3, JRN-02.1, JRN-02.2, JRN-02.3 |
| **S4** | Consume & Log | `/wines/[id]` (qty controls, event modal) | JRN-01.3 |
| **S5** | Note & Rate | `/wines/[id]/notes/new`, `/wines/[id]` | JRN-01.3, JRN-02.2 |
| **S6** | Audit & Plan | `/locations`, `/` (breakdowns), `/wines/[id]` | JRN-02.1, JRN-02.3 |

---

## Story Map Matrix

### Epic 0: Wine Inventory CRUD (F0) — P0

| SM-ID | Story | Persona | Journey Stage | Route(s) | NaC (derived from JTBD) | Release |
|---|---|---|---|---|---|---|
| SM-0.1 | US-0.1: Add a New Wine | Marcus | S2 — Capture | `/wines/new` | **JTBD-01.1 → S2:** When Marcus opens `/wines/new` on a 375px screen and fills in name, producer, vintage, type, quantity, and location, the wine record appears in the collection list within 90 seconds — with no horizontal scroll at any step | R1 |
| SM-0.2 | US-0.2: Validate Wine Form Inputs | Marcus, Claire | S2 — Capture | `/wines/new`, `/wines/[id]/edit` | **JTBD-01.1 → S2:** When Marcus fat-fingers the vintage year on a touch keyboard, an inline error fires before the API call and prevents a corrupted record from being saved — vintage typos are caught without a page reload | R1 |
| SM-0.3 | US-0.3: View Wine Detail | Claire | S6 — Audit & Plan | `/wines/[id]` | **JTBD-02.1 → S6:** When Claire taps a wine card, the detail page displays full record including exact storage location, drinking-window badge, tasting notes, and bottle history — all without opening a spreadsheet | R1 |
| SM-0.4 | US-0.4: Edit an Existing Wine | Claire | S2 — Capture | `/wines/[id]/edit` | **JTBD-02.1 → S2:** When Claire needs to correct a storage location after a bottle move, the edit form pre-populates all fields and highlights a deleted location as "Location Unknown" — no data loss on correction | R1 |
| SM-0.5 | US-0.5: Delete a Wine Record | Marcus | S6 — Audit & Plan | `/wines/[id]` | **JTBD-01.4 → S6:** When Marcus wants to remove an abandoned record, a confirmation modal shows exactly what will be deleted (notes + events) before any destructive action — zero accidental loss | R1 |

---

### Epic 1: Quantity & Bottle Status (F1) — P0

| SM-ID | Story | Persona | Journey Stage | Route(s) | NaC (derived from JTBD) | Release |
|---|---|---|---|---|---|---|
| SM-1.1 | US-1.1: Increment Bottle Count | Marcus | S4 — Consume & Log | `/wines/[id]`, `/cellar` | **JTBD-01.4 → S4:** When Marcus buys more of a wine he already owns, a single `+` tap on the wine card immediately reflects the new quantity — confirming his stock without walking to the rack | R1 |
| SM-1.2 | US-1.2: Log a Bottle Removal Event | Marcus | S4 — Consume & Log | `/wines/[id]` | **JTBD-01.3 → S4:** When Marcus taps `−` after finishing a bottle, a lightweight bottom-sheet prompt lets him select Consumed/Gifted/Opened and optionally add a note — in ≤ 3 taps with no full-page redirect | R1 |
| SM-1.3 | US-1.3: View Bottle Event History | Claire | S6 — Audit & Plan | `/wines/[id]` | **JTBD-02.3 → S6:** When Claire opens a wine detail page, the immutable bottle event log shows every removal in reverse-chronological order — giving her a permanent, linked record of how each bottle was used | R1 |
| SM-1.4 | US-1.4: See "Cellar Empty" State | Marcus | S4 — Consume & Log | `/wines/[id]`, `/cellar` | **JTBD-01.4 → S4:** When Marcus logs his last bottle, a "Cellar Empty" badge appears on the card without deleting the record — so historical tasting notes and events are preserved for re-buy decisions | R1 |

---

### Epic 2: Storage Locations (F2) — P0

| SM-ID | Story | Persona | Journey Stage | Route(s) | NaC (derived from JTBD) | Release |
|---|---|---|---|---|---|---|
| SM-2.1 | US-2.1: View All Storage Locations | Claire | S6 — Audit & Plan | `/locations` | **JTBD-02.1 → S6:** When Claire navigates to `/locations`, every defined storage space shows a wine count — enabling a full location audit without opening a spreadsheet or counting physically | R1 |
| SM-2.2 | US-2.2: Create a Storage Location | Claire | S2 — Capture | `/locations` | **JTBD-02.1 → S2:** When Claire creates "Basement Rack A", the name is enforced as unique (case-insensitive) and appears immediately in the location selector on the wine form — ensuring consistent nomenclature from the first record | R1 |
| SM-2.3 | US-2.3: Rename a Storage Location | Claire | S6 — Audit & Plan | `/locations` | **JTBD-02.1 → S6:** When Claire renames a location, all wine records automatically reflect the new name via FK — no individual record updates needed, no data inconsistency | R1 |
| SM-2.4 | US-2.4: Delete a Storage Location | Claire | S6 — Audit & Plan | `/locations` | **JTBD-02.1 → S6:** When Claire deletes a retired location, affected wines display "Location Unknown" visibly on detail and list views — prompting re-assignment with no silent data loss | R1 |

---

### Epic 3: Search & Filter (F3) — P1

| SM-ID | Story | Persona | Journey Stage | Route(s) | NaC (derived from JTBD) | Release |
|---|---|---|---|---|---|---|
| SM-3.1 | US-3.1: Search the Collection by Text | Marcus | S3 — Locate & Filter | `/cellar` | **JTBD-01.4 → S3:** When Marcus types a wine name into the search bar, the matching wine and its remaining quantity appear on the list card within 30 seconds — with no page reload and quantity visible without opening the detail page | R2 |
| SM-3.2 | US-3.2: Filter by Multiple Dimensions | Claire | S3 — Locate & Filter | `/cellar` | **JTBD-02.2 → S3:** When Claire applies "Hold" readiness and "Basement Rack A" location as simultaneous filters, only wines matching both criteria appear — with badge states reflecting today's date, stackable chips, and results in < 200 ms | R2 |
| SM-3.3 | US-3.3: Sort the Collection List | Marcus | S3 — Locate & Filter | `/cellar` | **JTBD-01.4 → S3:** When Marcus selects "Quantity Fewest" sort, the list re-orders client-side with no server round-trip — letting him spot low-stock wines before a shopping trip in under 5 seconds | R2 |
| SM-3.4 | US-3.4: Restore State After Back-Navigation | Claire | S3 — Locate & Filter | `/cellar` | **JTBD-02.2 → S3:** When Claire navigates from a filtered cellar list to a wine detail page and returns, her exact search text, active filter chips, and sort order are restored from sessionStorage — no re-filtering required | R2 |

---

### Epic 4: Tasting Notes & Ratings (F4) — P1

| SM-ID | Story | Persona | Journey Stage | Route(s) | NaC (derived from JTBD) | Release |
|---|---|---|---|---|---|---|
| SM-4.1 | US-4.1: Add a Tasting Note to a Wine | Marcus | S5 — Note & Rate | `/wines/[id]/notes/new` | **JTBD-01.3 → S5:** When Marcus opens the tasting note form, the star rating widget is the first, most prominent field — all text fields are optional — so a rating-only note saves in ≤ 2 minutes with fewer than 3 taps from the bottle detail page | R2 |
| SM-4.2 | US-4.2: Prompt Tasting Note After Consume/Gift | Marcus | S5 — Note & Rate | `/wines/[id]`, `/wines/[id]/notes/new` | **JTBD-01.3 → S5:** When Marcus logs a Consumed event, a "Would you like to add a tasting note?" prompt appears within the same flow — reachable in ≤ 3 taps from the consumption event without separate navigation | R2 |
| SM-4.3 | US-4.3: View All Tasting Notes for a Wine | Claire | S6 — Audit & Plan | `/wines/[id]` | **JTBD-02.3 → S6:** When Claire opens a wine detail page, all tasting notes appear in reverse-chronological order in a dedicated section — each displaying all four sensory fields, the 100-point rating, and the occasion label — permanently linked to the record | R2 |
| SM-4.4 | US-4.4: Switch Rating Scale (5-Star / 100-Point) | Claire | S5 — Note & Rate | Tasting note form, wine cards | **JTBD-02.3 → S5:** When Claire switches to the 100-point scale from the tasting note form, all rating displays across the UI (cards, detail, notes list) immediately reflect the new scale — stored internally as normalized 1–100 with no data loss | R2 |

---

### Epic 5: Drinking Window Badges (F5) — P1

| SM-ID | Story | Persona | Journey Stage | Route(s) | NaC (derived from JTBD) | Release |
|---|---|---|---|---|---|---|
| SM-5.1 | US-5.1: Set a Drinking Window on a Wine | Claire | S2 — Capture | `/wines/new`, `/wines/[id]/edit` | **JTBD-02.2 → S2:** When Claire enters a drinking window on the wine form, end-year ≥ start-year is validated inline and a badge preview is shown before save — ensuring the Hold/Approaching Peak calculation will be correct from the first record | R2 |
| SM-5.2 | US-5.2: See Readiness Badge on Cards & Detail | Marcus | S1 — Arrive | `/`, `/cellar`, `/wines/[id]` | **JTBD-01.2 → S1:** When Marcus opens the app, every wine displays a color-coded readiness badge recomputed from today's date — no stale states, no manual refresh — so drink-now candidates are visible at a glance within 1 second of load | R2 |
| SM-5.3 | US-5.3: Filter by Drinking Readiness | Claire | S3 — Locate & Filter | `/cellar` | **JTBD-02.2 → S3:** When Claire selects the "Hold" readiness filter, results reflect live-computed badge values (never cached) and the filter combines correctly with a simultaneous location filter — returning a date-accurate Hold list in < 200 ms | R2 |

---

### Epic 6: Collection Dashboard (F6) — P1

| SM-ID | Story | Persona | Journey Stage | Route(s) | NaC (derived from JTBD) | Release |
|---|---|---|---|---|---|---|
| SM-6.1 | US-6.1: View Summary Stats at a Glance | Marcus | S1 — Arrive | `/` | **JTBD-01.2 → S1:** When Marcus opens the app at `/`, four stat tiles (Total Bottles, Unique Wines, Drink Now, Approaching Peak) are server-rendered on arrival — no client fetch, no skeleton state for > 500 ms — so he knows his cellar state without any navigation | R2 |
| SM-6.2 | US-6.2: Browse the "Drink Now" Shelf | Marcus | S1 — Arrive | `/` | **JTBD-01.2 → S1:** When at least one wine has a drinking window including the current year, the Drink Now shelf displays that wine's card above the fold on the dashboard — Marcus can identify a drink-now candidate and tap through to its detail within 60 seconds of opening the app | R2 |
| SM-6.3 | US-6.3: Recently Added, Consumed & Highest Rated | Marcus | S1 — Arrive | `/` | **JTBD-01.3 → S1:** When Marcus returns to the dashboard after logging a consumed bottle, "Recently Consumed" surfaces the event immediately — so he can tap back to the wine and add a tasting note without searching | R2 |
| SM-6.4 | US-6.4: Explore Collection Breakdowns | Claire | S6 — Audit & Plan | `/` | **JTBD-02.4 → S6:** When Claire opens the dashboard, type/country/decade breakdowns render within 1 second for a 300+ bottle collection — each segment linking to a pre-filtered cellar list — enabling a full buying-trip review with no pivot table or external tool | R2 |

---

## NaC Derivation Table

Full traceability chain: **JTBD outcome → Journey stage → NaC text → Story**

| JTBD-ID | Outcome | Journey Stage | NaC Text | Story(ies) |
|---|---|---|---|---|
| JTBD-01.1 | Log a new bottle in < 90 sec on mobile | S2 — Capture (JRN-01.1: Enter Details, Assign Location, Save & Confirm) | Wine record created on 375px screen in < 90 sec; no horizontal scroll; location assigned at creation; vintage validated inline | US-0.1, US-0.2 |
| JTBD-01.2 | Drink-now candidate found within 60 sec of opening app | S1 — Arrive (JRN-01.2: Open App, Scan Dashboard, Browse Candidates) | Drink Now shelf visible above the fold on `/` dashboard within 1 s; stat tile count ≥ 1; no filter action required | US-5.2, US-6.1, US-6.2 |
| JTBD-01.3 | Tasting note saved in < 2 min from ≤ 3 taps | S4 → S5 — Consume & Log → Note & Rate (JRN-01.3: Decrement, Event, Add Note, Save) | Consume event triggers tasting note prompt within same flow; note reachable in ≤ 3 taps; rating + one-sentence note saves in < 2 min; note linked to wine record | US-1.2, US-4.1, US-4.2 |
| JTBD-01.4 | Quantity confirmed in < 30 sec by search | S3 — Locate & Filter (JRN-01.4 implied: search on `/cellar`) | Search returns matching wine with quantity visible on card within 30 sec; no page reload; total bottle count on dashboard stat tile | US-3.1, US-3.3, US-6.1 |
| JTBD-02.1 | Any bottle's exact location retrieved in < 30 sec | S2, S3, S6 — Capture / Locate / Audit (JRN-02.1: Apply Location Filter; JRN-02.3: Add Case, Audit) | Every wine has a named location from creation; location filter returns correct wines in < 200 ms; `/locations` shows bottle counts with drill-through to pre-filtered cellar list | US-0.1, US-2.1, US-2.2, US-2.3, US-2.4, US-3.2 |
| JTBD-02.2 | Hold + location combined filter returns date-accurate results | S3 — Locate & Filter (JRN-02.1: Apply Readiness Filter, Review Hold List) | Hold badge derived from current year on every load; combined Location + Readiness filters stack correctly; result in < 200 ms with no stale cache | US-3.2, US-3.4, US-5.3 |
| JTBD-02.3 | Full tasting note saved with no data loss on back-navigation | S5 — Note & Rate (JRN-02.2: Enter Fields, Navigate Away, Save & Verify) | All 4 sensory fields + 100-pt rating + occasion saved in one session; form state preserved on background switch and back-navigation; note visible on wine detail page linked to record | US-4.1, US-4.3, US-4.4 |
| JTBD-02.4 | Collection breakdown renders in < 1 s for 300+ bottles | S6 — Audit & Plan (JRN-02.3: Review Dashboard After) | Type/country/decade breakdowns render within 1 s on warm container; each segment links to correctly pre-filtered cellar list; no external tool required | US-6.4 |

---

## Release Planning

### R1 — MVP Core: "Own Your Cellar"

**Theme:** Deliver a complete foundation journey — a user can add any wine, track every bottle, assign storage locations, and view full records. Both personas can replace their spreadsheet for basic data entry and retrieval.

**Stories included:** US-0.1, US-0.2, US-0.3, US-0.4, US-0.5, US-1.1, US-1.2, US-1.3, US-1.4, US-2.1, US-2.2, US-2.3, US-2.4 (13 stories — all P0)

| SM-ID | Story | Persona(s) Served | JTBD(s) Addressed | Journey(s) Enabled |
|---|---|---|---|---|
| SM-0.1 | US-0.1: Add a New Wine | Marcus, Claire | JTBD-01.1, JTBD-02.1 | JRN-01.1, JRN-02.3 |
| SM-0.2 | US-0.2: Validate Wine Form Inputs | Marcus, Claire | JTBD-01.1, JTBD-02.1 | JRN-01.1, JRN-02.3 |
| SM-0.3 | US-0.3: View Wine Detail | Claire | JTBD-02.1 | JRN-02.2 (entry) |
| SM-0.4 | US-0.4: Edit an Existing Wine | Claire | JTBD-02.1 | JRN-02.3 |
| SM-0.5 | US-0.5: Delete a Wine Record | Marcus | JTBD-01.4 | All journeys (maintenance) |
| SM-1.1 | US-1.1: Increment Bottle Count | Marcus | JTBD-01.4 | JRN-01.1, JRN-01.3 |
| SM-1.2 | US-1.2: Log a Bottle Removal Event | Marcus | JTBD-01.3 | JRN-01.3 |
| SM-1.3 | US-1.3: View Bottle Event History | Claire | JTBD-02.3 | JRN-02.2 |
| SM-1.4 | US-1.4: "Cellar Empty" State | Marcus | JTBD-01.4 | JRN-01.3 |
| SM-2.1 | US-2.1: View All Storage Locations | Claire | JTBD-02.1 | JRN-02.3 |
| SM-2.2 | US-2.2: Create a Storage Location | Claire | JTBD-02.1 | JRN-01.1, JRN-02.3 |
| SM-2.3 | US-2.3: Rename a Storage Location | Claire | JTBD-02.1 | JRN-02.3 |
| SM-2.4 | US-2.4: Delete a Storage Location | Claire | JTBD-02.1 | JRN-02.3 |

**Persona coverage:** PER-01 Marcus ✓ (add, track, delete) · PER-02 Claire ✓ (add, locate, manage locations)

**JTBD addressed:** JTBD-01.1 ✓ · JTBD-01.3 (partial — consume event logged, no note prompt yet) · JTBD-01.4 (partial — quantity visible on detail, no search yet) · JTBD-02.1 ✓ · JTBD-02.3 (partial — event log available, no tasting note yet)

**Complete journey(s) enabled by R1:**
- JRN-01.1 (Add wine at the shop) — fully covered: S2 Capture end-to-end
- JRN-02.3 (Manage locations & audit) — fully covered: S2 + S6 Audit

**Journey gaps remaining after R1:** JRN-01.2, JRN-01.3 (partial), JRN-02.1, JRN-02.2 — all resolved in R2.

---

### R2 — MVP Complete: "Decide & Remember"

**Theme:** Deliver the full value loop — users can discover what to drink, consume and log with a note, filter with precision, and review their collection analytically. Both personas can fully retire their spreadsheet.

**Stories included:** US-3.1, US-3.2, US-3.3, US-3.4, US-4.1, US-4.2, US-4.3, US-4.4, US-5.1, US-5.2, US-5.3, US-6.1, US-6.2, US-6.3, US-6.4 (14 stories — all P1)

| SM-ID | Story | Persona(s) Served | JTBD(s) Addressed | Journey(s) Enabled |
|---|---|---|---|---|
| SM-3.1 | US-3.1: Search by Text | Marcus | JTBD-01.4 | JRN-01.3, JRN-02.2 |
| SM-3.2 | US-3.2: Filter by Multiple Dimensions | Claire | JTBD-02.1, JTBD-02.2 | JRN-02.1 |
| SM-3.3 | US-3.3: Sort the Collection List | Marcus | JTBD-01.4 | JRN-01.4 (implied) |
| SM-3.4 | US-3.4: Restore State After Back-Navigation | Claire | JTBD-02.2 | JRN-02.1 |
| SM-4.1 | US-4.1: Add a Tasting Note | Marcus | JTBD-01.3 | JRN-01.3 |
| SM-4.2 | US-4.2: Prompt Note After Consume/Gift | Marcus | JTBD-01.3 | JRN-01.3 |
| SM-4.3 | US-4.3: View All Tasting Notes | Claire | JTBD-02.3 | JRN-02.2 |
| SM-4.4 | US-4.4: Switch Rating Scale | Claire | JTBD-02.3 | JRN-02.2 |
| SM-5.1 | US-5.1: Set a Drinking Window | Claire | JTBD-02.2 | JRN-02.3 |
| SM-5.2 | US-5.2: See Readiness Badge | Marcus | JTBD-01.2 | JRN-01.2 |
| SM-5.3 | US-5.3: Filter by Drinking Readiness | Claire | JTBD-02.2 | JRN-02.1 |
| SM-6.1 | US-6.1: View Summary Stats | Marcus | JTBD-01.2 | JRN-01.2 |
| SM-6.2 | US-6.2: Browse "Drink Now" Shelf | Marcus | JTBD-01.2 | JRN-01.2 |
| SM-6.3 | US-6.3: Recently Added / Consumed / Rated | Marcus | JTBD-01.3 | JRN-01.3 |
| SM-6.4 | US-6.4: Explore Collection Breakdowns | Claire | JTBD-02.4 | JRN-02.3 |

**Persona coverage:** PER-01 Marcus ✓ (search, sort, note, drink-now shelf, dashboard) · PER-02 Claire ✓ (multi-filter, readiness filter, structured notes, rating scale, breakdowns)

**JTBD addressed (completing gaps from R1):** JTBD-01.2 ✓ · JTBD-01.3 ✓ · JTBD-01.4 ✓ · JTBD-02.2 ✓ · JTBD-02.3 ✓ · JTBD-02.4 ✓

**Complete journey(s) enabled by R2:**
- JRN-01.2 (Choose what to drink tonight) — fully covered: S1 Arrive end-to-end
- JRN-01.3 (Log consumed bottle + tasting note) — fully covered: S4 → S5
- JRN-02.1 (Find Hold vs. Drink wines) — fully covered: S1 + S3
- JRN-02.2 (Structured tasting note for aged bottle) — fully covered: S3 + S5 + S6

---

## Coverage Analysis

### Persona Coverage by Release

| Persona | R1 MVP Core | R2 MVP Complete |
|---|---|---|
| **PER-01 Marcus** | Add wine fast on mobile ✓ · Track qty ✓ · Consume log ✓ | Search/sort ✓ · Drink-now shelf ✓ · Quick tasting note ✓ · Dashboard stats ✓ |
| **PER-02 Claire** | Full field set add/edit ✓ · Manage locations ✓ · Location audit ✓ | Multi-dim filter ✓ · Hold + location filter ✓ · Structured notes + 100-pt ✓ · Collection breakdowns ✓ |

Both personas have a working, useful product at the end of R1. R2 completes the full value proposition for each.

---

### JTBD Coverage by Release

| JTBD-ID | R1 Status | R2 Status |
|---|---|---|
| JTBD-01.1: Log new bottle in < 90 sec on mobile | ✓ **Fully addressed** (US-0.1, US-0.2) | — |
| JTBD-01.2: Drink-now decision in < 60 sec | ✗ Not started | ✓ **Fully addressed** (US-5.2, US-6.1, US-6.2) |
| JTBD-01.3: Tasting note in < 2 min from ≤ 3 taps | ⚠ Partial (US-1.2 logs consume; no note prompt) | ✓ **Fully addressed** (US-4.1, US-4.2, US-6.3) |
| JTBD-01.4: Confirm quantity in < 30 sec by search | ⚠ Partial (qty on detail page; no cellar search) | ✓ **Fully addressed** (US-3.1, US-3.3, US-6.1) |
| JTBD-02.1: Exact location retrieved in < 30 sec | ✓ **Fully addressed** (US-2.1–2.4, US-0.1) | — |
| JTBD-02.2: Hold + location combined filter | ✗ Not started | ✓ **Fully addressed** (US-3.2, US-3.4, US-5.3) |
| JTBD-02.3: Full structured tasting note, no data loss | ⚠ Partial (event log in US-1.3; no note form) | ✓ **Fully addressed** (US-4.1, US-4.3, US-4.4) |
| JTBD-02.4: Collection breakdown in < 1 s | ✗ Not started | ✓ **Fully addressed** (US-6.4) |

---

### Gap Analysis

#### Journey Stages Without R1 Coverage
| Gap | Stage | Resolved In |
|---|---|---|
| No drink-now discovery on dashboard | S1 — Arrive | R2 (US-6.1, US-6.2, US-5.2) |
| No client-side search or filter on `/cellar` | S3 — Locate & Filter | R2 (US-3.1–3.4, US-5.3) |
| No tasting note entry flow | S5 — Note & Rate | R2 (US-4.1–4.4) |
| No collection breakdown analytics | S6 — Audit & Plan (breakdowns) | R2 (US-6.4) |

#### JTBD Outcomes Without Stories
All 8 JTBD outcomes are covered by at least one story across R1 and R2. **No unaddressed outcomes.**

#### Orphan Stories (Not Mapped to Any Journey Stage)
**None.** All 27 stories map to at least one of the six journey stages.

#### Journey Stages With No Mapped Stories
**None.** All six stages (S1–S6) have at least two stories assigned.

---

## NaC-to-Acceptance Criteria Alignment

Verifies that each NaC is consistent with the formal acceptance criteria in UserStories-SimpleWineApp.md.

| SM-ID | Story | NaC Statement | AC Alignment | Status |
|---|---|---|---|---|
| SM-0.1 | US-0.1 | Wine created in < 90 sec on 375px; no horizontal scroll; location required | AC: "Form fully usable on 375px; no horizontal scroll"; location required; redirect to `/wines/[id]` on save | ✓ Aligned |
| SM-0.2 | US-0.2 | Vintage typo caught inline before API call; no corrupted record | AC: "Vintage year rejects non-integers and values outside 1900–(current year+1)"; client-side validation before API | ✓ Aligned |
| SM-0.3 | US-0.3 | Full record including location, badge, notes, history on one page | AC: All stored fields displayed; readiness badge in page header; tasting notes and event log shown | ✓ Aligned |
| SM-0.4 | US-0.4 | Edit form pre-populates all fields; deleted location highlighted | AC: "Location Unknown — please select a new location" shown for deleted location; all validation rules apply | ✓ Aligned |
| SM-0.5 | US-0.5 | Confirmation modal names what will be deleted before any action | AC: Modal text "Delete [wine name]? This cannot be undone. All tasting notes and bottle events will also be deleted." | ✓ Aligned |
| SM-1.1 | US-1.1 | Single `+` tap increments quantity immediately | AC: "`+` immediately increments quantity by 1 and updates the displayed count" | ✓ Aligned |
| SM-1.2 | US-1.2 | ≤ 3 taps to consume event; note prompt appears | AC: Modal with Consumed/Gifted/Opened; "Would you like to add a tasting note?" after Consumed or Gifted | ✓ Aligned |
| SM-1.3 | US-1.3 | Event log immutable, reverse-chronological, on wine detail | AC: "Bottle History" section; reverse-chronological; read-only | ✓ Aligned |
| SM-1.4 | US-1.4 | "Cellar Empty" badge; record and notes retained | AC: "Cellar Empty" badge when qty = 0; wine record and notes NOT deleted | ✓ Aligned |
| SM-2.1 | US-2.1 | `/locations` shows each location with wine count | AC: "Each location row shows: location name, wine count" | ✓ Aligned |
| SM-2.2 | US-2.2 | Unique name enforced; new location available in selector immediately | AC: "Location names are unique case-insensitively"; appears in list with wine count = 0 | ✓ Aligned |
| SM-2.3 | US-2.3 | Rename propagates via FK; no individual record updates needed | AC: "All wine records using that location automatically reflect the new name (via FK relationship)" | ✓ Aligned |
| SM-2.4 | US-2.4 | Deleted location → "Location Unknown" on all affected wines | AC: Wines display "Location Unknown" on detail and list; edit form highlights and prompts re-assignment | ✓ Aligned |
| SM-3.1 | US-3.1 | Search returns result with qty visible on card in < 30 sec; no reload | AC: Debounced 150 ms client-side filter; "Showing N of Total wines"; quantity on card visible | ✓ Aligned |
| SM-3.2 | US-3.2 | Location + Hold filters stack; results < 200 ms; badges never stale | AC: AND logic across dimensions; dismissible chips; "Readiness filter options reflect live-computed badge values" | ✓ Aligned |
| SM-3.3 | US-3.3 | Sort re-orders client-side with no server round-trip | AC: "immediately re-orders the filtered result set client-side with no server round-trip" | ✓ Aligned |
| SM-3.4 | US-3.4 | Search text, filter chips, sort order all restored from sessionStorage | AC: "restores the exact search text, active filter chips, and sort order"; no server round-trip | ✓ Aligned |
| SM-4.1 | US-4.1 | Rating widget first field; all text optional; saves in < 2 min | AC: Rating input first (star or 100-pt per preference); all fields except `tasted_on` optional; redirect to `/wines/[id]` | ✓ Aligned |
| SM-4.2 | US-4.2 | Prompt after Consumed/Gifted; reachable in ≤ 3 taps | AC: "Would you like to add a tasting note?" with Yes/Skip after Consumed or Gifted; Yes navigates to `/wines/[id]/notes/new` | ✓ Aligned |
| SM-4.3 | US-4.3 | All notes reverse-chronological; all four sensory fields visible | AC: Notes ordered by `tasted_on` DESC; each note displays appearance, aroma, flavor, finish, rating, occasion | ✓ Aligned |
| SM-4.4 | US-4.4 | Scale switch updates all rating displays immediately | AC: "After switching, all rating displays across the UI immediately reflect the new scale" | ✓ Aligned |
| SM-5.1 | US-5.1 | End-year ≥ start-year validated inline; badge preview before save | AC: "end year must be ≥ start year; otherwise the error 'Drinking window end year must be ≥ start year.' is shown" | ✓ Aligned |
| SM-5.2 | US-5.2 | Badge recomputed from today's date on every page load; no cached state | AC: "recomputed on every page load, never cached"; color-coded; WCAG AA | ✓ Aligned |
| SM-5.3 | US-5.3 | Readiness filter live-computed; combinable with location filter | AC: "Readiness filtering is applied after badge computation at render time — never stale"; "can be combined with other filter dimensions" | ✓ Aligned |
| SM-6.1 | US-6.1 | 4 stat tiles server-rendered on arrival; Drink Now tile links to pre-filtered list | AC: Four stat tiles; "server-rendered on page arrival — no client-side fetch required on initial load"; Drink Now tile links to `/cellar?readiness=drink-now` | ✓ Aligned |
| SM-6.2 | US-6.2 | Drink Now shelf visible on dashboard; cards link to detail; computed server-side | AC: Horizontal-scroll shelf; "computed server-side (SQL filter) and never shows stale readiness data" | ✓ Aligned |
| SM-6.3 | US-6.3 | Recently Consumed visible on dashboard; links to wine detail | AC: "Recently Consumed" lists 5 most recent Consumed or Gifted events; each links to `/wines/[id]` | ✓ Aligned |
| SM-6.4 | US-6.4 | Type/country/decade breakdowns in < 1 s; each segment links to filtered list | AC: "Each breakdown segment links to `/cellar` pre-filtered to the corresponding dimension"; breakdowns handle NULL vintage | ✓ Aligned |

**All 27 NaC verified as aligned with their corresponding UserStory acceptance criteria. No conflicts detected.**

---

## Story Map ID Index

| SM-ID | US-ID | Story Title | Feature | Priority | Release |
|---|---|---|---|---|---|
| SM-0.1 | US-0.1 | Add a New Wine | F0 | P0 | R1 |
| SM-0.2 | US-0.2 | Validate Wine Form Inputs | F0 | P0 | R1 |
| SM-0.3 | US-0.3 | View Wine Detail | F0 | P0 | R1 |
| SM-0.4 | US-0.4 | Edit an Existing Wine | F0 | P0 | R1 |
| SM-0.5 | US-0.5 | Delete a Wine Record | F0 | P0 | R1 |
| SM-1.1 | US-1.1 | Increment Bottle Count | F1 | P0 | R1 |
| SM-1.2 | US-1.2 | Log a Bottle Removal Event | F1 | P0 | R1 |
| SM-1.3 | US-1.3 | View Bottle Event History | F1 | P0 | R1 |
| SM-1.4 | US-1.4 | See "Cellar Empty" State | F1 | P0 | R1 |
| SM-2.1 | US-2.1 | View All Storage Locations | F2 | P0 | R1 |
| SM-2.2 | US-2.2 | Create a Storage Location | F2 | P0 | R1 |
| SM-2.3 | US-2.3 | Rename a Storage Location | F2 | P0 | R1 |
| SM-2.4 | US-2.4 | Delete a Storage Location | F2 | P0 | R1 |
| SM-3.1 | US-3.1 | Search the Collection by Text | F3 | P1 | R2 |
| SM-3.2 | US-3.2 | Filter by Multiple Dimensions | F3 | P1 | R2 |
| SM-3.3 | US-3.3 | Sort the Collection List | F3 | P1 | R2 |
| SM-3.4 | US-3.4 | Restore State After Back-Navigation | F3 | P1 | R2 |
| SM-4.1 | US-4.1 | Add a Tasting Note to a Wine | F4 | P1 | R2 |
| SM-4.2 | US-4.2 | Prompt Tasting Note After Consume/Gift | F4 | P1 | R2 |
| SM-4.3 | US-4.3 | View All Tasting Notes for a Wine | F4 | P1 | R2 |
| SM-4.4 | US-4.4 | Switch Between 5-Star and 100-Point Scale | F4 | P1 | R2 |
| SM-5.1 | US-5.1 | Set a Drinking Window on a Wine | F5 | P1 | R2 |
| SM-5.2 | US-5.2 | See Readiness Badge on Cards & Detail | F5 | P1 | R2 |
| SM-5.3 | US-5.3 | Filter by Drinking Readiness | F5 | P1 | R2 |
| SM-6.1 | US-6.1 | View Summary Stats at a Glance | F6 | P1 | R2 |
| SM-6.2 | US-6.2 | Browse the "Drink Now" Shelf | F6 | P1 | R2 |
| SM-6.3 | US-6.3 | Recently Added / Consumed / Highest Rated | F6 | P1 | R2 |
| SM-6.4 | US-6.4 | Explore Collection Breakdowns | F6 | P1 | R2 |

---

*Related documents: PERSONAS-SimpleWineApp.md, JTBD-SimpleWineApp.md, JOURNEYS-SimpleWineApp.md, UserStories-SimpleWineApp.md, PRD-SimpleWineApp.md*
*Last updated: 2026-06-05*
