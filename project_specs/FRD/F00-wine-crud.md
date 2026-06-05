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
- `location_id*` (integer, FK → locations.id): Required; user selects from dropdown

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
- `wine_type`: Required; must be one of the seven allowed enum values (case-sensitive on API; UI dropdown enforces this).
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
