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
5. User fills in desired fields (only `wine_id` and `tasted_on` are technically required; all other fields optional for flexibility).
6. User submits the form.
7. Client validates fields (see Validation).
8. `POST /api/wines/[id]/notes` called with form data.
9. Server normalizes rating to 1–100 scale and inserts into `tasting_notes`.
10. Server returns `201 Created` with the new note record.
11. Client redirects to `/wines/[id]` (scrolled to tasting notes section).

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
