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
---

## F00: Wine Inventory CRUD

**Description:** The foundational feature of SimpleWineApp. Every bottle in the collection is represented as a structured wine record stored in PostgreSQL. Users can create a new wine entry via `/wines/new`, view its full detail at `/wines/[id]`, edit any field at `/wines/[id]/edit`, and permanently delete the record with a confirmation prompt. All required fields are enforced with inline validation. Vintage year is validated to the range 1900–(current year + 1) to prevent invalid entries while allowing pre-release vintages.

**Terminology:**
- **Wine Record:** A single row in the `wines` table; represents one SKU in the collection.
- **Vintage Year:** The harvest year of the grapes; integer; validated range 1900–(current year + 1).
- **Bottle Size:** Volume descriptor (e.g., "750ml", "Magnum 1.5L"). Free-text with suggested values.
- **Wine Type:** Categorical field — one of: `Red`, `White`, `Rosé`, `Sparkling`, `Dessert`, `Fortified`, `Orange`, `Other`.
- **Inline Validation:** Real-time or on-blur field-level error messages shown adjacent to the invalid field.
- **Required Field:** A field that must have a non-empty value before the form can be submitted. Marked with `*` in UI.

**Sub-features:**
- Create wine record (form at `/wines/new`)
- View wine detail (page at `/wines/[id]`)
- Edit wine record (form at `/wines/[id]/edit`)
- Delete wine record (confirm-and-delete from `/wines/[id]`)
- Vintage year range validation
- Required-field inline validation

---

### Process: Create Wine

