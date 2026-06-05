---

## 4. API Design

### 4.1 API Conventions

- **Base URL:** `http://localhost:3000/api` (Docker / local dev)
- **Framework:** Next.js 14 App Router Route Handlers (`app/api/**/route.ts`)
- **Content-Type:** `application/json` for all requests and responses
- **Authentication:** None (single-user MVP)
- **IDs:** Integers (SERIAL from PostgreSQL)
- **Dates:** ISO 8601 `YYYY-MM-DD` strings
- **Timestamps:** ISO 8601 with timezone `YYYY-MM-DDTHH:mm:ssZ`

**Standard error response shape:**
```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable description.",
  "fields": { "field_name": "field-level error detail" }
}
```
`fields` is only present on `422 Unprocessable Entity` responses.

---

### 4.2 TypeScript Interfaces

```typescript
// ─────────────────────────────────────────────
// Domain Enums
// ─────────────────────────────────────────────

type WineType =
  | 'Red' | 'White' | 'Rosé' | 'Sparkling'
  | 'Dessert' | 'Fortified' | 'Orange' | 'Other';

type EventType = 'Consumed' | 'Gifted' | 'Opened';

type ReadinessBadge =
  | 'Drink Now' | 'Hold' | 'Approaching Peak'
  | 'Past Window' | 'No Window Set';

type WouldBuyAgain = 'yes' | 'no' | 'maybe';

type Occasion =
  | 'dinner' | 'gift' | 'casual' | 'celebration'
  | 'restaurant' | 'tasting' | 'other';

type RatingScale = 'five_star' | 'hundred_point';

// ─────────────────────────────────────────────
// Location
// ─────────────────────────────────────────────

interface Location {
  id: number;
  name: string;
  created_at: string;    // ISO 8601 timestamp
  updated_at: string;
}

interface LocationWithCount extends Location {
  wine_count: number;
}

// ─────────────────────────────────────────────
// Wine
// ─────────────────────────────────────────────

interface Wine {
  id: number;
  name: string;
  producer: string;
  vintage: number;
  wine_type: WineType;
  grape: string | null;
  country: string | null;
  region: string | null;
  bottle_size: string | null;
  quantity: number;
  location_id: number | null;
  location_name: string | null;    // JOIN-resolved; null = Location Unknown
  purchase_date: string | null;    // YYYY-MM-DD
  purchase_source: string | null;
  purchase_price: string | null;   // NUMERIC returned as string by pg driver
  drinking_window_start: number | null;
  drinking_window_end: number | null;
  notes: string | null;
  most_recent_rating: number | null;  // normalized 1–100; null if no notes
  created_at: string;
  updated_at: string;
}

// Wine with computed readiness badge (client-side augmented)
interface WineWithBadge extends Wine {
  readiness_badge: ReadinessBadge;
}

interface CreateWineBody {
  name: string;
  producer: string;
  vintage: number;
  wine_type: WineType;
  grape?: string;
  country?: string;
  region?: string;
  bottle_size?: string;
  quantity: number;
  location_id: number;
  purchase_date?: string;        // YYYY-MM-DD
  purchase_source?: string;
  purchase_price?: number;
  drinking_window_start?: number;
  drinking_window_end?: number;
  notes?: string;
}

type UpdateWineBody = CreateWineBody;  // PUT replaces all fields

// ─────────────────────────────────────────────
// Bottle Events
// ─────────────────────────────────────────────

interface BottleEvent {
  id: number;
  wine_id: number;
  event_type: EventType;
  event_date: string;      // YYYY-MM-DD
  note: string | null;
  created_at: string;
}

interface PatchQuantityBody {
  delta: 1 | -1;
  event_type?: EventType;  // required when delta === -1
  note?: string;           // optional; max 500 chars
}

interface PatchQuantityResponse {
  quantity: number;
  event_id: number | null;  // null on increment
}

// ─────────────────────────────────────────────
// Tasting Notes
// ─────────────────────────────────────────────

interface TastingNote {
  id: number;
  wine_id: number;
  tasted_on: string;          // YYYY-MM-DD
  appearance: string | null;
  aroma: string | null;
  flavor: string | null;
  finish: string | null;
  rating: number | null;      // stored 1–100 normalized; null if not provided
  would_buy_again: WouldBuyAgain | null;
  occasion: Occasion | null;
  guest_feedback: string | null;
  created_at: string;
}

interface CreateNoteBody {
  tasted_on: string;           // YYYY-MM-DD; defaults to today
  appearance?: string;
  aroma?: string;
  flavor?: string;
  finish?: string;
  rating?: number;             // in user's current scale (1–5 or 1–100)
  would_buy_again?: WouldBuyAgain;
  occasion?: Occasion;
  guest_feedback?: string;
}

// ─────────────────────────────────────────────
// User Settings
// ─────────────────────────────────────────────

interface UserSettings {
  rating_scale: RatingScale;
  updated_at: string;
}

interface PatchSettingsBody {
  rating_scale: RatingScale;
}

// ─────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────

interface DashboardStats {
  total_bottles: number;
  unique_wines: number;
  drink_now_count: number;
  approaching_peak_count: number;
}

interface TypeBreakdownItem {
  wine_type: WineType;
  wine_count: number;
  bottle_count: number;
}

interface CountryBreakdownItem {
  country: string;   // 'Unknown' when null
  wine_count: number;
}

interface DecadeBreakdownItem {
  decade: number;    // e.g., 2010 = 2010–2019
  wine_count: number;
}

interface RecentlyConsumedItem {
  event_id: number;
  event_type: EventType;
  event_date: string;
  wine_id: number;
  wine_name: string;
  producer: string;
  vintage: number;
}

interface HighestRatedItem {
  wine_id: number;
  wine_name: string;
  producer: string;
  vintage: number;
  rating: number;    // normalized 1–100
  tasted_on: string;
}

interface DashboardResponse {
  stats: DashboardStats;
  drink_now_wines: Wine[];
  type_breakdown: TypeBreakdownItem[];
  country_breakdown: CountryBreakdownItem[];
  decade_breakdown: DecadeBreakdownItem[];
  recently_added: Wine[];
  recently_consumed: RecentlyConsumedItem[];
  highest_rated: HighestRatedItem[];
}

// ─────────────────────────────────────────────
// API Error
// ─────────────────────────────────────────────

interface ApiError {
  error: string;          // ERROR_CODE
  message: string;
  fields?: Record<string, string>;  // only on 422
}
```

