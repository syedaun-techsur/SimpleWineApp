# User Stories — SimpleWineApp

| Field | Value |
|---|---|
| **Project** | SimpleWineApp |
| **Acronym** | SWA |
| **Version** | 1.0 |
| **Date** | 2026-06-05 |
| **Status** | Draft |
| **Based on PRD Version** | 1.0 |
| **Personas** | Marcus Delgado (PER-01), Claire Fontaine (PER-02) |
| **Related Documents** | PRD-SimpleWineApp.md, FRD-SimpleWineApp.md, PERSONAS-SimpleWineApp.md |

---

## Personas Reference

| ID | Name | Role | Primary Driver |
|---|---|---|---|
| **Marcus** | Marcus Delgado | Casual Wine Drinker & Collector | Speed on mobile; quick log and drink-now decisions |
| **Claire** | Claire Fontaine | Avid Cellar Builder & Long-Term Ager | Structured location tracking; drinking-window discipline; detailed tasting notes |

---

## Priority Definitions

| Priority | Label | Meaning |
|---|---|---|
| **P0** | Critical | Must ship in MVP; app is not useful without this feature |
| **P1** | High | Ships in MVP; significantly reduces value if absent |
| **P2** | Medium | Target for next iteration post-MVP |
| **P3** | Low | Nice-to-have; deferred indefinitely |

---

## Epic 0: Wine Inventory CRUD (F0)

*Foundation of the collection. Every wine starts here — a structured record that covers the full field set from name and producer through storage location and drinking window.*

### US-0.1: Add a New Wine
**As a** Marcus, **I want to** fill out a form to add a new wine to my collection, **so that** I have a structured record for every bottle I own.

**Acceptance Criteria:**
- [ ] `/wines/new` renders a form with all required fields marked with `*`: name, producer, vintage, wine type, quantity, and storage location
- [ ] Optional fields are available: grape, country, region, bottle size, purchase date, purchase source, purchase price, drinking window (start/end), and general notes
- [ ] Wine type is a dropdown with exactly 8 options: Red, White, Rosé, Sparkling, Dessert, Fortified, Orange, Other
- [ ] Storage location selector is populated from user-defined locations; shows placeholder "Select a storage location…" with no default
- [ ] Helper text adjacent to the storage location field reads: "Each wine record tracks one storage location. To split a case across two locations, create separate records with the appropriate quantities for each."
- [ ] On successful submission, the user is redirected to `/wines/[id]` for the new wine
- [ ] The form is fully usable on a 375px mobile viewport with no horizontal scroll

**Priority:** P0 | **Feature Ref:** F0

---

### US-0.2: Validate Wine Form Inputs
**As a** Marcus, **I want to** receive clear inline error messages when I enter invalid data, **so that** I can fix mistakes before submitting and avoid corrupted records.

**Acceptance Criteria:**
- [ ] Required fields show an inline error message adjacent to the field if left empty on submit
- [ ] Vintage year rejects non-integers and values outside 1900–(current year + 1) with the message "Vintage must be between 1900 and [current year + 1]."
- [ ] Purchase price rejects negative values and values with more than 2 decimal places
- [ ] Drinking window end year shows an error if it is less than the start year: "Drinking window end year must be ≥ start year."
- [ ] If the selected storage location was deleted between form load and submit, the error "Selected storage location no longer exists. Please choose another." is shown
- [ ] Client-side validation runs before the API call; server re-validates as defense-in-depth returning `422` with field-level errors

**Priority:** P0 | **Feature Ref:** F0

---

### US-0.3: View Wine Detail
**As a** Claire, **I want to** view all information about a specific wine on a dedicated detail page, **so that** I can see its full record including location, drinking window, tasting notes, and bottle history in one place.

