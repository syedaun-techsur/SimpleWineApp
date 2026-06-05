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
3. System renders a list: each row shows location name, wine count, and action buttons (Rename, Delete).
4. If no locations exist, render an empty state: "No storage locations yet. Add your first location below."
5. A location's wine count includes wines at quantity 0 (Cellar Empty wines are still associated with a location).

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

- **List:** Array of `{ id, name, wine_count }` objects, sorted alphabetically by name.
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