---

### 4.3 Endpoint Reference

#### Wines

| Method | Path | Request Body | Success | Error Codes |
|--------|------|-------------|---------|-------------|
| `GET` | `/api/wines` | — | `200` `{ wines: Wine[] }` | `500 DB_READ_ERROR` |
| `POST` | `/api/wines` | `CreateWineBody` | `201` `Wine` | `422 VALIDATION_ERROR`, `422 VINTAGE_OUT_OF_RANGE`, `422 INVALID_WINE_TYPE`, `422 QUANTITY_OUT_OF_RANGE`, `422 LOCATION_NOT_FOUND`, `422 WINDOW_INVALID_RANGE`, `500 DB_WRITE_ERROR` |
| `GET` | `/api/wines/[id]` | — | `200` `{ wine: Wine, tasting_notes: TastingNote[], bottle_events: BottleEvent[] }` | `404 WINE_NOT_FOUND` |
| `PUT` | `/api/wines/[id]` | `UpdateWineBody` | `200` `Wine` | `404 WINE_NOT_FOUND`, `422 VALIDATION_ERROR`, `500 DB_WRITE_ERROR` |
| `DELETE` | `/api/wines/[id]` | — | `204` (empty) | `404 WINE_NOT_FOUND`, `500 DB_WRITE_ERROR` |

