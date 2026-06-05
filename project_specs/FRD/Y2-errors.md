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