1. User navigates to `/wines/new`.
2. System renders the wine form with all fields; storage location selector populated from `locations` table.
3. User fills in required fields and optional fields, then submits.
4. Client validates all fields before submission (see Validation section).
5. On client validation pass, `POST /api/wines` is called with form data.
6. Server re-validates all fields (defense-in-depth).
7. Server inserts row into `wines` table with `created_at = NOW()`.
8. Server returns `201 Created` with the new wine record including its `id`.
9. Client redirects to `/wines/[id]` (the new wine's detail page).

### Process: View Wine Detail

1. User navigates to `/wines/[id]`.
2. Server fetches wine record by `id` from database.
3. If not found, render 404 page with "Wine not found" message.
4. System renders the detail page displaying all fields, tasting notes (reverse-chronological), bottle event log, and readiness badge (computed from drinking window + current year per F05).
5. Quantity controls (increment/decrement) are displayed per F01.

### Process: Edit Wine

1. User navigates to `/wines/[id]/edit` or clicks "Edit" on the detail page.
2. System fetches current wine record and pre-populates all form fields.
3. Storage location selector populated from `locations` table; current location pre-selected.
4. User modifies fields and submits.
5. Client validates (same rules as Create).
6. `PUT /api/wines/[id]` called with full updated record.
7. Server re-validates, updates row, sets `updated_at = NOW()`.
8. Server returns `200 OK` with updated wine record.
9. Client redirects to `/wines/[id]`.

### Process: Delete Wine

1. User clicks "Delete" on `/wines/[id]`.
2. System displays a confirmation modal: "Delete [wine name]? This cannot be undone. All tasting notes and bottle events will also be deleted."
3. User confirms deletion.
4. `DELETE /api/wines/[id]` called.
5. Server cascades deletion: removes all associated `tasting_notes` and `bottle_events` rows, then removes the `wines` row.
6. Server returns `204 No Content`.
7. Client redirects to `/cellar`.

---

### Inputs

**Required Fields (`*`):**
- `name*` (string, max 255): Wine name (e.g., "Château Margaux 2015" or just "Cabernet Sauvignon")
- `producer*` (string, max 255): Producer or winery name
- `vintage*` (integer): Harvest year; range 1900–(current year + 1)
- `wine_type*` (enum): One of `Red | White | Rosé | Sparkling | Dessert | Fortified | Orange | Other`
- `quantity*` (integer, min 1, max 9999): Number of bottles currently in cellar
- `location_id*` (integer, FK → locations.id): Required; user selects from dropdown. The form displays helper text adjacent to this field: "Each wine record tracks one storage location. To split a case across two locations, create separate records with the appropriate quantities for each."

**Optional Fields:**
- `grape` (opt) (string, max 255): Primary grape variety (e.g., "Pinot Noir", "Blend")
- `country` (opt) (string, max 100): Country of origin
- `region` (opt) (string, max 100): Wine region (e.g., "Burgundy", "Napa Valley")
- `bottle_size` (opt) (string, max 50): Free text with suggestions: "375ml", "750ml", "Magnum 1.5L", "Double Magnum 3L", "Jeroboam 4.5L"
- `purchase_date` (opt) (date, YYYY-MM-DD): Date bottles were purchased
- `purchase_source` (opt) (string, max 255): Retailer, auction, winery, etc.
- `purchase_price` (opt) (numeric, max 99999.99): Price per bottle in user's local currency
- `drinking_window_start` (opt) (integer): Start year of drinking window; see F05
- `drinking_window_end` (opt) (integer): End year of drinking window; see F05
- `notes` (opt) (text): Free-text general notes about the wine (not a tasting note)

---

### Outputs

- **Create:** `201 Created` + JSON wine record with all fields + assigned `id`, `created_at`, `updated_at`.
- **View:** Full wine detail page with all stored fields, computed readiness badge, tasting notes list, bottle event log.
- **Edit:** `200 OK` + JSON updated wine record; redirects to detail page.
- **Delete:** `204 No Content`; redirects to `/cellar`.
- **Validation error:** `422 Unprocessable Entity` + JSON error object listing field-level errors.
- **Not found:** `404 Not Found` + JSON `{ error: "WINE_NOT_FOUND" }`.

---

### Validation Rules

- `name`: Required; non-empty after trim; max 255 chars.
- `producer`: Required; non-empty after trim; max 255 chars.
- `vintage`: Required; integer; `1900 ≤ vintage ≤ (new Date().getFullYear() + 1)`. Error if non-integer or out of range.
- `wine_type`: Required; must be one of the eight allowed enum values: `Red`, `White`, `Rosé`, `Sparkling`, `Dessert`, `Fortified`, `Orange`, `Other` (case-sensitive on API; UI dropdown enforces this).
- `quantity`: Required; integer; `1 ≤ quantity ≤ 9999`. Must be a whole number (no decimals).
- `location_id`: Required; must reference an existing row in `locations` table. If location was deleted between form load and submit, return `LOCATION_NOT_FOUND` error.
- `grape`: Optional; if provided, max 255 chars after trim.
- `country`: Optional; if provided, max 100 chars after trim.
- `region`: Optional; if provided, max 100 chars after trim.
- `bottle_size`: Optional; if provided, max 50 chars after trim.
- `purchase_price`: Optional; if provided, must be a non-negative number with at most 2 decimal places; max value 99999.99.
- `purchase_date`: Optional; if provided, must be a valid calendar date in YYYY-MM-DD format; not in the future (allow today).
- `drinking_window_start`: Optional; if provided, must be an integer ≥ 1900.
- `drinking_window_end`: Optional; if provided, must be an integer ≥ `drinking_window_start` (when both are set). Error if end < start.
- `notes`: Optional; no max length enforced (PostgreSQL `text`); client-side textarea character counter at 2000 chars (advisory only).

---

### Error States

| Scenario | HTTP Status | Error Code | User-Facing Message |
|----------|-------------|------------|---------------------|
| Missing required field | 422 | `VALIDATION_ERROR` | "[Field] is required." |
| Vintage out of range | 422 | `VINTAGE_OUT_OF_RANGE` | "Vintage must be between 1900 and [current year + 1]." |
| Invalid wine type | 422 | `INVALID_WINE_TYPE` | "Select a valid wine type." |
| Quantity < 1 or > 9999 | 422 | `QUANTITY_OUT_OF_RANGE` | "Quantity must be between 1 and 9999." |
| Location not found | 422 | `LOCATION_NOT_FOUND` | "Selected storage location no longer exists. Please choose another." |
| Drinking window end < start | 422 | `WINDOW_INVALID_RANGE` | "Drinking window end year must be ≥ start year." |
| Wine not found (view/edit/delete) | 404 | `WINE_NOT_FOUND` | "Wine not found." |
| Database error on write | 500 | `DB_WRITE_ERROR` | "Could not save wine. Please try again." |

---

### API Surface (this feature)

See `Y1-api.md` §Wines for full request/response schemas.

| Method | Path | Action |
|--------|------|--------|
| `GET` | `/api/wines` | List all wines (used by cellar list) |
| `POST` | `/api/wines` | Create wine |
| `GET` | `/api/wines/[id]` | Get single wine |
| `PUT` | `/api/wines/[id]` | Update wine |
| `DELETE` | `/api/wines/[id]` | Delete wine |

---

### Schema Surface (this feature)

Uses tables: `wines`, `locations` (FK reference). Full DDL in `Y0-schema.md` §wines.

Key columns: `id`, `name`, `producer`, `vintage`, `wine_type`, `grape`, `country`, `region`, `bottle_size`, `quantity`, `location_id`, `purchase_date`, `purchase_source`, `purchase_price`, `drinking_window_start`, `drinking_window_end`, `notes`, `created_at`, `updated_at`.
---

## F01: Quantity & Bottle Status

**Description:** Tracks the physical bottle count for each wine record and maintains an immutable audit log of what happened to each bottle removed from the cellar. When a user decrements quantity, a modal prompts them to classify the removal as Consumed, Gifted, or Opened. Each such event is recorded with a timestamp and optional note. When quantity reaches zero, the wine card and detail page display a "Cellar Empty" state — but the wine record is retained in the database for historical and tasting-note purposes. Consuming or gifting a bottle additionally prompts an optional tasting note entry flow (linking to F04).

**Terminology:**
- **Bottle Event:** A logged record of a single bottle leaving the cellar. Contains: wine ID, event type, date, optional note.
- **Event Type:** One of `Consumed`, `Gifted`, `Opened`. Consumed = fully drunk; Gifted = given away; Opened = still open/in use.
- **Cellar Empty:** UI state when `wines.quantity = 0`. Wine record is NOT deleted.
- **Increment:** Adding bottles to an existing wine record (e.g., new purchase batch). Does not create a bottle event.
- **Decrement:** Removing one bottle from the count. Always creates a bottle event.

**Sub-features:**
- Increment bottle count (no event logged)
- Decrement bottle count with event type selection
- Bottle event log per wine
- "Cellar Empty" state at quantity 0
- Optional tasting note prompt after Consumed or Gifted event

---

### Process: Increment Quantity

1. User clicks the `+` button on the wine detail page (`/wines/[id]`) or the wine card on `/cellar`.
2. `PATCH /api/wines/[id]/quantity` called with `{ delta: +1 }`.
3. Server increments `wines.quantity` by 1; enforces max 9999.
4. Server returns `200 OK` with `{ quantity: <new_value> }`.
5. UI updates the displayed quantity in place (optimistic update or after response).
6. No bottle event is created.

### Process: Decrement Quantity

1. User clicks the `−` button on the wine detail page or wine card.
2. If `quantity = 0`, the button is disabled; no action taken.
3. System displays a "Remove a Bottle" modal with three event-type buttons: **Consumed**, **Gifted**, **Opened**, plus a "Cancel" option and an optional note textarea.
4. User selects an event type (required to proceed).
5. User optionally enters a note (free text, max 500 chars).
6. User confirms.
7. `PATCH /api/wines/[id]/quantity` called with `{ delta: -1, event_type: "Consumed|Gifted|Opened", note: "..." }`.
8. Server decrements `wines.quantity` by 1 (minimum 0; never goes negative).
9. Server inserts a row into `bottle_events` with `wine_id`, `event_type`, `event_date = TODAY`, `note`.
10. Server returns `200 OK` with `{ quantity: <new_value>, event_id: <new_event_id> }`.
11. UI updates quantity display.
12. If event type is `Consumed` or `Gifted`:
    - System displays a prompt: "Would you like to add a tasting note for this bottle?" with **Yes** and **Skip** buttons.
    - If **Yes**: navigate to `/wines/[id]/notes/new` (F04 flow).
    - If **Skip**: dismiss prompt, return to current page.
13. If event type is `Opened`:
    - No tasting note prompt shown. Return to current page.

### Process: View Bottle Event Log

1. On `/wines/[id]`, below the wine details section, a "Bottle History" section lists all `bottle_events` for this wine.
2. Events displayed in reverse-chronological order (newest first).
3. Each event shows: date, event type badge (color-coded), optional note.
4. Event log is read-only — events cannot be edited or deleted via UI.

---

### Inputs

**Increment:**
- `wine_id` (integer, path param): The wine to increment.
- `delta` (integer, body): Always `+1`.

**Decrement:**
- `wine_id` (integer, path param): The wine to decrement.
- `delta` (integer, body): Always `-1`.
- `event_type*` (enum, body): One of `Consumed | Gifted | Opened` — required.
- `note` (opt) (string, max 500, body): Optional context for the removal.

---

### Outputs

- **Increment success:** `200 OK` + `{ quantity: <integer> }`.
- **Decrement success:** `200 OK` + `{ quantity: <integer>, event_id: <integer> }`.
- **Quantity at 0 after decrement:** Same `200 OK` response; UI switches to "Cellar Empty" display state.
- **Bottle event log:** Reverse-chronological list of `bottle_events` rows rendered on wine detail page.

---

### Validation Rules

- `delta`: Must be exactly `+1` or `-1`. Any other value rejected with `400 Bad Request`.
- `event_type`: Required on decrement; must be one of `Consumed`, `Gifted`, `Opened` (case-sensitive). Missing → `422 MISSING_EVENT_TYPE`.
- `note` (decrement): Optional; if provided, max 500 chars; excess trimmed with a client-side counter warning.
- Decrement when `quantity = 0`: Rejected by server with `409 QUANTITY_ALREADY_ZERO`. UI prevents this by disabling the `−` button when quantity is 0.
- Increment when `quantity = 9999`: Rejected by server with `409 QUANTITY_AT_MAX`. UI disables the `+` button at max.
- `wine_id`: Must reference an existing `wines` row. If not found → `404 WINE_NOT_FOUND`.

---

### Error States

| Scenario | HTTP Status | Error Code | User-Facing Message |
|----------|-------------|------------|---------------------|
| Decrement when quantity = 0 | 409 | `QUANTITY_ALREADY_ZERO` | "No bottles left to remove." |
| Increment when quantity = 9999 | 409 | `QUANTITY_AT_MAX` | "Maximum bottle count reached." |
| Missing event type on decrement | 422 | `MISSING_EVENT_TYPE` | "Please select what happened to this bottle." |
| Invalid event type value | 422 | `INVALID_EVENT_TYPE` | "Invalid event type." |
| Wine not found | 404 | `WINE_NOT_FOUND` | "Wine not found." |
| DB error on quantity update | 500 | `DB_WRITE_ERROR` | "Could not update quantity. Please try again." |

---

### UI States

| `wines.quantity` | UI Behavior |
|-----------------|-------------|
| `> 0` | `+` and `−` buttons active; quantity displayed numerically |
| `= 0` | `−` button disabled; "Cellar Empty" badge displayed; `+` button still active (user may acquire more) |

---

### API Surface (this feature)

See `Y1-api.md` §Quantity for full request/response schemas.

| Method | Path | Action |
|--------|------|--------|
| `PATCH` | `/api/wines/[id]/quantity` | Increment or decrement quantity; on decrement, log bottle event |
| `GET` | `/api/wines/[id]/events` | Retrieve bottle event log for a wine |

---

### Schema Surface (this feature)

Uses tables: `wines` (column `quantity`), `bottle_events`. Full DDL in `Y0-schema.md` §bottle_events.

Key `bottle_events` columns: `id`, `wine_id`, `event_type`, `event_date`, `note`, `created_at`.
---

## F02: Storage Locations

**Description:** Users define named storage locations (e.g., "Basement Rack A", "Temperature Locker 1") to track where bottles physically reside. Every wine record requires exactly one storage location. The `/locations` route provides a management UI where users can create new locations, rename existing ones, and delete locations they no longer use. Deleting a location is non-destructive to wine records: affected wines are flagged with a "Location Unknown" indicator rather than being silently orphaned or deleted.

**Terminology:**
- **Location:** A user-defined named storage area; a row in the `locations` table.
- **Location Unknown:** Wine state when its assigned location has been deleted. The `wines.location_id` is set to `NULL`; UI renders a "Location Unknown" label in place of a location name.
- **Wine Count:** The number of wine records currently assigned to a given location; displayed in the locations list.

**Sub-features:**
- List all locations with per-location wine count
- Create new location
- Rename existing location
- Delete location (with orphan-handling for assigned wines)
- Location selector on wine create/edit form

---

### Process: List Locations

1. User navigates to `/locations`.
2. System queries `locations` table joined with `wines` table to compute a wine count per location.
3. System renders a list: each row shows location name (as a clickable link), wine count, and action buttons (Rename, Delete).
4. **Drill-through:** The location name in each row is a link that navigates to `/cellar?location=[location_name]` (URL-encoded), pre-applying the location filter on the cellar list. This allows users to audit all wines in a specific location with one tap.
5. If no locations exist, render an empty state: "No storage locations yet. Add your first location below."
6. A location's wine count includes wines at quantity 0 (Cellar Empty wines are still associated with a location).

### Process: Create Location

1. User enters a name in the "Add Location" input and submits.
2. `POST /api/locations` called with `{ name: "..." }`.
3. Server trims the name, validates uniqueness (case-insensitive), and inserts into `locations`.
4. Server returns `201 Created` with the new location row.
5. Locations list updates to include the new entry with wine count = 0.

### Process: Rename Location

1. User clicks "Rename" on a location row; an inline edit field appears pre-filled with the current name.
2. User types a new name and confirms.
3. `PUT /api/locations/[id]` called with `{ name: "..." }`.
4. Server trims the name, validates uniqueness (case-insensitive, excluding current location's own name), and updates the row.
5. Server returns `200 OK` with updated location.
6. All wine records referencing this location implicitly reflect the new name (FK relationship; no wine rows need updating).

### Process: Delete Location

1. User clicks "Delete" on a location row.
2. System displays a confirmation modal:
   - If wine count = 0: "Delete '[Location Name]'? This cannot be undone."
   - If wine count > 0: "Delete '[Location Name]'? [N] wine(s) will be marked 'Location Unknown'. This cannot be undone."
3. User confirms.
4. `DELETE /api/locations/[id]` called.
5. Server sets `wines.location_id = NULL` for all wines where `location_id = [id]` (UPDATE first, then DELETE location).
6. Server deletes the location row.
7. Server returns `204 No Content`.
8. Locations list refreshes; affected wine records now display "Location Unknown" when viewed.

### Process: Location Selector on Wine Form

1. When user opens `/wines/new` or `/wines/[id]/edit`, the storage location field is rendered as a `<select>` dropdown.
2. Dropdown options are populated from the `locations` table (all active locations, sorted alphabetically by name).
3. On `/wines/new`: no default selection; the placeholder reads "Select a storage location…".
4. On `/wines/[id]/edit`: current location pre-selected. If wine's location was deleted (location_id = NULL), placeholder reads "Location Unknown — please select a new location" and the field is highlighted as requiring a value.
5. User must select a valid location before the form can be submitted.

---

### Inputs

**Create Location:**
- `name*` (string, max 100): Location name; required; must be unique (case-insensitive).

**Rename Location:**
- `location_id*` (integer, path param): Location to rename.
- `name*` (string, max 100): New name; required; must be unique (case-insensitive), excluding current location.

**Delete Location:**
- `location_id*` (integer, path param): Location to delete.

---

### Outputs

- **List:** Array of `{ id, name, wine_count }` objects, sorted alphabetically by name. Each location name rendered as a link to `/cellar?location=[encoded_name]`.
- **Create:** `201 Created` + `{ id, name, wine_count: 0, created_at }`.
- **Rename:** `200 OK` + `{ id, name, updated_at }`.
- **Delete:** `204 No Content`; wines with deleted location_id now have `location_id = NULL`.
- **Wine form selector:** `<select>` populated with all current locations.

---

### Validation Rules

- `name` (create/rename): Required; non-empty after trim; max 100 chars.
- `name` (create/rename): Must be unique case-insensitively across the `locations` table (excluding the location being renamed). Error: `LOCATION_NAME_CONFLICT`.
- `location_id` (rename/delete): Must reference an existing location row. Error: `LOCATION_NOT_FOUND`.
- Delete is always allowed regardless of wine count (orphan-flagging handles the side effect).
- No minimum wine count required to delete; locations with 0 wines can be freely deleted.

---

### Error States

| Scenario | HTTP Status | Error Code | User-Facing Message |
|----------|-------------|------------|---------------------|
| Location name empty | 422 | `VALIDATION_ERROR` | "Location name is required." |
| Location name too long | 422 | `VALIDATION_ERROR` | "Location name must be 100 characters or fewer." |
| Duplicate location name | 409 | `LOCATION_NAME_CONFLICT` | "A location with that name already exists." |
| Location not found (rename/delete) | 404 | `LOCATION_NOT_FOUND` | "Location not found." |
| DB error on write | 500 | `DB_WRITE_ERROR` | "Could not save location. Please try again." |

---

### API Surface (this feature)

See `Y1-api.md` §Locations for full request/response schemas.

| Method | Path | Action |
|--------|------|--------|
| `GET` | `/api/locations` | List all locations with wine counts |
| `POST` | `/api/locations` | Create location |
| `PUT` | `/api/locations/[id]` | Rename location |
| `DELETE` | `/api/locations/[id]` | Delete location; sets affected wines' location_id to NULL |

---

### Schema Surface (this feature)

Uses tables: `locations`, `wines` (column `location_id`). Full DDL in `Y0-schema.md` §locations.

Key `locations` columns: `id`, `name`, `created_at`, `updated_at`.
Key `wines` column: `location_id` (nullable FK → `locations.id`; set to NULL on location delete).
---

## F03: Search & Filter

**Description:** The `/cellar` collection list provides fast, client-side search and multi-dimensional filtering so users can quickly find any wine without a server round-trip. All filter state — including search text, active filters, and sort order — persists in `sessionStorage` so navigating away and returning (e.g., to view a wine detail and then press Back) restores the previous context exactly. Active filters render as dismissible chips for full transparency about what is narrowing the list.

**Terminology:**
- **Full-Text Search:** Client-side substring match across wine name, producer, grape, country, and region fields. Case-insensitive.
- **Filter Dimension:** A discrete attribute category used to narrow results (e.g., wine type, vintage year).
- **Filter Chip:** A small dismissible UI element showing each active filter (e.g., "Type: Red ✕"). Clicking ✕ removes that filter.
- **Session-Persistent:** State stored in `sessionStorage`; survives in-tab navigation (back/forward) but is cleared when the tab is closed.
- **Readiness Filter:** Filter by computed readiness badge value (Drink Now, Hold, Approaching Peak, Past Window, No Window Set) — see F05.
- **Sort Option:** The ordering applied to the filtered result set.

**Sub-features:**
- Full-text search bar
- Multi-dimensional filter panel
- Active filter chips display with individual and bulk dismiss
- Sort order selector
- Session-persistent filter/sort state

---

### Process: Search

1. User types in the search bar on `/cellar`.
2. On each keystroke (debounced 150ms), the system filters the in-memory wine list:
   - Match if search text appears (case-insensitive substring) in any of: `name`, `producer`, `grape`, `country`, `region`.
3. The filtered result list updates in place without a server request.
4. The search string is stored in `sessionStorage` under key `swa_cellar_search`.
5. If search text is cleared, all wines (subject to active filters) are shown.
6. A result count is displayed: "Showing [N] of [Total] wines".

### Process: Apply Filters

1. User opens the filter panel (toggle button or sidebar).
2. Filter panel shows all filter dimensions with available options derived from the current unfiltered wine list (dynamic option counts).
3. User selects one or more values within one or more filter dimensions.
4. Each selection immediately (no submit button required) narrows the displayed list. Filters within the same dimension are **OR** combined; filters across dimensions are **AND** combined.
   - Example: Type=Red AND (Country=France OR Country=Italy) AND Readiness=Drink Now.
5. Each active filter appears as a chip in the "Active Filters" row above the wine list.
6. Filter state is stored in `sessionStorage` under key `swa_cellar_filters` as a JSON object.
7. Combined with the search query, both are applied simultaneously (filter AND search, each independently narrowing the set).

### Process: Dismiss Filters

1. User clicks ✕ on an individual filter chip → that specific filter value is removed.
2. User clicks "Clear All" button → all filter values and the search query are cleared; `sessionStorage` keys reset.
3. After any dismissal, the wine list immediately re-renders.

### Process: Sort

1. User selects a sort option from the sort dropdown.
2. The current filtered result set is re-sorted client-side.
3. Sort preference is stored in `sessionStorage` under key `swa_cellar_sort`.
4. Default sort on first visit (no sessionStorage key): **Name A–Z**.

### Process: URL Query Param Initialization (from Dashboard / Locations)

1. When `/cellar` is navigated to with URL query params (e.g., `?readiness=Drink+Now`, `?wine_type=Red`, `?location=Basement+Rack+A`, `?vintage_min=2010&vintage_max=2019`, `?country=France`), the page reads these params on mount.
2. The params are mapped to the filter state object and applied immediately as active filters (rendered as dismissible chips).
3. The resolved filter state is also written to `sessionStorage` (`swa_cellar_filters`) so subsequent back-navigation from a detail page restores the same filter context.
4. URL query params take precedence over any existing `sessionStorage` state when both are present.
5. Supported URL filter params: `readiness`, `wine_type`, `location`, `country`, `vintage_min`, `vintage_max`.

### Process: Session State Restoration

1. User navigates from `/cellar` to `/wines/[id]`, then uses browser Back or the app's "Back to Cellar" link.
2. System reads `swa_cellar_search`, `swa_cellar_filters`, `swa_cellar_sort` from `sessionStorage`.
3. Wine list is rendered with those values pre-applied; the user sees their exact previous context.
4. No page reload or server round-trip needed for restoration (state is client-side).

---

### Filter Dimensions

| Dimension | Filter Type | Source Values |
|-----------|-------------|---------------|
| Wine Type | Multi-select checkbox | Enum values from `wine_type` field |
| Producer | Multi-select checkbox (search within) | Distinct `producer` values in collection |
| Country / Region | Multi-select checkbox | Distinct `country` + `region` values, grouped |
| Vintage Year | Range slider or multi-select | Distinct `vintage` years in collection |
| Grape Variety | Multi-select checkbox (search within) | Distinct `grape` values in collection |
| Storage Location | Multi-select checkbox | All location names + "Location Unknown" |
| Readiness | Multi-select checkbox | Computed badge values: Drink Now, Hold, Approaching Peak, Past Window, No Window Set |
| Rating | Range filter (≥ N stars or ≥ N points) | Based on `tasting_notes.rating` most recent per wine; wines with no rating shown when "No Rating" option selected |

---

### Sort Options

| Sort Label | Sort Key | Direction |
|-----------|---------|-----------|
| Name A–Z | `name` | ASC |
| Name Z–A | `name` | DESC |
| Vintage Newest | `vintage` | DESC |
| Vintage Oldest | `vintage` | ASC |
| Rating Highest | most recent `tasting_notes.rating` (normalized to 0–100 scale) | DESC |
| Rating Lowest | most recent `tasting_notes.rating` | ASC |
| Quantity Most | `quantity` | DESC |
| Quantity Fewest | `quantity` | ASC |
| Recently Added | `created_at` | DESC |
| Recently Consumed | most recent `bottle_events.event_date` where `event_type IN ('Consumed','Gifted')` | DESC |

---

### Inputs

All filter and sort inputs are client-side state (no API calls):
- `search_text` (string): Free text typed into search bar.
- `filters` (object): `{ wine_type: string[], producer: string[], country_region: string[], vintage: [min, max], grape: string[], location: string[], readiness: string[], rating_min: number | null }`.
- `sort_by` (string): One of the sort option keys listed above.

---

### Outputs

- **Filtered wine list:** Array of wine card components matching all active search + filter + sort criteria. Rendered client-side.
- **Result count label:** "Showing [N] of [Total] wines".
- **Active filter chips:** One chip per active filter value; each chip shows dimension label and value.
- **Session keys written:** `swa_cellar_search` (string), `swa_cellar_filters` (JSON), `swa_cellar_sort` (string).

---

### Validation Rules

- Search text: No validation required; empty string treated as no filter.
- Filter values: Only values present in the collection are shown as options; stale `sessionStorage` values that no longer match any wines simply result in 0 results for that filter (no error; "0 wines match" message displayed instead).
- Sort key: If `sessionStorage` contains an unrecognized sort key, fall back to default "Name A–Z".
- Readiness filter: Readiness badge is computed at render time (current year); filtering by readiness is applied after badge computation — never stale.
- No server-side validation needed (purely client-side feature).

---

### Error States

| Scenario | Behavior |
|----------|---------|
| No wines match current filters | Display "No wines match your current filters. [Clear All Filters]" message |
| Collection is empty (0 wines) | Display empty state: "Your cellar is empty. [Add your first wine →]" |
| sessionStorage unavailable (private browse) | Silently ignore persistence; filters still work in-memory for the current page visit |
| Filter option count = 0 | That dimension's options are hidden from the filter panel |

---

### API Surface (this feature)

No additional API endpoints. Search and filter operate on the wine list already loaded by `GET /api/wines` (used by F00). See `Y1-api.md` §Wines.

---

### Schema Surface (this feature)

No dedicated tables. Reads from: `wines`, `locations`, `tasting_notes` (for rating-based sort/filter), `bottle_events` (for recently consumed sort). All joins handled client-side after data load.
---

## F04: Tasting Notes & Ratings

**Description:** Each wine can accumulate multiple dated tasting notes, providing a structured record of every time a bottle was evaluated. A note captures four sensory categories (appearance, aroma, flavor, finish) in free text, a numeric rating in the user's preferred scale, a "would buy again" disposition, an occasion label, and optional guest feedback. The rating scale — 5-star (1–5) or 100-point (1–100) — is a user-level preference stored in `user_settings` and applied consistently across the entire UI. Notes are displayed in reverse-chronological order on the wine detail page; the most recent rating appears on collection list cards. The note creation flow is reachable both directly (`/wines/[id]/notes/new`) and as an optional step after a bottle Consumed or Gifted event (F01).

**Terminology:**
- **Tasting Note:** A single dated evaluation record for a wine; stored in `tasting_notes` table.
- **Rating Scale:** User preference; `five_star` (values 1–5) or `hundred_point` (values 1–100). Stored in `user_settings.rating_scale`.
- **Normalized Rating:** Internal representation stored as a numeric value 1–100 regardless of scale. Display converts back to scale. Formula: 5-star value N → stored as `N * 20`. E.g., 4 stars → 80 points.
- **Most Recent Rating:** The `rating` value from the `tasting_notes` row with the most recent `tasted_on` date for a given wine. Shown on wine cards.
- **Would Buy Again:** A three-value disposition: `yes`, `no`, `maybe`.
- **Occasion:** A categorical label for the context in which the wine was enjoyed.
- **Guest Feedback:** Free-text field for recording what guests said about the wine.

**Sub-features:**
- Create a tasting note via `/wines/[id]/notes/new`
- Display tasting notes list on wine detail page
- Display most recent rating on collection list wine cards
- Rating scale preference setting
- Tasting note creation triggered from F01 bottle event flow

---

### Process: Create Tasting Note (Direct)

1. User navigates to `/wines/[id]/notes/new`.
2. System fetches wine record to confirm it exists and to display the wine name in the form header.
3. System reads `user_settings.rating_scale` to determine which rating UI to render (5-star widget vs. 100-point numeric input).
4. Form is rendered with all note fields. `tasted_on` defaults to today's date.
5. **Form state auto-save (draft preservation):** As the user fills in fields, each change is written to `sessionStorage` under the key `swa_note_draft_[wine_id]`. On page load, if a draft exists for this wine, the form is pre-populated with the saved values. This ensures no data loss if the user locks their phone, switches apps, or accidentally navigates away and returns.
6. User fills in desired fields (only `wine_id` and `tasted_on` are technically required; all other fields optional for flexibility).
7. User submits the form.
8. Client validates fields (see Validation).
9. `POST /api/wines/[id]/notes` called with form data.
10. Server normalizes rating to 1–100 scale and inserts into `tasting_notes`.
11. Server returns `201 Created` with the new note record.
12. Client clears the `swa_note_draft_[wine_id]` sessionStorage key.
13. Client redirects to `/wines/[id]` (scrolled to tasting notes section).

### Process: Create Tasting Note (From Bottle Event Flow)

1. After a Consumed or Gifted bottle event is logged (F01 step 12), user is prompted: "Would you like to add a tasting note for this bottle?"
2. User selects **Yes**.
3. System navigates to `/wines/[id]/notes/new` with the `tasted_on` date pre-filled to today.
4. Process continues from step 3 above (Create Direct).

### Process: View Tasting Notes on Detail Page

1. On `/wines/[id]`, the "Tasting Notes" section lists all `tasting_notes` rows for this wine.
2. Notes ordered by `tasted_on` DESC (most recent first); ties broken by `created_at` DESC.
3. Each note displays: date, rating (formatted per user's scale), would-buy-again indicator, occasion badge, appearance/aroma/flavor/finish, guest feedback.
4. If no notes exist: "No tasting notes yet. [Add a Tasting Note →]".

### Process: Rating Scale Preference

1. Rating scale preference is stored in `user_settings` table as `rating_scale` column.
2. Default value: `five_star`.
3. User can toggle scale from the `/wines/[id]/notes/new` form (a small "Switch to 100-point" / "Switch to 5-star" link), or from any wine card that displays a rating.
4. `PATCH /api/settings` called with `{ rating_scale: "five_star" | "hundred_point" }`.
5. Server updates `user_settings` row (upsert — exactly one row always exists).
6. All displays immediately reflect the new scale: stored normalized ratings are converted to the selected scale for display.

---

### Inputs

**Tasting Note Create (`POST /api/wines/[id]/notes`):**
- `wine_id*` (integer, path param): Wine this note belongs to.
- `tasted_on*` (date, YYYY-MM-DD): Date of tasting; defaults to today; must be a valid past or current date.
- `appearance` (opt) (string, max 1000): Free text — color, clarity, viscosity, etc.
- `aroma` (opt) (string, max 1000): Free text — nose description.
- `flavor` (opt) (string, max 1000): Free text — palate description.
- `finish` (opt) (string, max 1000): Free text — aftertaste, length.
- `rating` (opt) (numeric): Value in the user's current scale — integer 1–5 (five_star) or integer 1–100 (hundred_point). Null if not provided.
- `would_buy_again` (opt) (enum): One of `yes | no | maybe`. Null if not provided.
- `occasion` (opt) (enum): One of `dinner | gift | casual | celebration | restaurant | tasting | other`. Null if not provided.
- `guest_feedback` (opt) (string, max 2000): Free text.

**Rating Scale Preference (`PATCH /api/settings`):**
- `rating_scale*` (enum): `five_star | hundred_point`.

---

### Outputs

- **Create tasting note:** `201 Created` + JSON note object with all fields + `id`, `created_at`. `rating` field returned in stored normalized form (1–100).
- **Tasting notes list:** Array of tasting note objects for a wine, sorted by `tasted_on` DESC.
- **Wine card — most recent rating:** Displayed as stars (N/5) or numeric (N/100) based on current user setting; hidden if no notes exist.
- **Rating scale preference update:** `200 OK` + `{ rating_scale: "..." }`.

---

### Validation Rules

- `tasted_on`: Required; must be a valid calendar date; must not be in the future (> today's date). Error: `TASTED_ON_FUTURE`.
- `rating` (five_star scale): If provided, must be an integer 1–5. Non-integers or out-of-range values rejected: `RATING_OUT_OF_RANGE`.
- `rating` (hundred_point scale): If provided, must be an integer 1–100. Same error code.
- `would_buy_again`: If provided, must be one of `yes`, `no`, `maybe`. Error: `INVALID_WOULD_BUY_AGAIN`.
- `occasion`: If provided, must be one of the allowed enum values. Error: `INVALID_OCCASION`.
- `appearance`, `aroma`, `flavor`, `finish`: Optional; if provided, max 1000 chars each. Client-side character counter shown.
- `guest_feedback`: Optional; if provided, max 2000 chars.
- `wine_id`: Must reference an existing wine. Error: `WINE_NOT_FOUND`.
- `rating_scale`: Must be `five_star` or `hundred_point`. Error: `INVALID_RATING_SCALE`.

---

### Rating Scale Conversion

| User Input | Scale | Stored Value (normalized 1–100) |
|------------|-------|----------------------------------|
| 1 star | five_star | 20 |
| 2 stars | five_star | 40 |
| 3 stars | five_star | 60 |
| 4 stars | five_star | 80 |
| 5 stars | five_star | 100 |
| N (1–100) | hundred_point | N |

Display conversion: stored value ÷ 20 = star rating (rounded to nearest 0.5 for display only).

---

### Error States

| Scenario | HTTP Status | Error Code | User-Facing Message |
|----------|-------------|------------|---------------------|
| `tasted_on` is in the future | 422 | `TASTED_ON_FUTURE` | "Tasting date cannot be in the future." |
| Rating out of range (5-star) | 422 | `RATING_OUT_OF_RANGE` | "Rating must be between 1 and 5." |
| Rating out of range (100-pt) | 422 | `RATING_OUT_OF_RANGE` | "Rating must be between 1 and 100." |
| Invalid `would_buy_again` | 422 | `INVALID_WOULD_BUY_AGAIN` | "Invalid 'Would Buy Again' value." |
| Invalid `occasion` | 422 | `INVALID_OCCASION` | "Invalid occasion value." |
| Wine not found | 404 | `WINE_NOT_FOUND` | "Wine not found." |
| Invalid rating scale setting | 422 | `INVALID_RATING_SCALE` | "Rating scale must be 'five_star' or 'hundred_point'." |
| DB write error | 500 | `DB_WRITE_ERROR` | "Could not save tasting note. Please try again." |

---

### API Surface (this feature)

See `Y1-api.md` §TastingNotes and §Settings for full schemas.

| Method | Path | Action |
|--------|------|--------|
| `POST` | `/api/wines/[id]/notes` | Create tasting note |
| `GET` | `/api/wines/[id]/notes` | List tasting notes for a wine |
| `GET` | `/api/settings` | Get user settings (including rating scale) |
| `PATCH` | `/api/settings` | Update rating scale preference |

---

### Schema Surface (this feature)

Uses tables: `tasting_notes`, `user_settings`. Full DDL in `Y0-schema.md` §tasting_notes and §user_settings.

Key `tasting_notes` columns: `id`, `wine_id`, `tasted_on`, `appearance`, `aroma`, `flavor`, `finish`, `rating` (integer 1–100 normalized), `would_buy_again`, `occasion`, `guest_feedback`, `created_at`.

Key `user_settings` columns: `id` (always 1 for single-user), `rating_scale`, `updated_at`.
---

## F05: Drinking Window

**Description:** Each wine record optionally carries a drinking window defined as a start year and an end year. The system derives a readiness badge automatically by comparing these years to the current calendar year at render/request time. Badges are color-coded for instant visual scanning and are displayed on wine cards, the wine detail page, and the Dashboard Drink Now shelf. Readiness is also a filterable dimension in F03. Badges are never cached — they are recomputed on every page load to ensure accuracy as time passes.

**Terminology:**
- **Drinking Window:** The year range `[drinking_window_start, drinking_window_end]` during which a wine is considered to be at its best. Both values are optional integers on the wine record.
- **Readiness Badge:** Auto-derived categorical label. Exactly one badge applies to each wine at any given time.
- **Current Year:** `new Date().getFullYear()` evaluated server-side at request time (or client-side at render time for CSR paths). Never stored or cached.
- **Approaching Peak:** The 2-year buffer before the drinking window opens (current year in `[start - 2, start - 1]`).

**Sub-features:**
- Drinking window fields on wine create/edit form (F00 form integration)
- Readiness badge computation logic
- Badge display on wine cards, wine detail page, dashboard shelf
- Readiness as filterable dimension (F03 integration)

---

### Readiness Badge Logic

Evaluated for each wine at render time using the current year (`CY = new Date().getFullYear()`):

| Condition | Badge | Color |
|-----------|-------|-------|
| `drinking_window_start` is NULL AND `drinking_window_end` is NULL | **No Window Set** | Muted grey (`#9CA3AF`) |
| `CY < (drinking_window_start - 2)` | **Hold** | Blue (`#3B82F6`) |
| `CY >= (drinking_window_start - 2) AND CY < drinking_window_start` | **Approaching Peak** | Amber (`#F59E0B`) |
| `CY >= drinking_window_start AND CY <= drinking_window_end` | **Drink Now** | Green (`#10B981`) |
| `CY > drinking_window_end` | **Past Window** | Grey (`#6B7280`) |

**Edge cases for badge logic:**
- If only `drinking_window_start` is set (end is NULL): badge is `Drink Now` if `CY >= start`; `Hold` if `CY < (start - 2)`; `Approaching Peak` if `CY` in `[start-2, start-1]`. No `Past Window` state possible (no end defined).
- If only `drinking_window_end` is set (start is NULL): badge is `Drink Now` if `CY <= end`; `Past Window` if `CY > end`. No Hold or Approaching Peak possible (no start defined).
- `drinking_window_start = drinking_window_end` (single-year window): valid; Drink Now only in that exact year.

---

### Process: Display Readiness Badge

1. Wine data is fetched (server component or API call).
2. For each wine, readiness badge is computed from `drinking_window_start`, `drinking_window_end`, and `CY` using the logic table above.
3. Badge is rendered as a color-coded pill/tag in:
   - Wine card on `/cellar`
   - Wine detail page header on `/wines/[id]`
   - Dashboard "Drink Now" shelf cards on `/`
4. Badge value is also made available in the client-side in-memory wine list for filter evaluation (F03).

### Process: Edit Drinking Window

1. On `/wines/new` or `/wines/[id]/edit`, the form has two numeric inputs: "Drink From (Year)" and "Drink Until (Year)".
2. Both are optional.
3. User enters years; client validates on blur (see Validation).
4. **Badge preview:** After each blur event on either field (or on change if both fields have values), the system computes the readiness badge using the current year and the entered values, then renders a live badge preview (color-coded pill) immediately below the two year inputs. The preview updates in real time as the user types. If both fields are empty, no preview is shown. If only one field has a value, the partial-window badge logic applies (see Readiness Badge Logic above).
5. Values submitted as part of the wine create/update API call (see F00 API surface).
6. No separate API endpoint for drinking window — it is part of the wine record.

### Process: "Drink Now" Dashboard Shelf (Integration with F06)

1. On page load of `/`, system queries all wines where computed badge = `Drink Now` (i.e., `drinking_window_start <= CY AND drinking_window_end >= CY`, or partial-window edge cases above).
2. Query is server-side SQL — the full badge computation logic is implemented as a SQL `WHERE` clause or CASE expression (not post-load filtering).
3. Results displayed in the Dashboard Drink Now shelf (horizontal scroll card list).
4. See F06 for full dashboard spec.

### Process: Readiness Filter Integration (F03)

1. Client-side wine list includes a `readiness_badge` computed field for each wine (computed at list-load time using current year).
2. F03 filter panel exposes readiness as a multi-select filter.
3. Filtering by readiness applies the badge value equality check against the computed field.
4. No server round-trip for readiness filtering — purely client-side.

---

### Inputs

Drinking window is set/updated via wine create/edit form (F00). No standalone inputs for F05.

- `drinking_window_start` (opt) (integer): Year ≥ 1900; stored on `wines` row.
- `drinking_window_end` (opt) (integer): Year ≥ `drinking_window_start` if both set; stored on `wines` row.

---

### Outputs

- **Readiness badge (per wine):** One of five string values: `Drink Now`, `Hold`, `Approaching Peak`, `Past Window`, `No Window Set`.
- **Badge color class:** CSS class or inline style applying the defined badge color.
- **Dashboard Drink Now wines:** Array of wine records where badge = `Drink Now` at query time.
- **Filter-ready badge field:** `readiness_badge` included in the client-side wine object for F03 filter use.

---

### Validation Rules

(Applied during wine create/edit — see F00 Validation for full context)

- `drinking_window_start`: Optional; if provided, must be integer ≥ 1900; must be ≤ 2100 (upper bound for sanity).
- `drinking_window_end`: Optional; if provided, must be integer ≥ 1900 and ≤ 2100; if both start and end are set, end must be ≥ start.
- Both null is valid ("No Window Set" state).
- Either one set alone is valid (partial window).
- Non-integer values rejected: `VALIDATION_ERROR`.
- `end < start`: `WINDOW_INVALID_RANGE`.

---

### Error States

| Scenario | HTTP Status | Error Code | User-Facing Message |
|----------|-------------|------------|---------------------|
| `drinking_window_start` < 1900 | 422 | `VALIDATION_ERROR` | "Drinking window start year must be 1900 or later." |
| `drinking_window_end` < `drinking_window_start` | 422 | `WINDOW_INVALID_RANGE` | "Drinking window end year must be ≥ start year." |
| Non-integer year value | 422 | `VALIDATION_ERROR` | "[Field] must be a valid year." |

Note: Stale badge states are not an error — badges are recomputed each load, so a wine that was "Hold" last year may now be "Drink Now" automatically with no user action required.

---

### API Surface (this feature)

No standalone API endpoints for F05. Drinking window data flows through the wine CRUD API. See `Y1-api.md` §Wines.

The Dashboard Drink Now query uses a server-side SQL filter applied in `GET /api/dashboard`. See `Y1-api.md` §Dashboard.

---

### Schema Surface (this feature)

Uses columns on `wines` table: `drinking_window_start` (integer, nullable), `drinking_window_end` (integer, nullable). Full DDL in `Y0-schema.md` §wines.

No separate table for drinking windows — they are attributes of the wine record itself.
---

## F06: Collection Dashboard

**Description:** The default landing page (`/`) provides an at-a-glance summary of the entire collection, surfacing actionable information — how many bottles are ready to drink — alongside collection-level analytics. Every stat tile and list item links to `/cellar` pre-filtered to the relevant subset, making the dashboard a navigation hub. All data is fetched server-side (Next.js App Router server component) on each page load — no stale cache. The dashboard is designed to work correctly with a collection of 0 wines (empty state) through 500+ wines.

**Terminology:**
- **Stat Tile:** A summary card showing a single metric (e.g., "Total Bottles: 47").
- **Drink Now Shelf:** A horizontally scrollable row of wine cards where readiness badge = `Drink Now`.
- **Breakdown:** A categorized summary showing the distribution of wines by a dimension (type, country/region, decade).
- **Decade:** A 10-year vintage grouping; e.g., "2010s" = vintages 2010–2019.
- **Recently Added:** The 5 most recently created wine records (`wines.created_at DESC LIMIT 5`).
- **Recently Consumed:** The 5 most recent bottle events with `event_type IN ('Consumed', 'Gifted')` (`bottle_events.event_date DESC LIMIT 5`).
- **Highest Rated:** The top 5 wines ranked by their most recent `tasting_notes.rating` value (normalized 1–100).

**Sub-features:**
- Summary stat tiles (4 metrics)
- "Drink Now" shelf (horizontal scroll)
- Wine type breakdown
- Country/region breakdown
- Decade (vintage) breakdown
- Recently added list
- Recently consumed list
- Highest rated list
- All elements link to pre-filtered `/cellar`

---

### Process: Load Dashboard

1. User navigates to `/` (default landing page).
2. Next.js App Router server component executes `GET /api/dashboard` (or queries DB directly as a server action).
3. Server computes all dashboard data in a single or batched query set (see Data Queries below).
4. Page renders with all sections populated.
5. If collection is empty (0 wines), each section displays an appropriate empty state (see Empty States).
6. No client-side data fetching on initial load — all content is server-rendered for performance and SEO.

### Process: Navigate to Pre-Filtered Cellar

1. User clicks any stat tile, shelf card, breakdown segment, or list item on the dashboard.
2. System navigates to `/cellar` with the appropriate filter pre-applied **via URL query parameters**. The `/cellar` page reads these query params on mount, applies them as active filters, and writes them into `sessionStorage` (so back-navigation from a detail page restores the filter as normal).
3. Filter parameter mapping:

| Dashboard Element | URL navigated to |
|-------------------|-----------------------------|
| "Total Bottles" tile | `/cellar` (no params) |
| "Unique Wines" tile | `/cellar` (no params) |
| "Drink Now" tile count | `/cellar?readiness=Drink+Now` |
| "Approaching Peak" tile count | `/cellar?readiness=Approaching+Peak` |
| Drink Now shelf card | `/cellar?readiness=Drink+Now` |
| Wine type breakdown segment | `/cellar?wine_type=[encoded_type]` |
| Country/region breakdown segment | `/cellar?country=[encoded_country]` |
| Decade breakdown segment | `/cellar?vintage_min=[decade_start]&vintage_max=[decade_end]` |
| Recently Added item | `/wines/[id]` (wine detail) |
| Recently Consumed item | `/wines/[id]` (wine detail) |
| Highest Rated item | `/wines/[id]` (wine detail) |

---

### Data Queries

All computed server-side. Uses current year (`CY = EXTRACT(YEAR FROM NOW())`) for readiness.

**Stat Tiles:**
```sql
-- Total bottles
SELECT COALESCE(SUM(quantity), 0) AS total_bottles FROM wines;

-- Unique wine count
SELECT COUNT(*) AS unique_wines FROM wines;

-- Drink Now count (wines, not bottles)
SELECT COUNT(*) FROM wines
WHERE drinking_window_start <= CY AND (drinking_window_end IS NULL OR drinking_window_end >= CY)
   OR (drinking_window_end IS NOT NULL AND drinking_window_start IS NULL AND drinking_window_end >= CY);

-- Approaching Peak count
SELECT COUNT(*) FROM wines
WHERE drinking_window_start IS NOT NULL
  AND CY >= (drinking_window_start - 2)
  AND CY < drinking_window_start;
```

**Drink Now Shelf:**
```sql
SELECT w.*, l.name AS location_name
FROM wines w LEFT JOIN locations l ON w.location_id = l.id
WHERE (w.drinking_window_start <= CY AND (w.drinking_window_end IS NULL OR w.drinking_window_end >= CY))
   OR (w.drinking_window_end IS NOT NULL AND w.drinking_window_start IS NULL AND w.drinking_window_end >= CY)
ORDER BY w.name ASC;
```

**Type Breakdown:**
```sql
SELECT wine_type, COUNT(*) AS wine_count, COALESCE(SUM(quantity), 0) AS bottle_count
FROM wines GROUP BY wine_type ORDER BY bottle_count DESC;
```

**Country/Region Breakdown:**
```sql
SELECT COALESCE(country, 'Unknown') AS country, COUNT(*) AS wine_count
FROM wines GROUP BY country ORDER BY wine_count DESC LIMIT 10;
```

**Decade Breakdown:**
```sql
SELECT (FLOOR(vintage / 10) * 10)::int AS decade, COUNT(*) AS wine_count
FROM wines WHERE vintage IS NOT NULL
GROUP BY decade ORDER BY decade DESC;
```

**Recently Added:**
```sql
SELECT w.id, w.name, w.producer, w.vintage, w.wine_type, w.created_at
FROM wines w ORDER BY w.created_at DESC LIMIT 5;
```

**Recently Consumed:**
```sql
SELECT be.id, be.event_type, be.event_date, w.id AS wine_id, w.name, w.producer, w.vintage
FROM bottle_events be JOIN wines w ON be.wine_id = w.id
WHERE be.event_type IN ('Consumed', 'Gifted')
ORDER BY be.event_date DESC, be.created_at DESC LIMIT 5;
```

**Highest Rated:**
```sql
SELECT DISTINCT ON (tn.wine_id)
  tn.wine_id, tn.rating, tn.tasted_on, w.name, w.producer, w.vintage
FROM tasting_notes tn JOIN wines w ON tn.wine_id = w.id
ORDER BY tn.wine_id, tn.tasted_on DESC, tn.created_at DESC
-- Then outer query orders by rating
```
Wrapped in outer query: `SELECT * FROM (...) t ORDER BY rating DESC LIMIT 5;`

---

### Inputs

- None from user on initial load (all data is fetched server-side on navigation to `/`).
- Dashboard is read-only; all interactions navigate to `/cellar` or `/wines/[id]`.

---

### Outputs

- **Stat tiles (4):** Total Bottles (integer), Unique Wines (integer), Drink Now count (integer), Approaching Peak count (integer).
- **Drink Now shelf:** Array of wine card components with readiness badge `Drink Now`, horizontally scrollable. Maximum display: all matching wines (no upper limit; scroll handles overflow).
- **Type breakdown:** Array of `{ wine_type, wine_count, bottle_count }` items. Rendered as a bar chart or segmented list.
- **Country/region breakdown:** Top 10 countries by wine count. Rendered as a list or chart.
- **Decade breakdown:** Array of `{ decade, wine_count }` items ordered by decade DESC. Rendered as a bar or list.
- **Recently added:** 5 wine records with name, producer, vintage, date added. Each links to `/wines/[id]`.
- **Recently consumed:** 5 bottle event records with wine name, event type, date. Each links to `/wines/[id]`.
- **Highest rated:** 5 wine records with name, producer, most recent rating (formatted per user scale). Each links to `/wines/[id]`.

---

### Empty States

| Section | Empty State Display |
|---------|-------------------|
| All stat tiles = 0 | Tiles show `0`; no error |
| Drink Now shelf — no wines match | "No wines are ready to drink right now." |
| Type breakdown — no wines | Section hidden or "Add wines to see your collection breakdown." |
| Country/region — no wines | Section hidden |
| Decade breakdown — no wines with vintage | Section hidden |
| Recently Added — 0 wines | "No wines added yet. [Add your first wine →]" |
| Recently Consumed — 0 events | "No consumption events recorded yet." |
| Highest Rated — 0 rated wines | "Add tasting notes and ratings to see your top wines here." |

---

### Validation Rules

- Dashboard is read-only; no user inputs to validate.
- Server queries must handle edge cases: wines with NULL location_id (Location Unknown), wines with NULL vintage, wines with NULL drinking window.
- Readiness computation in SQL must handle partial windows (start only, end only) consistently with the F05 badge logic.

---

### Error States

| Scenario | HTTP Status | Error Code | User-Facing Message |
|----------|-------------|------------|---------------------|
| DB unavailable on load | 500 | `DB_READ_ERROR` | "Could not load dashboard. Please try again." |
| Partial data load failure | 500 | `DB_READ_ERROR` | Display available sections; show error notice on failed section |

---

### API Surface (this feature)

See `Y1-api.md` §Dashboard for full schema.

| Method | Path | Action |
|--------|------|--------|
| `GET` | `/api/dashboard` | Return all dashboard aggregate data in one response |

The dashboard page may call this endpoint from a server component, or execute DB queries directly in the server component — either approach is valid.

---

### Schema Surface (this feature)

Reads from: `wines`, `locations`, `bottle_events`, `tasting_notes`, `user_settings`. No writes. Full DDL in `Y0-schema.md`.
---

## Y0: Database Schema (PostgreSQL 16)

Full DDL for all SimpleWineApp entities. All migrations live in the `db/` folder and are applied via `npm run migrate` on container start. All DDL uses `IF NOT EXISTS` for idempotency.

**Connection:** `DATABASE_URL=postgresql://postgres:postgres@db:5432/simplewineapp`
(hostname `db` = docker-compose service name; never `localhost`)

---

### §locations

```sql
CREATE TABLE IF NOT EXISTS locations (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT  locations_name_unique UNIQUE (LOWER(name))
);

-- Trigger: auto-update updated_at on any UPDATE
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER locations_updated_at
  BEFORE UPDATE ON locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Notes:**
- `UNIQUE (LOWER(name))` enforces case-insensitive uniqueness.
- `updated_at` trigger is defined once and reused across tables.

---

### §wines

```sql
CREATE TABLE IF NOT EXISTS wines (
  id                      SERIAL PRIMARY KEY,
  name                    VARCHAR(255) NOT NULL,
  producer                VARCHAR(255) NOT NULL,
  vintage                 INTEGER NOT NULL
                            CHECK (vintage >= 1900 AND vintage <= 2100),
  wine_type               VARCHAR(20) NOT NULL
                            CHECK (wine_type IN (
                              'Red','White','Rosé','Sparkling',
                              'Dessert','Fortified','Orange','Other'
                            )),
  grape                   VARCHAR(255),
  country                 VARCHAR(100),
  region                  VARCHAR(100),
  bottle_size             VARCHAR(50),
  quantity                INTEGER NOT NULL DEFAULT 1
                            CHECK (quantity >= 0 AND quantity <= 9999),
  location_id             INTEGER REFERENCES locations(id) ON DELETE SET NULL,
  purchase_date           DATE,
  purchase_source         VARCHAR(255),
  purchase_price          NUMERIC(8,2) CHECK (purchase_price >= 0),
  drinking_window_start   INTEGER CHECK (drinking_window_start >= 1900),
  drinking_window_end     INTEGER CHECK (drinking_window_end >= 1900),
  notes                   TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT wines_window_order
    CHECK (
      drinking_window_end IS NULL OR
      drinking_window_start IS NULL OR
      drinking_window_end >= drinking_window_start
    )
);

CREATE INDEX IF NOT EXISTS idx_wines_location_id ON wines(location_id);
CREATE INDEX IF NOT EXISTS idx_wines_wine_type    ON wines(wine_type);
CREATE INDEX IF NOT EXISTS idx_wines_vintage      ON wines(vintage);
CREATE INDEX IF NOT EXISTS idx_wines_created_at   ON wines(created_at DESC);

CREATE TRIGGER wines_updated_at
  BEFORE UPDATE ON wines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Notes:**
- `location_id` uses `ON DELETE SET NULL` — deleting a location sets wines' location_id to NULL (not a cascade delete).
- `quantity` minimum is 0 (Cellar Empty state); it cannot go negative.
- The `wine_type` CHECK constraint is the source of truth for allowed enum values.
- `vintage` CHECK allows up to 2100 for flexibility; application layer validates against `current_year + 1`.

---

### §bottle_events

```sql
CREATE TABLE IF NOT EXISTS bottle_events (
  id          SERIAL PRIMARY KEY,
  wine_id     INTEGER NOT NULL REFERENCES wines(id) ON DELETE CASCADE,
  event_type  VARCHAR(20) NOT NULL
                CHECK (event_type IN ('Consumed','Gifted','Opened')),
  event_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  note        VARCHAR(500),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bottle_events_wine_id    ON bottle_events(wine_id);
CREATE INDEX IF NOT EXISTS idx_bottle_events_event_date ON bottle_events(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_bottle_events_event_type ON bottle_events(event_type);
```

**Notes:**
- `ON DELETE CASCADE`: deleting a wine record cascades and deletes all its bottle events.
- No `updated_at` — bottle events are immutable once created (audit log semantics).
- `note` VARCHAR(500) matches the application-layer 500-char limit.

---

### §tasting_notes

```sql
CREATE TABLE IF NOT EXISTS tasting_notes (
  id              SERIAL PRIMARY KEY,
  wine_id         INTEGER NOT NULL REFERENCES wines(id) ON DELETE CASCADE,
  tasted_on       DATE NOT NULL DEFAULT CURRENT_DATE,
  appearance      VARCHAR(1000),
  aroma           VARCHAR(1000),
  flavor          VARCHAR(1000),
  finish          VARCHAR(1000),
  rating          INTEGER CHECK (rating >= 1 AND rating <= 100),
  would_buy_again VARCHAR(5)
                    CHECK (would_buy_again IN ('yes','no','maybe')),
  occasion        VARCHAR(20)
                    CHECK (occasion IN (
                      'dinner','gift','casual','celebration',
                      'restaurant','tasting','other'
                    )),
  guest_feedback  VARCHAR(2000),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasting_notes_wine_id   ON tasting_notes(wine_id);
CREATE INDEX IF NOT EXISTS idx_tasting_notes_tasted_on ON tasting_notes(tasted_on DESC);
CREATE INDEX IF NOT EXISTS idx_tasting_notes_rating    ON tasting_notes(rating DESC);
```

**Notes:**
- `rating` is stored normalized to 1–100 scale regardless of user's display preference.
- `ON DELETE CASCADE`: deleting a wine record cascades and deletes all its tasting notes.
- No `updated_at` — tasting notes are currently append-only (no edit flow in MVP).
- The `tasted_on DESC` index supports the "most recent rating" query pattern efficiently.

---

### §user_settings

```sql
CREATE TABLE IF NOT EXISTS user_settings (
  id            INTEGER PRIMARY KEY DEFAULT 1,
  rating_scale  VARCHAR(15) NOT NULL DEFAULT 'five_star'
                  CHECK (rating_scale IN ('five_star','hundred_point')),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_settings_single_row CHECK (id = 1)
);

-- Seed the single row on first migration
INSERT INTO user_settings (id, rating_scale)
VALUES (1, 'five_star')
ON CONFLICT (id) DO NOTHING;

CREATE TRIGGER user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Notes:**
- Single-user app; exactly one row with `id = 1` always exists (seeded on migration).
- `CHECK (id = 1)` enforces the single-row invariant at DB level.
- `rating_scale` affects all display; stored values in `tasting_notes.rating` are always 1–100.

---

### Entity Relationship Summary

```
locations
  └── wines (location_id → locations.id, ON DELETE SET NULL)
       ├── bottle_events (wine_id → wines.id, ON DELETE CASCADE)
       └── tasting_notes (wine_id → wines.id, ON DELETE CASCADE)

user_settings  (standalone; single row; id=1)
```

---

### Migration File Ordering (db/ folder)

| File | Content |
|------|---------|
| `db/001_create_locations.sql` | locations table + trigger |
| `db/002_create_wines.sql` | wines table + indexes + trigger |
| `db/003_create_bottle_events.sql` | bottle_events table + indexes |
| `db/004_create_tasting_notes.sql` | tasting_notes table + indexes |
| `db/005_create_user_settings.sql` | user_settings table + seed row |

All files are applied in numeric order by `npm run migrate`. The migration script must apply them idempotently (each file wrapped in a transaction or using `IF NOT EXISTS`).
---

## Y1: REST API Endpoints

All API routes are Next.js 14 App Router Route Handlers located in `app/api/`. All requests and responses use `Content-Type: application/json`. All IDs are integers. Dates are ISO 8601 strings (`YYYY-MM-DD`). Timestamps are ISO 8601 with timezone (`YYYY-MM-DDTHH:mm:ssZ`).

**Base URL:** `http://localhost:3000/api` (development / Docker)

**Authentication:** None (single-user MVP).

**Common error response shape:**
```json
{ "error": "ERROR_CODE", "message": "Human-readable message", "fields": { "field_name": "error detail" } }
```
`fields` is only present on `422` validation errors.

---

### §Wines

#### `GET /api/wines`

Returns all wine records for the collection list and client-side search/filter.

**Query params (all optional):**
- None (client-side filtering; full list always returned)

**Response `200 OK`:**
```json
{
  "wines": [
    {
      "id": 1,
      "name": "Château Margaux",
      "producer": "Château Margaux",
      "vintage": 2015,
      "wine_type": "Red",
      "grape": "Cabernet Sauvignon Blend",
      "country": "France",
      "region": "Bordeaux",
      "bottle_size": "750ml",
      "quantity": 3,
      "location_id": 2,
      "location_name": "Basement Rack A",
      "purchase_date": "2022-06-15",
      "purchase_source": "Wine.com",
      "purchase_price": "189.99",
      "drinking_window_start": 2025,
      "drinking_window_end": 2045,
      "notes": "Birthday gift.",
      "most_recent_rating": 88,
      "created_at": "2024-01-10T14:22:00Z",
      "updated_at": "2024-01-10T14:22:00Z"
    }
  ]
}
```

**Notes:**
- `location_name` is JOIN-resolved from `locations.name`; null if location was deleted ("Location Unknown").
- `most_recent_rating` is the `tasting_notes.rating` value (1–100 normalized) from the most recent note; null if no notes exist.

---

#### `POST /api/wines`

Create a new wine record.

**Request body:**
```json
{
  "name": "Opus One",
  "producer": "Opus One Winery",
  "vintage": 2019,
  "wine_type": "Red",
  "grape": "Cabernet Sauvignon",
  "country": "USA",
  "region": "Napa Valley",
  "bottle_size": "750ml",
  "quantity": 2,
  "location_id": 1,
  "purchase_date": "2023-03-01",
  "purchase_source": "Winery Direct",
  "purchase_price": "350.00",
  "drinking_window_start": 2026,
  "drinking_window_end": 2040,
  "notes": "Special occasion."
}
```

**Response `201 Created`:** Full wine object (same shape as GET item above, `most_recent_rating: null`).

**Response `422`:** `{ "error": "VALIDATION_ERROR", "message": "...", "fields": { "vintage": "Must be between 1900 and 2027." } }`

---

#### `GET /api/wines/[id]`

Get a single wine record with tasting notes and bottle events.

**Response `200 OK`:**
```json
{
  "wine": { /* full wine object */ },
  "tasting_notes": [ /* array, tasted_on DESC */ ],
  "bottle_events": [ /* array, event_date DESC */ ]
}
```

**Response `404`:** `{ "error": "WINE_NOT_FOUND", "message": "Wine not found." }`

---

#### `PUT /api/wines/[id]`

Replace all fields of an existing wine record.

**Request body:** Same as `POST /api/wines` (all fields; required fields must be present).

**Response `200 OK`:** Updated wine object.

**Response `404`:** `WINE_NOT_FOUND`.

**Response `422`:** Validation errors.

---

#### `DELETE /api/wines/[id]`

Delete a wine record and all associated tasting notes and bottle events (cascade).

**Response `204 No Content`:** Empty body.

**Response `404`:** `WINE_NOT_FOUND`.

---

### §Quantity

#### `PATCH /api/wines/[id]/quantity`

Increment or decrement bottle quantity. On decrement, creates a bottle event.

**Request body (increment):**
```json
{ "delta": 1 }
```

**Request body (decrement):**
```json
{
  "delta": -1,
  "event_type": "Consumed",
  "note": "Paired with lamb chops — outstanding."
}
```

**Response `200 OK`:**
```json
{ "quantity": 2, "event_id": 42 }
```
`event_id` is null on increment; integer on decrement.

**Response `409`:** `QUANTITY_ALREADY_ZERO` or `QUANTITY_AT_MAX`.

**Response `422`:** `MISSING_EVENT_TYPE` or `INVALID_EVENT_TYPE`.

**Response `404`:** `WINE_NOT_FOUND`.

---

#### `GET /api/wines/[id]/events`

Get bottle event log for a wine, reverse-chronological.

**Response `200 OK`:**
```json
{
  "events": [
    {
      "id": 42,
      "wine_id": 7,
      "event_type": "Consumed",
      "event_date": "2024-12-25",
      "note": "Christmas dinner.",
      "created_at": "2024-12-25T21:00:00Z"
    }
  ]
}
```

---

### §TastingNotes

#### `POST /api/wines/[id]/notes`

Create a tasting note for a wine.

**Request body:**
```json
{
  "tasted_on": "2024-12-25",
  "appearance": "Deep ruby, clear",
  "aroma": "Black cherry, cedar, tobacco",
  "flavor": "Full bodied, velvety tannins",
  "finish": "Long, complex, 45+ seconds",
  "rating": 4,
  "would_buy_again": "yes",
  "occasion": "dinner",
  "guest_feedback": "Everyone loved it."
}
```

**Notes:**
- `rating` is submitted in the user's current scale (1–5 or 1–100). Server reads `user_settings.rating_scale` to normalize to 1–100 before storing.

**Response `201 Created`:**
```json
{
  "id": 15,
  "wine_id": 7,
  "tasted_on": "2024-12-25",
  "appearance": "Deep ruby, clear",
  "aroma": "Black cherry, cedar, tobacco",
  "flavor": "Full bodied, velvety tannins",
  "finish": "Long, complex, 45+ seconds",
  "rating": 80,
  "would_buy_again": "yes",
  "occasion": "dinner",
  "guest_feedback": "Everyone loved it.",
  "created_at": "2024-12-25T21:30:00Z"
}
```
`rating` in response is always the normalized 1–100 value.

**Response `422`:** Validation errors (tasted_on future, rating out of range, etc.).

**Response `404`:** `WINE_NOT_FOUND`.

---

#### `GET /api/wines/[id]/notes`

Get all tasting notes for a wine, ordered by `tasted_on DESC`.

**Response `200 OK`:** `{ "notes": [ /* array of note objects */ ] }`

---

### §Settings

#### `GET /api/settings`

Get user settings.

**Response `200 OK`:**
```json
{ "rating_scale": "five_star", "updated_at": "2024-01-01T00:00:00Z" }
```

---

#### `PATCH /api/settings`

Update user settings.

**Request body:** `{ "rating_scale": "hundred_point" }`

**Response `200 OK`:** `{ "rating_scale": "hundred_point", "updated_at": "2024-06-05T12:00:00Z" }`

**Response `422`:** `{ "error": "INVALID_RATING_SCALE", "message": "rating_scale must be 'five_star' or 'hundred_point'." }`

---

### §Locations

#### `GET /api/locations`

List all locations with wine counts.

**Response `200 OK`:**
```json
{
  "locations": [
    { "id": 1, "name": "Basement Rack A", "wine_count": 12, "created_at": "...", "updated_at": "..." },
    { "id": 2, "name": "Temperature Locker", "wine_count": 5, "created_at": "...", "updated_at": "..." }
  ]
}
```
Sorted alphabetically by name (server-side `ORDER BY LOWER(name)`).

---

#### `POST /api/locations`

Create a new location.

**Request body:** `{ "name": "Wine Fridge" }`

**Response `201 Created`:** `{ "id": 3, "name": "Wine Fridge", "wine_count": 0, "created_at": "...", "updated_at": "..." }`

**Response `409`:** `LOCATION_NAME_CONFLICT`.

**Response `422`:** `VALIDATION_ERROR` (empty name or too long).

---

#### `PUT /api/locations/[id]`

Rename a location.

**Request body:** `{ "name": "New Name" }`

**Response `200 OK`:** `{ "id": 1, "name": "New Name", "updated_at": "..." }`

**Response `404`:** `LOCATION_NOT_FOUND`.

**Response `409`:** `LOCATION_NAME_CONFLICT`.

---

#### `DELETE /api/locations/[id]`

Delete a location. Sets `location_id = NULL` on all assigned wines.

**Response `204 No Content`:** Empty body.

**Response `404`:** `LOCATION_NOT_FOUND`.

---

### §Dashboard

#### `GET /api/dashboard`

Returns all aggregate data needed to render the dashboard in one request.

**Response `200 OK`:**
```json
{
  "stats": {
    "total_bottles": 47,
    "unique_wines": 23,
    "drink_now_count": 8,
    "approaching_peak_count": 5
  },
  "drink_now_wines": [ /* array of wine objects with location_name */ ],
  "type_breakdown": [
    { "wine_type": "Red", "wine_count": 14, "bottle_count": 28 },
    { "wine_type": "White", "wine_count": 6, "bottle_count": 12 }
  ],
  "country_breakdown": [
    { "country": "France", "wine_count": 10 },
    { "country": "USA", "wine_count": 7 }
  ],
  "decade_breakdown": [
    { "decade": 2010, "wine_count": 11 },
    { "decade": 2000, "wine_count": 8 }
  ],
  "recently_added": [ /* array of 5 wine objects, created_at DESC */ ],
  "recently_consumed": [
    {
      "event_id": 42,
      "event_type": "Consumed",
      "event_date": "2024-12-25",
      "wine_id": 7,
      "wine_name": "Château Margaux",
      "producer": "Château Margaux",
      "vintage": 2015
    }
  ],
  "highest_rated": [
    {
      "wine_id": 7,
      "wine_name": "Opus One",
      "producer": "Opus One Winery",
      "vintage": 2019,
      "rating": 96,
      "tasted_on": "2024-12-25"
    }
  ]
}
```

**Response `500`:** `DB_READ_ERROR` if database is unavailable.

---

### Route Handler File Locations (Next.js 14 App Router)

| Route | File Path |
|-------|-----------|
| `GET/POST /api/wines` | `app/api/wines/route.ts` |
| `GET/PUT/DELETE /api/wines/[id]` | `app/api/wines/[id]/route.ts` |
| `PATCH /api/wines/[id]/quantity` | `app/api/wines/[id]/quantity/route.ts` |
| `GET /api/wines/[id]/events` | `app/api/wines/[id]/events/route.ts` |
| `GET/POST /api/wines/[id]/notes` | `app/api/wines/[id]/notes/route.ts` |
| `GET/PATCH /api/settings` | `app/api/settings/route.ts` |
| `GET/POST /api/locations` | `app/api/locations/route.ts` |
| `PUT/DELETE /api/locations/[id]` | `app/api/locations/[id]/route.ts` |
| `GET /api/dashboard` | `app/api/dashboard/route.ts` |
---

## Y2: Cross-Feature Error Catalog

All errors follow the standard response shape:
```json
{ "error": "ERROR_CODE", "message": "Human-readable description.", "fields": { "field": "detail" } }
```
`fields` is only present on `422 Unprocessable Entity` responses.

---

### HTTP Status Code Usage

| Status | Meaning | When Used |
|--------|---------|-----------|
| `200 OK` | Request succeeded | GET, PUT, PATCH success |
| `201 Created` | Resource created | POST success |
| `204 No Content` | Success, no body | DELETE success |
| `400 Bad Request` | Malformed request / invalid delta | `delta` not ±1 |
| `404 Not Found` | Resource does not exist | Wine, location not found |
| `409 Conflict` | State conflict | Quantity at 0 or max; duplicate location name |
| `422 Unprocessable Entity` | Validation failed | Field-level validation errors |
| `500 Internal Server Error` | Unexpected server/DB error | DB write/read failures |

---

### Wine Errors (F00)

| Error Code | HTTP | Trigger | User Message |
|-----------|------|---------|--------------|
| `WINE_NOT_FOUND` | 404 | `GET/PUT/DELETE /api/wines/[id]` where ID does not exist | "Wine not found." |
| `VALIDATION_ERROR` | 422 | Any required field missing or malformed | "[Field] is required." (per-field) |
| `VINTAGE_OUT_OF_RANGE` | 422 | `vintage < 1900` or `vintage > current_year + 1` | "Vintage must be between 1900 and [year]." |
| `INVALID_WINE_TYPE` | 422 | `wine_type` not in allowed enum | "Select a valid wine type." |
| `QUANTITY_OUT_OF_RANGE` | 422 | `quantity < 1` or `quantity > 9999` on create/edit | "Quantity must be between 1 and 9999." |
| `LOCATION_NOT_FOUND` | 422 | `location_id` references a deleted location | "Selected storage location no longer exists. Please choose another." |
| `WINDOW_INVALID_RANGE` | 422 | `drinking_window_end < drinking_window_start` | "Drinking window end year must be ≥ start year." |
| `DB_WRITE_ERROR` | 500 | Unexpected PostgreSQL error on INSERT/UPDATE/DELETE | "Could not save wine. Please try again." |

---

### Quantity & Bottle Event Errors (F01)

| Error Code | HTTP | Trigger | User Message |
|-----------|------|---------|--------------|
| `QUANTITY_ALREADY_ZERO` | 409 | Decrement when `wines.quantity = 0` | "No bottles left to remove." |
| `QUANTITY_AT_MAX` | 409 | Increment when `wines.quantity = 9999` | "Maximum bottle count reached." |
| `MISSING_EVENT_TYPE` | 422 | Decrement request missing `event_type` | "Please select what happened to this bottle." |
| `INVALID_EVENT_TYPE` | 422 | `event_type` not in `Consumed|Gifted|Opened` | "Invalid event type." |
| `INVALID_DELTA` | 400 | `delta` is not `+1` or `-1` | "Invalid quantity delta." |

---

### Location Errors (F02)

| Error Code | HTTP | Trigger | User Message |
|-----------|------|---------|--------------|
| `LOCATION_NOT_FOUND` | 404 | `PUT/DELETE /api/locations/[id]` where ID does not exist | "Location not found." |
| `LOCATION_NAME_CONFLICT` | 409 | Create or rename with a name that already exists (case-insensitive) | "A location with that name already exists." |

---

### Tasting Note Errors (F04)

| Error Code | HTTP | Trigger | User Message |
|-----------|------|---------|--------------|
| `TASTED_ON_FUTURE` | 422 | `tasted_on` > today's date | "Tasting date cannot be in the future." |
| `RATING_OUT_OF_RANGE` | 422 | `rating` outside scale bounds (>5 for five_star, >100 for hundred_point, or < 1) | "Rating must be between 1 and [5 or 100]." |
| `INVALID_WOULD_BUY_AGAIN` | 422 | Value not in `yes|no|maybe` | "Invalid 'Would Buy Again' value." |
| `INVALID_OCCASION` | 422 | Value not in allowed occasion enum | "Invalid occasion value." |

---

### Settings Errors (F04)

| Error Code | HTTP | Trigger | User Message |
|-----------|------|---------|--------------|
| `INVALID_RATING_SCALE` | 422 | `rating_scale` not in `five_star|hundred_point` | "Rating scale must be 'five_star' or 'hundred_point'." |

---

### Dashboard Errors (F06)

| Error Code | HTTP | Trigger | User Message |
|-----------|------|---------|--------------|
| `DB_READ_ERROR` | 500 | Database unavailable or query fails on dashboard load | "Could not load dashboard. Please try again." |

---

### General / Cross-Feature

| Error Code | HTTP | Trigger | User Message |
|-----------|------|---------|--------------|
| `DB_WRITE_ERROR` | 500 | Any unexpected DB write failure | "Could not save. Please try again." |
| `DB_READ_ERROR` | 500 | Any unexpected DB read failure | "Could not load data. Please try again." |
| `NOT_FOUND` | 404 | Route exists but no resource at given ID | "Not found." |
| `METHOD_NOT_ALLOWED` | 405 | HTTP method not supported on route | "Method not allowed." |

---

### Client-Side Error Display Guidelines

- **`422` field errors:** Display error message immediately adjacent to the offending input field (inline validation). Each field error keyed by field name in `fields` object.
- **`404` on page load:** Render a full-page "Not Found" message with a back link.
- **`409` conflicts:** Display as a toast/banner at the top of the relevant section.
- **`500` errors:** Display as a toast/banner: "Something went wrong. Please try again." with a retry action where applicable.
- **Network errors (no response):** Same treatment as `500`; display connectivity error message.
---

## Y3: External Integration Points

SimpleWineApp MVP has **no external API integrations**. All data is internal (PostgreSQL). This section documents the system boundaries and any infrastructure-level integration contracts.

---

### PostgreSQL 16 (Primary Datastore)

| Property | Value |
|----------|-------|
| Technology | PostgreSQL 16 |
| Container service | `db` (docker-compose service name) |
| Image | `postgres:16` |
| Port | 5432 (internal only; not exposed to host) |
| Database name | `simplewineapp` |
| User | `postgres` |
| Password | `postgres` (local dev; override via env for production) |
| Connection string | `postgresql://postgres:postgres@db:5432/simplewineapp` |
| Connection env var | `DATABASE_URL` |

**Contract:**
- The `app` service must wait for `db` to be healthy before running migrations or accepting traffic. Implemented via `depends_on` with `condition: service_healthy` in `docker-compose.yml`.
- `db` service should have a `healthcheck` using `pg_isready -U postgres`.
- Application code must use `DATABASE_URL` environment variable (not hardcoded) for the connection string.

---

### Docker Compose Stack

| Service | Image | Ports | Depends On |
|---------|-------|-------|-----------|
| `db` | `postgres:16` | 5432 (internal) | — |
| `app` | Dockerfile (Next.js 14) | 3000 → 3000 | `db` (healthy) |

**`app` service startup sequence:**
1. Wait for `db` healthy.
2. Run `npm run migrate` (applies all SQL files in `db/` in order).
3. Run `npm start` (serves Next.js production build).

**Environment variables passed to `app` service:**
```
DATABASE_URL=postgresql://postgres:postgres@db:5432/simplewineapp
NODE_ENV=production
```

---

### Browser APIs (Client-Side)

| API | Usage | Feature |
|-----|-------|---------|
| `sessionStorage` | Persist search/filter/sort state on `/cellar` | F03 |
| `Date` / `getFullYear()` | Compute readiness badge client-side | F05 |

No localStorage, cookies, IndexedDB, service workers, or push notifications in MVP.

---

### Out-of-Scope Integrations (Explicitly Excluded from MVP)

| Integration | Reason Excluded |
|------------|----------------|
| Wine API (e.g., Vivino, Wine-Searcher) | No external APIs in MVP per PRD |
| AI/ML recommendations | Explicitly excluded per PRD |
| OAuth / SSO / Auth providers | No authentication in MVP |
| Email / push notifications | No real-time features in MVP |
| Payment / e-commerce | No marketplace features |
| Analytics (e.g., Google Analytics) | Not specified; deferred |
| CDN / object storage | No image upload in MVP |

---

### Security Boundary Notes

- **No `X-Frame-Options: DENY`:** App must render in an iframe preview. This header must not be set in `next.config.mjs` or any middleware.
- **No `frame-ancestors: 'none'` or `'self'` in CSP:** Same reason. If a CSP header is set, `frame-ancestors` must either be omitted or set to `*`.
- **No authentication middleware:** All routes are publicly accessible (single-user local app).
- **`next.config.mjs`:** The config file extension must be `.mjs`, never `.ts`. Next.js 14 will hard-error with a `.ts` config file.

---

*End of Y3: Integrations*
