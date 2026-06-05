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
2. System navigates to `/cellar` with the appropriate filter pre-applied via URL query params or `sessionStorage` pre-population.
3. Filter parameter mapping:

| Dashboard Element | Filter Applied on `/cellar` |
|-------------------|-----------------------------|
| "Total Bottles" tile | No filter (all wines) |
| "Unique Wines" tile | No filter (all wines) |
| "Drink Now" tile count | Readiness = Drink Now |
| "Approaching Peak" tile count | Readiness = Approaching Peak |
| Drink Now shelf card | Readiness = Drink Now |
| Wine type breakdown segment | Wine Type = [selected type] |
| Country/region breakdown segment | Country = [selected country] |
| Decade breakdown segment | Vintage range = [decade start]–[decade end] |
| Recently Added item | No filter (links to wine detail `/wines/[id]`) |
| Recently Consumed item | No filter (links to wine detail `/wines/[id]`) |
| Highest Rated item | No filter (links to wine detail `/wines/[id]`) |

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
