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