**Acceptance Criteria:**
- [ ] `/wines/[id]` displays all stored fields: name, producer, vintage, wine type, grape, country, region, bottle size, quantity, storage location, purchase info, drinking window, and general notes
- [ ] The computed readiness badge is displayed in the page header (Drink Now / Hold / Approaching Peak / Past Window / No Window Set)
- [ ] Tasting notes appear in reverse-chronological order in a dedicated section
- [ ] The bottle event log ("Bottle History") appears below the wine details in reverse-chronological order
- [ ] Quantity increment (`+`) and decrement (`−`) controls are present on the page
- [ ] If the wine is not found, a 404 page renders with "Wine not found."

**Priority:** P0 | **Feature Ref:** F0

---

### US-0.4: Edit an Existing Wine
**As a** Claire, **I want to** edit any field on an existing wine record, **so that** I can correct mistakes or update information as my cellar changes.

**Acceptance Criteria:**
- [ ] `/wines/[id]/edit` renders the form pre-populated with all current field values
- [ ] The storage location selector pre-selects the current location; if the location was deleted, the field highlights and shows "Location Unknown — please select a new location"
- [ ] All validation rules from US-0.2 apply identically on edit
- [ ] On successful save, the user is redirected to `/wines/[id]` and sees updated values
- [ ] `updated_at` timestamp is updated on the record

**Priority:** P0 | **Feature Ref:** F0

---

### US-0.5: Delete a Wine Record
**As a** Marcus, **I want to** permanently delete a wine I no longer want to track, **so that** my collection stays clean without abandoned records.

**Acceptance Criteria:**
- [ ] A "Delete" action is accessible from `/wines/[id]`
- [ ] A confirmation modal appears: "Delete [wine name]? This cannot be undone. All tasting notes and bottle events will also be deleted."
- [ ] User must explicitly confirm before deletion proceeds
- [ ] On confirmation, the wine record and all associated tasting notes and bottle events are deleted
- [ ] User is redirected to `/cellar` after successful deletion
- [ ] If the user cancels the modal, no deletion occurs and the user remains on `/wines/[id]`

**Priority:** P0 | **Feature Ref:** F0

---

## Epic 1: Quantity & Bottle Status (F1)

*Tracks the physical life of every bottle — counting additions, logging removals, and preserving an immutable history of what happened to each one.*

### US-1.1: Increment Bottle Count
**As a** Marcus, **I want to** add bottles to an existing wine record with a single tap, **so that** my quantity stays accurate when I buy more of the same wine.

**Acceptance Criteria:**
- [ ] A `+` button is visible on the wine detail page (`/wines/[id]`) and on wine cards in `/cellar`
- [ ] Tapping `+` immediately increments the quantity by 1 and updates the displayed count
- [ ] The `+` button is disabled when quantity reaches 9999, showing "Maximum bottle count reached." if attempted via API
- [ ] No bottle event is created for an increment
- [ ] The increment action works on a 375px mobile viewport

**Priority:** P0 | **Feature Ref:** F1

---

### US-1.2: Log a Bottle Removal Event
**As a** Marcus, **I want to** select what happened to a bottle when I remove it (Consumed, Gifted, or Opened), **so that** I have an accurate history of how I've used my collection.

**Acceptance Criteria:**
- [ ] Tapping `−` on a wine with quantity > 0 opens a "Remove a Bottle" modal
- [ ] The modal presents three event-type buttons: Consumed, Gifted, Opened, plus a Cancel option
- [ ] An optional notes textarea (max 500 chars) is available in the modal with a character counter
- [ ] The user must select an event type before confirming — the confirm button is disabled until a selection is made
- [ ] On confirmation, quantity decrements by 1 and a bottle event is recorded with today's date, event type, and optional note
- [ ] The `−` button is disabled when quantity is 0; the server also rejects the request with `409 QUANTITY_ALREADY_ZERO`
- [ ] After a Consumed or Gifted event, a prompt appears: "Would you like to add a tasting note for this bottle?" with Yes and Skip buttons
- [ ] After an Opened event, no tasting note prompt is shown

