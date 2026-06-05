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