**GET /api/wines** notes:
- Returns full wine list for client-side search/filter on `/cellar`. No query params (full list always returned).
- `location_name` is JOIN-resolved from `locations.name`; `null` when location deleted.
- `most_recent_rating` is `DISTINCT ON (wine_id)` from `tasting_notes` ordered by `tasted_on DESC`.

**DELETE /api/wines/[id]** notes:
- Cascades to delete all `tasting_notes` and `bottle_events` for the wine (DB-level ON DELETE CASCADE).

---

#### Quantity & Bottle Events

| Method | Path | Request Body | Success | Error Codes |
|--------|------|-------------|---------|-------------|
| `PATCH` | `/api/wines/[id]/quantity` | `PatchQuantityBody` | `200` `PatchQuantityResponse` | `400 INVALID_DELTA`, `404 WINE_NOT_FOUND`, `409 QUANTITY_ALREADY_ZERO`, `409 QUANTITY_AT_MAX`, `422 MISSING_EVENT_TYPE`, `422 INVALID_EVENT_TYPE` |
| `GET` | `/api/wines/[id]/events` | — | `200` `{ events: BottleEvent[] }` | `404 WINE_NOT_FOUND` |

**PATCH /api/wines/[id]/quantity** notes:
- `delta: 1` → increment; no event created. `event_id: null` in response.
- `delta: -1` → decrement; `event_type` required; creates `bottle_events` row; `event_id` returned.
- Server enforces min 0 / max 9999; returns 409 at boundaries (UI also prevents via disabled buttons).

---

#### Tasting Notes

| Method | Path | Request Body | Success | Error Codes |
|--------|------|-------------|---------|-------------|
| `POST` | `/api/wines/[id]/notes` | `CreateNoteBody` | `201` `TastingNote` | `404 WINE_NOT_FOUND`, `422 TASTED_ON_FUTURE`, `422 RATING_OUT_OF_RANGE`, `422 INVALID_WOULD_BUY_AGAIN`, `422 INVALID_OCCASION`, `500 DB_WRITE_ERROR` |
| `GET` | `/api/wines/[id]/notes` | — | `200` `{ notes: TastingNote[] }` | `404 WINE_NOT_FOUND` |

**POST /api/wines/[id]/notes** notes:
- Server reads `user_settings.rating_scale` to normalize incoming `rating` to 1–100 scale before storing.
- Response `rating` is always the stored normalized value (1–100).

---

#### Settings

| Method | Path | Request Body | Success | Error Codes |
|--------|------|-------------|---------|-------------|
| `GET` | `/api/settings` | — | `200` `UserSettings` | `500 DB_READ_ERROR` |
| `PATCH` | `/api/settings` | `PatchSettingsBody` | `200` `UserSettings` | `422 INVALID_RATING_SCALE` |

**PATCH /api/settings** notes:
- Upserts the single `user_settings` row (`id = 1`). Always exactly one row exists after migration.

---

#### Locations

| Method | Path | Request Body | Success | Error Codes |
|--------|------|-------------|---------|-------------|
| `GET` | `/api/locations` | — | `200` `{ locations: LocationWithCount[] }` | `500 DB_READ_ERROR` |
| `POST` | `/api/locations` | `{ name: string }` | `201` `LocationWithCount` | `422 VALIDATION_ERROR`, `409 LOCATION_NAME_CONFLICT`, `500 DB_WRITE_ERROR` |
| `PUT` | `/api/locations/[id]` | `{ name: string }` | `200` `Location` | `404 LOCATION_NOT_FOUND`, `409 LOCATION_NAME_CONFLICT`, `422 VALIDATION_ERROR`, `500 DB_WRITE_ERROR` |
| `DELETE` | `/api/locations/[id]` | — | `204` (empty) | `404 LOCATION_NOT_FOUND`, `500 DB_WRITE_ERROR` |

**GET /api/locations** notes:
- Returns `wine_count` per location (COUNT of wines with that `location_id`).
- Sorted `ORDER BY LOWER(name) ASC`.

**DELETE /api/locations/[id]** notes:
- Server first runs `UPDATE wines SET location_id = NULL WHERE location_id = $1`, then deletes the location row. Wrapped in a transaction.

