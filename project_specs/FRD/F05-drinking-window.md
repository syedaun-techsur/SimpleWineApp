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
4. Values submitted as part of the wine create/update API call (see F00 API surface).
5. No separate API endpoint for drinking window — it is part of the wine record.

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