**Priority:** P0 | **Feature Ref:** F1

---

### US-1.3: View Bottle Event History
**As a** Claire, **I want to** see an immutable log of all bottle removal events for a wine, **so that** I can review when and how each bottle was used.

**Acceptance Criteria:**
- [ ] A "Bottle History" section on `/wines/[id]` lists all bottle events for that wine
- [ ] Events are displayed in reverse-chronological order (newest first)
- [ ] Each event row shows: date, color-coded event type badge (Consumed / Gifted / Opened), and optional note
- [ ] The event log is read-only — no edit or delete controls are shown
- [ ] If no events exist, the section is empty or hidden gracefully

**Priority:** P0 | **Feature Ref:** F1

---

### US-1.4: See "Cellar Empty" State When Quantity Reaches Zero
**As a** Marcus, **I want to** see a clear "Cellar Empty" indicator when I've logged all bottles of a wine, **so that** I know the wine is gone without the record being deleted.

**Acceptance Criteria:**
- [ ] When quantity = 0, a "Cellar Empty" badge is displayed on the wine detail page and wine card
- [ ] The `−` button is disabled when quantity = 0
- [ ] The `+` button remains active so the user can acquire more bottles of the same wine
- [ ] The wine record, all tasting notes, and all bottle events are retained in the database — the record is NOT deleted
- [ ] The "Cellar Empty" badge is visually distinct from readiness badges

**Priority:** P0 | **Feature Ref:** F1

---

## Epic 2: Storage Locations (F2)

*Named physical storage areas assigned to every wine — the backbone of cellar organization for users managing bottles across multiple spaces.*

### US-2.1: View All Storage Locations
**As a** Claire, **I want to** see a list of all my defined storage locations with a bottle count for each, **so that** I can understand how my cellar is distributed across physical spaces.

**Acceptance Criteria:**
- [ ] `/locations` renders a list of all user-defined locations sorted alphabetically by name
- [ ] Each location row shows: location name (as a clickable link), wine count (number of wine records assigned), and action buttons (Rename, Delete)
- [ ] Clicking a location name navigates to `/cellar?location=[location_name]` with the location filter pre-applied; the active filter chip for that location is visible on the cellar list
- [ ] Wine count includes wines at quantity 0 (Cellar Empty wines still assigned to a location)
- [ ] If no locations exist, an empty state reads: "No storage locations yet. Add your first location below."

**Priority:** P0 | **Feature Ref:** F2

---

### US-2.2: Create a Storage Location
**As a** Claire, **I want to** create a new named storage location, **so that** I can assign bottles to precise physical spaces like "Basement Rack A" or "Eurocave".

**Acceptance Criteria:**
- [ ] An "Add Location" input and submit button are present on `/locations`
- [ ] A new location name is required (non-empty after trim, max 100 chars)
- [ ] Location names are unique case-insensitively — submitting a duplicate shows "A location with that name already exists."
- [ ] On successful creation, the new location appears in the list with wine count = 0
- [ ] The empty-state message is removed once the first location exists

**Priority:** P0 | **Feature Ref:** F2

---

### US-2.3: Rename a Storage Location
**As a** Claire, **I want to** rename a storage location, **so that** I can correct typos or reflect changes in my physical cellar setup.