---

#### Dashboard

| Method | Path | Request Body | Success | Error Codes |
|--------|------|-------------|---------|-------------|
| `GET` | `/api/dashboard` | — | `200` `DashboardResponse` | `500 DB_READ_ERROR` |

**GET /api/dashboard** notes:
- Executes multiple SQL queries (stat tiles, Drink Now shelf, breakdowns, recently added, recently consumed, highest rated) and returns them in a single response.
- Uses current year `EXTRACT(YEAR FROM NOW())` server-side for all readiness calculations.
- Highest rated uses `DISTINCT ON (wine_id)` ordered by `tasted_on DESC` to get the most recent note per wine, then outer-sorted by `rating DESC LIMIT 5`.

---

### 4.4 Readiness Badge Computation

The readiness badge is **never cached** — computed fresh on every render/request using current year.

**Server-side SQL (used in dashboard queries):**
```sql
-- CY = EXTRACT(YEAR FROM NOW())::int
CASE
  WHEN w.drinking_window_start IS NULL AND w.drinking_window_end IS NULL
    THEN 'No Window Set'
  WHEN w.drinking_window_start IS NOT NULL
    AND w.drinking_window_end IS NOT NULL
    AND CY >= w.drinking_window_start
    AND CY <= w.drinking_window_end
    THEN 'Drink Now'
  WHEN w.drinking_window_start IS NOT NULL
    AND w.drinking_window_end IS NULL
    AND CY >= w.drinking_window_start
    THEN 'Drink Now'
  WHEN w.drinking_window_end IS NOT NULL
    AND w.drinking_window_start IS NULL
    AND CY <= w.drinking_window_end
    THEN 'Drink Now'
  WHEN w.drinking_window_start IS NOT NULL
    AND CY >= (w.drinking_window_start - 2)
    AND CY < w.drinking_window_start
    THEN 'Approaching Peak'
  WHEN w.drinking_window_end IS NOT NULL
    AND CY > w.drinking_window_end
    THEN 'Past Window'
  ELSE 'Hold'
END AS readiness_badge
```

**Client-side TypeScript (used in cellar filter component):**
```typescript
function computeReadinessBadge(
  start: number | null,
  end: number | null,
  currentYear: number = new Date().getFullYear()
): ReadinessBadge {
  if (start === null && end === null) return 'No Window Set';
  if (start !== null && end !== null) {
    if (currentYear >= start && currentYear <= end) return 'Drink Now';
    if (currentYear >= start - 2 && currentYear < start) return 'Approaching Peak';
    if (currentYear < start - 2) return 'Hold';
    if (currentYear > end) return 'Past Window';
  }
  if (start !== null && end === null) {
    if (currentYear >= start) return 'Drink Now';
    if (currentYear >= start - 2) return 'Approaching Peak';
    return 'Hold';
  }
  if (end !== null && start === null) {
    if (currentYear <= end) return 'Drink Now';
    return 'Past Window';
  }
  return 'No Window Set';
}
```

---

### 4.5 Rating Scale Conversion

| User Input | Scale | Stored (normalized 1–100) |
|------------|-------|--------------------------|
| 1 star | `five_star` | 20 |
| 2 stars | `five_star` | 40 |
| 3 stars | `five_star` | 60 |
| 4 stars | `five_star` | 80 |
| 5 stars | `five_star` | 100 |
| N (1–100) | `hundred_point` | N |

**Display conversion:** stored value ÷ 20 = star rating (round to nearest 0.5 for display).

```typescript
// Normalize to stored value (server-side on POST /api/wines/[id]/notes)
function normalizeRating(value: number, scale: RatingScale): number {
  return scale === 'five_star' ? value * 20 : value;
}

// Display conversion (client-side)
function displayRating(stored: number, scale: RatingScale): number | string {
  if (scale === 'five_star') return Math.round((stored / 20) * 2) / 2; // 0.5 increments
  return stored;
}
```

---
