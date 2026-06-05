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