**Acceptance Criteria:**
- [ ] Clicking "Rename" on a location row reveals an inline edit field pre-filled with the current name
- [ ] The same uniqueness and length rules apply as on create (case-insensitive, max 100 chars, excluding the current location's own name)
- [ ] On successful rename, all wine records using that location automatically reflect the new name (via FK relationship — no wine rows need individual updates)
- [ ] Cancelling the rename restores the original name without any change

**Priority:** P0 | **Feature Ref:** F2

---

### US-2.4: Delete a Storage Location
**As a** Claire, **I want to** delete a storage location I no longer use, **so that** my location list stays tidy, while ensuring no wine records are lost.

**Acceptance Criteria:**
- [ ] Clicking "Delete" on a location shows a confirmation modal
- [ ] If the location has 0 wines: "Delete '[Location Name]'? This cannot be undone."
- [ ] If the location has wines assigned: "Delete '[Location Name]'? [N] wine(s) will be marked 'Location Unknown'. This cannot be undone."
- [ ] On confirmation, all wines with that location_id have their location set to NULL (not deleted)
- [ ] Affected wine records display "Location Unknown" in place of the location name on detail and list views
- [ ] On `/wines/[id]/edit` for an affected wine, the location field highlights and prompts "Location Unknown — please select a new location"
- [ ] The location row is removed from `/locations` after deletion

**Priority:** P0 | **Feature Ref:** F2

---

## Epic 3: Search & Filter (F3)

*Fast, client-side discovery across the collection — with multi-dimensional filtering, dismissible chips, and session-persistent state so back-navigation always restores context.*

### US-3.1: Search the Collection by Text
**As a** Marcus, **I want to** type in a search bar to instantly find wines by name, producer, grape, country, or region, **so that** I can check if I have a specific bottle without scrolling through the entire list.

**Acceptance Criteria:**
- [ ] A search bar is prominently displayed on `/cellar`
- [ ] On each keystroke (debounced 150ms), the wine list filters to show only wines with a case-insensitive substring match in name, producer, grape, country, or region
- [ ] A result count label shows "Showing [N] of [Total] wines" below the search bar
- [ ] Clearing the search bar restores the full list (subject to any active filters)
- [ ] The search term is saved in `sessionStorage` (`swa_cellar_search`) and restored on back-navigation
- [ ] If no wines match, the message "No wines match your current filters. [Clear All Filters]" is displayed
- [ ] If the collection is empty, "Your cellar is empty. [Add your first wine →]" is shown instead

**Priority:** P1 | **Feature Ref:** F3

---

### US-3.2: Filter the Collection by Multiple Dimensions
**As a** Claire, **I want to** filter my cellar list by wine type, producer, country/region, vintage year, grape variety, storage location, drinking readiness, and rating, **so that** I can quickly isolate exactly the subset of wines I'm looking for.

**Acceptance Criteria:**
- [ ] A filter panel (toggle or sidebar) on `/cellar` exposes all 8 filter dimensions
- [ ] Each dimension shows only options that exist in the current collection (dynamic option counts)
- [ ] Selecting multiple values within one dimension applies OR logic; across dimensions applies AND logic
- [ ] Active filters appear as dismissible chips in an "Active Filters" row above the wine list
- [ ] Clicking ✕ on a chip removes that individual filter value immediately
- [ ] A "Clear All" button removes all active filters and the search query, resetting `sessionStorage`
- [ ] Filter state is saved in `sessionStorage` (`swa_cellar_filters`) and fully restored on back-navigation
- [ ] Readiness filter options reflect live-computed badge values (never stale from cache)

**Priority:** P1 | **Feature Ref:** F3

---

### US-3.3: Sort the Collection List
**As a** Marcus, **I want to** sort my wine list by different criteria, **so that** I can quickly find what I'm looking for depending on my current need (e.g., recently added, highest rated, quantity).

**Acceptance Criteria:**
- [ ] A sort dropdown on `/cellar` offers 10 sort options: Name A–Z, Name Z–A, Vintage Newest, Vintage Oldest, Rating Highest, Rating Lowest, Quantity Most, Quantity Fewest, Recently Added, Recently Consumed
- [ ] The default sort on first visit (no `sessionStorage` key) is Name A–Z
- [ ] Selecting a sort option immediately re-orders the filtered result set client-side with no server round-trip
- [ ] Sort preference is saved in `sessionStorage` (`swa_cellar_sort`) and restored on back-navigation
- [ ] An unrecognized sort key from `sessionStorage` falls back to the Name A–Z default

**Priority:** P1 | **Feature Ref:** F3

---

### US-3.4: Restore Search and Filter State After Back-Navigation
**As a** Claire, **I want** my search terms, active filters, and sort order to be restored when I navigate back to the cellar list from a wine detail page, **so that** I don't lose my place and have to re-apply everything.

**Acceptance Criteria:**
- [ ] Navigating from `/cellar` to `/wines/[id]` and back (via browser Back or app "Back to Cellar" link) restores the exact search text, active filter chips, and sort order
- [ ] Restoration requires no server round-trip — all state is read from `sessionStorage`
- [ ] If `sessionStorage` is unavailable (e.g., private browsing mode), filters work in-memory for the current page session without error
- [ ] Closing the browser tab clears session state; a new tab starts with default (no filters, Name A–Z sort)

**Priority:** P1 | **Feature Ref:** F3

---

## Epic 4: Tasting Notes & Ratings (F4)

*A structured, dated record of every tasting — with sensory fields, a flexible rating scale, and a "would buy again" disposition — permanently linked to the wine record.*

### US-4.1: Add a Tasting Note to a Wine
**As a** Marcus, **I want to** add a tasting note with a rating after drinking a bottle, **so that** I can remember what I thought and decide whether to buy it again.

**Acceptance Criteria:**
- [ ] `/wines/[id]/notes/new` renders a note form with the wine name in the header
- [ ] Required fields: tasting date (`tasted_on`, defaulting to today)
- [ ] Optional fields: appearance, aroma, flavor, finish (free text, max 1000 chars each with client-side character counter), rating, would-buy-again (Yes / No / Maybe), occasion (dinner / gift / casual / celebration / restaurant / tasting / other), guest feedback (max 2000 chars)
- [ ] The rating input renders as a 5-star widget or 100-point numeric input based on the user's current rating scale preference
- [ ] `tasted_on` rejects future dates with "Tasting date cannot be in the future."
- [ ] Form field values are auto-saved to sessionStorage (`swa_note_draft_[wine_id]`) on each change; if the user navigates away (locks phone, switches apps, presses Back) and returns, all field values are restored from the draft
- [ ] On successful save, the sessionStorage draft is cleared and the user is redirected to `/wines/[id]` scrolled to the tasting notes section
- [ ] `POST /api/wines/[id]/notes` returns `201 Created` with the note; rating stored internally as normalized 1–100

**Priority:** P1 | **Feature Ref:** F4

---

### US-4.2: Add a Tasting Note After Consuming or Gifting a Bottle
**As a** Marcus, **I want** to be prompted to add a tasting note immediately after logging a consumed or gifted bottle, **so that** I can capture my impressions while they're fresh without navigating separately.

**Acceptance Criteria:**
- [ ] After a Consumed or Gifted bottle event is logged (US-1.2), a prompt appears: "Would you like to add a tasting note for this bottle?"
- [ ] The prompt has two buttons: Yes and Skip
- [ ] Tapping Yes navigates to `/wines/[id]/notes/new` with `tasted_on` pre-filled to today
- [ ] Tapping Skip dismisses the prompt and returns to the current page with no note created
- [ ] No tasting note prompt is shown after an Opened event

**Priority:** P1 | **Feature Ref:** F4

---

### US-4.3: View All Tasting Notes for a Wine
**As a** Claire, **I want to** see all tasting notes for a wine in reverse-chronological order on the detail page, **so that** I can review my full tasting history and track how the wine has evolved over time.

**Acceptance Criteria:**
- [ ] The "Tasting Notes" section on `/wines/[id]` lists all notes for that wine
- [ ] Notes are ordered by `tasted_on` DESC; ties broken by `created_at` DESC
- [ ] Each note displays: date, rating (formatted per current scale), would-buy-again indicator, occasion badge, appearance, aroma, flavor, finish, and guest feedback
- [ ] If no notes exist, the section shows: "No tasting notes yet. [Add a Tasting Note →]"
- [ ] The most recent rating is displayed on the wine card in `/cellar` formatted per the user's current rating scale

**Priority:** P1 | **Feature Ref:** F4

---

### US-4.4: Switch Between 5-Star and 100-Point Rating Scale
**As a** Claire, **I want to** switch my rating scale between 5-star and 100-point, **so that** I can record ratings in the format I prefer and have all past ratings displayed consistently in the same scale.

**Acceptance Criteria:**
- [ ] A "Switch to 100-point" / "Switch to 5-star" toggle is accessible from the tasting note form and from wine cards that display a rating
- [ ] The preference is stored in `user_settings` (upserted; exactly one row)
- [ ] Default scale is 5-star
- [ ] After switching, all rating displays across the UI (wine cards, detail page, tasting notes list) immediately reflect the new scale
- [ ] Ratings stored internally as normalized 1–100; display conversion: stored ÷ 20 = star rating; 5-star input N × 20 = stored value
- [ ] 5-star input must be an integer 1–5; 100-point input must be an integer 1–100; out-of-range values are rejected with `RATING_OUT_OF_RANGE`

**Priority:** P1 | **Feature Ref:** F4

---

## Epic 5: Drinking Window Badges (F5)

*Auto-calculated readiness badges derived from drinking window years — recalculated on every page load so they never go stale.*

### US-5.1: Set a Drinking Window on a Wine
**As a** Claire, **I want to** specify a "drink from" and "drink until" year for a wine, **so that** the app can automatically calculate when it's ready to open.

**Acceptance Criteria:**
- [ ] The wine create/edit form has two optional numeric inputs: "Drink From (Year)" and "Drink Until (Year)"
- [ ] Both fields are optional; either or both may be left blank
- [ ] If both are provided, end year must be ≥ start year; otherwise the error "Drinking window end year must be ≥ start year." is shown
- [ ] Both years must be integers ≥ 1900 and ≤ 2100; non-integer values show "[Field] must be a valid year."
- [ ] A live readiness badge preview (color-coded pill, using the same badge logic as the collection list) is displayed immediately below the two year inputs; the preview updates on each blur/change event and reflects today's date — giving the user immediate confidence that the window will produce the expected badge
- [ ] If both year fields are blank, no badge preview is shown
- [ ] Values are saved as part of the wine record (no separate API endpoint for drinking window)

**Priority:** P1 | **Feature Ref:** F5

---

### US-5.2: See Readiness Badge on Wine Cards and Detail Page
**As a** Marcus, **I want to** instantly see a color-coded readiness badge on every wine, **so that** I can decide what to open tonight at a glance without doing any date math myself.

**Acceptance Criteria:**
- [ ] Every wine displays exactly one readiness badge derived from its drinking window and the current year — recomputed on every page load, never cached
- [ ] Badge rules: **Drink Now** (green) if current year is within window; **Hold** (blue) if current year is more than 2 years before window start; **Approaching Peak** (amber) if current year is 1–2 years before window start; **Past Window** (grey) if current year is after window end; **No Window Set** (muted grey) if both window fields are null
- [ ] Badges are displayed on wine cards in `/cellar`, on the wine detail page header, and on Dashboard shelf cards
- [ ] Badge colors meet WCAG 2.1 AA contrast requirements against their background
- [ ] Edge cases are handled: start-only window, end-only window, and single-year window (start = end)

**Priority:** P1 | **Feature Ref:** F5

---

### US-5.3: Filter the Collection by Drinking Readiness
**As a** Claire, **I want to** filter my cellar list by readiness badge (e.g., "Hold"), **so that** I can quickly identify bottles that shouldn't be touched for years and plan storage accordingly.

**Acceptance Criteria:**
- [ ] The F3 filter panel includes a "Readiness" dimension with multi-select options: Drink Now, Hold, Approaching Peak, Past Window, No Window Set
- [ ] Selecting one or more readiness values filters the list to wines with a matching computed badge
- [ ] Readiness filtering is applied after badge computation at render time — never stale
- [ ] Readiness filter can be combined with other filter dimensions (e.g., Location = "Basement Rack A" AND Readiness = "Hold")
- [ ] Active readiness filters appear as dismissible chips in the "Active Filters" row

**Priority:** P1 | **Feature Ref:** F5

---

## Epic 6: Collection Dashboard (F6)

*The default landing page — an at-a-glance hub showing what's ready to drink, collection breakdowns, and recent activity, with every element linking to the filtered cellar list.*

### US-6.1: View Summary Stats at a Glance
**As a** Marcus, **I want to** see key collection metrics on the home page, **so that** I immediately know how many bottles I have and how many are ready to drink without navigating anywhere.

**Acceptance Criteria:**
- [ ] The dashboard (`/`) displays four stat tiles: Total Bottles (sum of all quantities), Unique Wines (count of wine records), Drink Now count, Approaching Peak count
- [ ] Stat tiles load server-rendered on page arrival — no client-side fetch required on initial load
- [ ] "Drink Now" tile links to `/cellar?readiness=Drink+Now`; the cellar list loads with the readiness filter pre-applied as an active chip
- [ ] "Approaching Peak" tile links to `/cellar?readiness=Approaching+Peak`; the cellar list loads with the readiness filter pre-applied as an active chip
- [ ] "Total Bottles" and "Unique Wines" tiles link to `/cellar` with no filter applied
- [ ] All tiles display `0` gracefully when the collection is empty — no errors or broken layout

**Priority:** P1 | **Feature Ref:** F6

---

### US-6.2: Browse the "Drink Now" Shelf
**As a** Marcus, **I want to** see a horizontal-scroll row of all wines that are currently in their drinking window, **so that** I can quickly pick one to open tonight.

**Acceptance Criteria:**
- [ ] The Dashboard includes a "Drink Now" shelf: a horizontally scrollable card list of all wines with readiness badge = Drink Now
- [ ] Each card shows: wine name, producer, vintage, and the Drink Now badge
- [ ] Cards link to `/wines/[id]` for the respective wine
- [ ] Wines are sorted alphabetically by name within the shelf
- [ ] If no wines have a Drink Now badge, the shelf displays: "No wines are ready to drink right now."
- [ ] The shelf is computed server-side (SQL filter) and never shows stale readiness data

**Priority:** P1 | **Feature Ref:** F6

---

### US-6.3: See Recently Added, Recently Consumed, and Highest Rated
**As a** Marcus, **I want to** see lists of my most recently added wines, recently consumed bottles, and top-rated wines on the dashboard, **so that** I can pick up where I left off and remember what I enjoyed most.

**Acceptance Criteria:**
- [ ] "Recently Added" lists the 5 most recently created wine records showing name, producer, vintage, and date added; each links to `/wines/[id]`
- [ ] "Recently Consumed" lists the 5 most recent Consumed or Gifted bottle events showing wine name, event type, and date; each links to `/wines/[id]`
- [ ] "Highest Rated" lists the top 5 wines by most recent tasting note rating (normalized 1–100), showing name, producer, and rating formatted per user's current scale; each links to `/wines/[id]`
- [ ] Empty states: "No wines added yet. [Add your first wine →]" / "No consumption events recorded yet." / "Add tasting notes and ratings to see your top wines here."
- [ ] All data is server-rendered on page load — no stale cache

**Priority:** P1 | **Feature Ref:** F6

---

### US-6.4: Explore Collection Breakdowns
**As a** Claire, **I want to** see my collection broken down by wine type, country/region, and vintage decade, **so that** I can understand my cellar composition and plan future purchases intelligently.

**Acceptance Criteria:**
- [ ] The dashboard displays three breakdown sections: Wine Type breakdown, Country/Region breakdown (top 10), and Vintage Decade breakdown
- [ ] Wine Type breakdown shows each type (Red, White, etc.) with wine count and bottle count
- [ ] Country/Region breakdown shows the top 10 countries by wine count
- [ ] Decade breakdown groups wines by 10-year vintage bands (e.g., "2010s" = 2010–2019) ordered by decade DESC
- [ ] Each breakdown segment links to `/cellar` pre-filtered to the corresponding dimension (e.g., clicking "Red" filters by wine type = Red; clicking a country filters by country; clicking a decade applies a vintage range filter)
- [ ] If no wines exist, breakdown sections are hidden or display "Add wines to see your collection breakdown."
- [ ] Breakdowns handle wines with NULL vintage (excluded from decade breakdown) and NULL country (grouped as "Unknown")

**Priority:** P1 | **Feature Ref:** F6

---

## Story Index

| Story ID | Title | Persona | Priority | Feature Ref |
|---|---|---|---|---|
| US-0.1 | Add a New Wine | Marcus | P0 | F0 |
| US-0.2 | Validate Wine Form Inputs | Marcus, Claire | P0 | F0 |
| US-0.3 | View Wine Detail | Claire | P0 | F0 |
| US-0.4 | Edit an Existing Wine | Claire | P0 | F0 |
| US-0.5 | Delete a Wine Record | Marcus | P0 | F0 |
| US-1.1 | Increment Bottle Count | Marcus | P0 | F1 |
| US-1.2 | Log a Bottle Removal Event | Marcus | P0 | F1 |
| US-1.3 | View Bottle Event History | Claire | P0 | F1 |
| US-1.4 | See "Cellar Empty" State When Quantity Reaches Zero | Marcus | P0 | F1 |
| US-2.1 | View All Storage Locations | Claire | P0 | F2 |
| US-2.2 | Create a Storage Location | Claire | P0 | F2 |
| US-2.3 | Rename a Storage Location | Claire | P0 | F2 |
| US-2.4 | Delete a Storage Location | Claire | P0 | F2 |
| US-3.1 | Search the Collection by Text | Marcus | P1 | F3 |
| US-3.2 | Filter the Collection by Multiple Dimensions | Claire | P1 | F3 |
| US-3.3 | Sort the Collection List | Marcus | P1 | F3 |
| US-3.4 | Restore Search and Filter State After Back-Navigation | Claire | P1 | F3 |
| US-4.1 | Add a Tasting Note to a Wine | Marcus | P1 | F4 |
| US-4.2 | Add a Tasting Note After Consuming or Gifting a Bottle | Marcus | P1 | F4 |
| US-4.3 | View All Tasting Notes for a Wine | Claire | P1 | F4 |
| US-4.4 | Switch Between 5-Star and 100-Point Rating Scale | Claire | P1 | F4 |
| US-5.1 | Set a Drinking Window on a Wine | Claire | P1 | F5 |
| US-5.2 | See Readiness Badge on Wine Cards and Detail Page | Marcus | P1 | F5 |
| US-5.3 | Filter the Collection by Drinking Readiness | Claire | P1 | F5 |
| US-6.1 | View Summary Stats at a Glance | Marcus | P1 | F6 |
| US-6.2 | Browse the "Drink Now" Shelf | Marcus | P1 | F6 |
| US-6.3 | See Recently Added, Recently Consumed, and Highest Rated | Marcus | P1 | F6 |
| US-6.4 | Explore Collection Breakdowns | Claire | P1 | F6 |

---

*Related documents: PRD-SimpleWineApp.md, FRD-SimpleWineApp.md, PERSONAS-SimpleWineApp.md, TechArch-SimpleWineApp.md*
*Last updated: 2026-06-05*
