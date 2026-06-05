# UX Mockup — SimpleWineApp

**Project:** SimpleWineApp
**Generated:** 2026-06-05
**Based on:** UserStories-SimpleWineApp.md, JOURNEYS-SimpleWineApp.md, PRD-SimpleWineApp.md, FRD-SimpleWineApp.md

---

## Design System Tokens

| Token | Value | Usage |
|-------|-------|-------|
| Gold accent | `#FBCA5C` | CTAs on dark, active chips, stat tile accent lines — ≤10% surface |
| Black | `#0A0A0A` | Primary text, nav bar background |
| Bone | `#FAFAF7` | Page canvas, card backgrounds |
| Display font | Montserrat 900 | Page headings, section titles |
| Body font | Open Sans | Body copy, labels, table text |
| Mono font | JetBrains Mono (uppercase) | Field labels, badge text, stat tile labels |
| Button radius | 2px | All buttons (uppercase text) |
| Mobile breakpoint | 375px | Primary design target (mobile-first) |
| Tablet breakpoint | 768px | Two-column layouts begin |
| Desktop breakpoint | 1024px+ | Full three-column / sidebar layouts |

### Readiness Badge Colors

| Badge | Color | Hex | Usage |
|-------|-------|-----|-------|
| Drink Now | Green | `#10B981` | Bottle in drinking window |
| Hold | Blue | `#3B82F6` | > 2 years before window start |
| Approaching Peak | Amber | `#F59E0B` | 1–2 years before window start |
| Past Window | Grey | `#6B7280` | After window end |
| No Window Set | Muted grey | `#9CA3AF` | No window data |
| Cellar Empty | Bone/dark | `#D1D5DB` on `#0A0A0A` | qty = 0 |

**WCAG note:** All badge text uses white `#FFFFFF` or `#0A0A0A` to meet AA contrast. Gold `#FBCA5C` is only used on `#0A0A0A` backgrounds (19.4:1 ratio — AAA).

### Event Type Badge Colors (Bottle History)

| Event | Color | Hex |
|-------|-------|-----|
| Consumed | Warm red | `#EF4444` |
| Gifted | Purple | `#8B5CF6` |
| Opened | Orange | `#F97316` |

---

## UX Principles

1. **Speed on mobile is a trust gate.** Marcus adds wine in a shop with 60 seconds. Every primary CTA must be thumb-reachable and the form must load instantly.
2. **Dashboard as universal entry.** Every journey begins at `/`. Drink Now shelf and stat tiles are above the fold at 375px.
3. **Filter stacking without cognitive load.** Claire needs Location + Readiness combined. Filters appear as dismissible chips only when active; panel collapses by default.
4. **Form state is sacred.** Claire entering a 200-word tasting note mid-dinner must never lose data. Forms preserve state on backgrounding and back-navigation via `sessionStorage`.
5. **Badges are live, never cached.** Readiness recomputed on every page load — no stale states.
6. **Tasting notes are the long-term value loop.** Notes must be visually prominent on the wine detail page — not buried.

---

## Global Navigation

### Mobile Nav (375px) — Bottom Tab Bar

```
┌──────────────────────────────────────┐
│  [Dashboard]  [Cellar]  [Locations]  │
│      ●             ○          ○       │
└──────────────────────────────────────┘
```

- Fixed bottom, 56px tall
- Active tab: Gold `#FBCA5C` icon + label on `#0A0A0A`
- Inactive: `#9CA3AF` icon + label
- JetBrains Mono uppercase labels
- "+ Add Wine" FAB floats above tab bar at bottom-right (Gold background, Black icon, 56px circle)

### Desktop Nav (1024px+) — Top Header

```
┌─────────────────────────────────────────────────────┐
│  🍷 SimpleWineApp  │  Dashboard  Cellar  Locations  │ [+ Add Wine]
└─────────────────────────────────────────────────────┘
```

- `#0A0A0A` background, Bone text
- Gold underline on active route
- "+ Add Wine" button: Gold `#FBCA5C` bg, Black text, uppercase, 2px radius

### Global Error Toast

Toasts appear top-center (mobile) or top-right (desktop), auto-dismiss 5s:
- **Error:** `#EF4444` left border, "Something went wrong. [Retry]"
- **Success:** `#10B981` left border, confirmation text

---

## Document Map

| File | Contents |
|------|----------|
| `00-overview.md` | Design system, principles, global nav |
| `Flow-00-add-wine.md` | JRN-01.1: Adding wine at the shop |
| `Flow-01-drink-tonight.md` | JRN-01.2: Choosing what to drink tonight |
| `Flow-02-consume-and-note.md` | JRN-01.3 + US-4.2: Log consumed bottle + tasting note |
| `Flow-03-cellar-filter.md` | JRN-02.1: Filter by location + readiness |
| `Flow-04-location-audit.md` | JRN-02.3: Manage locations + drill-through |
| `Screen-00-dashboard.md` | `/` — Dashboard |
| `Screen-01-cellar-list.md` | `/cellar` — Collection list |
| `Screen-02-wine-detail.md` | `/wines/[id]` — Wine detail |
| `Screen-03-wine-form.md` | `/wines/new` + `/wines/[id]/edit` — Add/Edit form |
| `Screen-04-tasting-note-form.md` | `/wines/[id]/notes/new` — Tasting note form |
| `Screen-05-locations.md` | `/locations` — Storage locations |
| `Y0-patterns.md` | Interaction patterns (modals, chips, quantity controls) |
| `Y1-responsive.md` | Responsive layout rules per breakpoint |
| `Y2-accessibility.md` | WCAG 2.1 AA compliance notes |
---

## Flow 00: Add a New Wine (JRN-01.1)

**User Story:** US-0.1, US-0.2, US-5.1
**Persona:** Marcus Delgado (PER-01)
**Trigger:** Marcus is at a wine shop and taps "+ Add Wine" from the dashboard or FAB
**Entry Point:** `/` dashboard → FAB or "Add Wine" button
**Exit Point:** `/wines/[id]` — new wine detail page

```
[Dashboard /]
    │
    ▼  Tap "+ Add Wine" (FAB or dashboard CTA)
[Wine Form /wines/new]
    │
    ├── Fill required fields (name, producer, vintage, type, qty, location)
    │       │
    │       ├── Validation error → Inline error adjacent to field (stay on form)
    │       │
    │       └── Tap "Save Wine"
    │               │
    │               ├── Client validation pass → POST /api/wines
    │               │       │
    │               │       ├── 201 Created → Redirect to /wines/[id]
    │               │       │       └── [Success toast: "Wine added to your cellar!"]
    │               │       │
    │               │       └── 422 Server error → Inline field errors shown
    │               │
    │               └── Client validation fail → Field errors shown, no API call
    │
    └── Tap "Cancel" → Navigate back to /
```

**Steps:**
1. **Trigger:** User taps "+ Add Wine" FAB (mobile) or nav button. FAB is positioned in primary thumb zone — bottom-right, 56px above bottom tab bar.
2. **Form loads:** `/wines/new` renders instantly. Storage location `<select>` populates from `GET /api/locations`. If no locations exist, inline guidance appears: "You have no storage locations yet. [Add one first →]" with the location field highlighted.
3. **User fills fields:** Required fields (starred) first: name, producer, vintage, type, quantity, location. Optional fields below a visual divider ("Optional Details").
4. **Inline validation fires on blur** for each field (not on each keystroke for required fields). Vintage validates range 1900–(current year+1) immediately.
5. **User taps "Save Wine":** Full client-side validation runs. Any errors shown inline. If clean, `POST /api/wines` fires.
6. **Success:** Redirect to `/wines/[id]` with a green success toast: "Wine added to your cellar!" (auto-dismiss 4s). Total Bottles stat on dashboard updates on next visit.
7. **Cancel:** "Cancel" link (not button) in top-right of form header navigates back without API call.

**Key Moments (from journey analysis):**
- FAB must be in thumb zone — if not immediately visible, Marcus will close the app
- Vintage field: large touch target (44px min), numeric keyboard on mobile, live range validation
- Location dropdown pre-populated; if empty, guided nudge rather than hard block
- Success confirmation must be immediate and visible (toast + redirect to detail)
---

## Flow 01: Choose What to Drink Tonight (JRN-01.2)

**User Story:** US-5.2, US-6.1, US-6.2, US-4.3
**Persona:** Marcus Delgado (PER-01)
**Trigger:** Marcus opens the app at 6:30 pm wanting to find a bottle to open
**Entry Point:** App launch → `/` dashboard
**Exit Point:** App closed (wine decision made from detail page)

```
[App Launch → Dashboard /]
    │
    ├── Dashboard loads <1s (server-rendered)
    │       │
    │       ▼
    │   [Drink Now stat tile: "8 DRINK NOW"]
    │   [Drink Now shelf: horizontal scroll cards]
    │
    ▼  Scroll shelf / scan cards (wine name, rating visible)
    │
    ├── Tap a Drink Now shelf card
    │       │
    │       ▼
    │   [Wine Detail /wines/[id]]
    │       │
    │       ├── Rating visible in header section (no scroll required)
    │       ├── Storage location visible (Marcus knows which rack)
    │       └── Tasting notes show prior ratings → confidence to decide
    │
    └── Decision made → App closed
```

**Steps:**
1. **App opens on Dashboard:** Server-rendered — no loading skeleton for >500ms. Drink Now count tile is above the fold at 375px.
2. **Scan Drink Now shelf:** Horizontal scroll row, cards show: wine name (truncated at 1 line), producer (muted), vintage, Drink Now badge, and most-recent star rating (★★★★☆). At least 2.5 cards visible at 375px (peek pattern signals scrollability).
3. **Browse candidates:** Marcus scrolls the shelf. Rating visible on each card removes the need to tap in to compare.
4. **Tap a card:** Opens `/wines/[id]`. Readiness badge + rating are in the hero section (first visible block, no scroll required). Storage location shown prominently.
5. **Confirm decision:** Prior tasting notes are visible below hero. Marcus sees "4 stars – April 2025" and makes his choice.
6. **Exit:** Closes app. No logging action required for this flow.

**Key Moments:**
- Dashboard must load within 1s on warm container — cold blank state kills the flow
- Rating on shelf cards is critical — without it Marcus must tap each wine individually
- First 2-3 shelf cards visible without scroll (peek at 375px signals more)
- Wine detail hero section: badge + rating + location all visible above the fold at 375px
---

## Flow 02: Log Consumed Bottle + Tasting Note (JRN-01.3, US-1.2, US-4.1, US-4.2)

**User Story:** US-1.2, US-1.3, US-4.1, US-4.2
**Persona:** Marcus Delgado (PER-01)
**Trigger:** Marcus just finished a bottle and wants to mark it consumed + add a quick rating
**Entry Point:** Dashboard "Recently Consumed" section OR `/cellar` search
**Exit Point:** `/wines/[id]` — detail page showing new note at top of notes list

```
[Dashboard /] or [Search /cellar]
    │
    ▼  Find the wine (recently consumed shortcut or text search)
[Wine Detail /wines/[id]]
    │
    ▼  Tap "−" (decrement) button
[Remove a Bottle — Bottom Sheet Modal]
    │
    ├── Select event type (required):
    │       [Consumed]  [Gifted]  [Opened]
    │       │
    │       ├── Optional: type note (500 char, with counter)
    │       │
    │       └── Tap "Confirm Removal"
    │               │
    │               ├── PATCH /api/wines/[id]/quantity { delta: -1, event_type: "Consumed" }
    │               │
    │               ▼  (event_type = Consumed or Gifted)
    │       [Post-consume prompt: "Add a tasting note?"]
    │               │
    │               ├── Tap "Yes" → Navigate to /wines/[id]/notes/new
    │               │       │
    │               │       ▼
    │               │   [Tasting Note Form]
    │               │       │
    │               │       ├── Rate (star widget) — first prominent field
    │               │       ├── Fill optional text fields (appearance/aroma/flavor/finish)
    │               │       ├── Select occasion, would-buy-again
    │               │       └── Tap "Save Note"
    │               │               │
    │               │               ▼
    │               │           POST /api/wines/[id]/notes
    │               │               │
    │               │               └── 201 → Redirect to /wines/[id]#notes
    │               │                       [New note appears at top]
    │               │
    │               └── Tap "Skip" → Dismiss, stay on /wines/[id]
    │
    └── (event_type = Opened) → No tasting note prompt. Return to /wines/[id]
```

**Steps:**
1. **Locate wine:** Dashboard "Recently Consumed" for last-used wines; or search in `/cellar` (debounced 150ms). Session state preserved.
2. **Tap "−":** Decrement button on wine card or detail page. If quantity = 0, button is disabled (greyed, aria-disabled).
3. **Bottom sheet modal appears:** Slides up from bottom. Three large tap-target buttons: Consumed / Gifted / Opened. Optional notes textarea below (500 char counter visible). Cancel link at bottom.
4. **Event type selection required:** "Confirm Removal" button is disabled until one event type is selected (grey/inactive state). On selection, button activates (Gold).
5. **Confirm:** API call fires. Quantity updates optimistically. Modal closes.
6. **Post-consume prompt (Consumed/Gifted only):** Inline prompt on detail page — not a full modal — slides in below quantity display. "Would you like to add a tasting note?" + "Yes" (Gold) + "Skip" (text link).
7. **Tasting note form:** Opens at `/wines/[id]/notes/new`. `tasted_on` pre-filled to today. Rating widget is the first, most prominent field (above all text fields). All text fields optional.
8. **Save and return:** Note appears at top of tasting notes list on `/wines/[id]`. Green toast: "Tasting note saved!"

**Key Moments:**
- Bottom sheet (not full-page modal) keeps context visible — lighter cognitive load for a routine action
- Event type button must be selected before Confirm activates — prevents accidental submission
- Post-consume prompt must NOT navigate away — inline prompt on current page
- Note form: rating is first field, everything else optional — enables 2-tap note (rate + save)
- Data loss on navigation is the #1 abandonment risk for Claire — form state preserved in sessionStorage
---

## Flow 03: Filter Cellar by Location + Readiness (JRN-02.1)

**User Story:** US-3.1, US-3.2, US-3.3, US-3.4, US-5.3
**Persona:** Claire Fontaine (PER-02)
**Trigger:** Sunday morning planning — Claire wants Hold wines in Basement Rack A, then Approaching Peak in Eurocave
**Entry Point:** `/` dashboard → "Cellar" nav tab
**Exit Point:** App closed with filter state preserved in sessionStorage

```
[Dashboard /]
    │
    ▼  Tap "Cellar" tab
[Cellar List /cellar]
    │
    ├── Wine list loads (GET /api/wines, client-side hydration)
    │
    ▼  Tap "Filter" button (collapsed panel)
[Filter Panel — slide in / expand]
    │
    ├── Location dimension → select "Basement Rack A"
    │       ├── Active filter chip appears: [Basement Rack A ✕]
    │       └── List narrows immediately (OR within dimension, AND across)
    │
    ├── Readiness dimension → select "Hold"
    │       ├── Active filter chip appears: [Hold ✕]
    │       └── List narrows: Location=Basement Rack A AND Readiness=Hold
    │
    ├── Review list (22 wines on Hold in Rack A)
    │
    ├── Change Location → deselect "Basement Rack A", select "Eurocave"
    │       └── List updates: Location=Eurocave AND Readiness=Hold
    │
    ├── Change Readiness → deselect "Hold", select "Approaching Peak"
    │       └── List updates: Location=Eurocave AND Readiness=Approaching Peak
    │
    ├── Tap ✕ on Readiness chip → only Location filter remains
    │       └── Or tap "Clear All" → all chips removed, full list restored
    │
    └── Navigate to /wines/[id] and Back → session state restored exactly
            (swa_cellar_filters + swa_cellar_sort + swa_cellar_search from sessionStorage)
```

**Steps:**
1. **Navigate to `/cellar`:** Wine list loads from GET /api/wines. Default sort: Name A–Z. Search bar prominent at top.
2. **Open filter panel:** Tapping "Filter" button expands a panel (desktop: sidebar; mobile: bottom drawer). Filter dimensions visible with option counts from current collection.
3. **Apply Location filter:** Tap "Basement Rack A" checkbox. Chip appears in Active Filters row. List narrows instantly (client-side, <200ms for 300 wines).
4. **Apply Readiness filter:** Tap "Hold" checkbox. Second chip appears. Both chips active simultaneously. List = Location AND Readiness intersection.
5. **Independent chip dismissal:** Tap ✕ on one chip removes only that filter — the other remains. Chips do NOT interact or reset each other.
6. **Edit filters without clearing:** Each dimension is independently editable. Changing location selection updates without clearing readiness.
7. **Result count updates live:** "Showing 22 of 89 wines" updates after each filter change.
8. **Session persistence:** All state written to sessionStorage. Navigating to detail page and Back restores exact context. No server round-trip.

**Key Moments:**
- Filter chips MUST stack — losing one when adding another is a trust-breaking bug
- Filter result must appear in <200ms for 300 wines (client-side — no server call)
- Sort dropdown always visible alongside filter (not hidden inside the filter panel)
- "Clear All" must be prominently placed — one tap to reset completely
- Back-navigation from wine detail must restore ALL state (search + filters + sort + scroll position)
---

## Flow 04: Location Management + Audit (JRN-02.3, US-2.1–2.4)

**User Story:** US-2.1, US-2.2, US-2.3, US-2.4
**Persona:** Claire Fontaine (PER-02)
**Trigger:** Claire receives a new case and needs to split it across locations; then audits counts
**Entry Point:** `/locations` (from nav) or FAB on locations page
**Exit Point:** `/` dashboard after verifying updated bottle totals

```
[Locations /locations]
    │
    ├── Location list loads: name, wine_count, action buttons
    │
    ▼  Scroll to "Add Location" form (or inline at top)
[Add Location input]
    │
    ├── Type name → POST /api/locations
    │       ├── 201: New row appears in list, wine_count = 0
    │       └── 409 (duplicate): Inline error "A location with that name already exists."
    │
    ▼  [Rename flow]
    ├── Tap "Rename" on a row → inline edit field replaces name text
    │       ├── Type new name → confirm → PUT /api/locations/[id]
    │       │       └── 200: Name updates in list (and on all wine records via FK)
    │       └── Tap "Cancel" → inline edit collapses, original name restored
    │
    ▼  [Delete flow]
    ├── Tap "Delete" on a row → Confirmation modal
    │       ├── 0 wines: "Delete '[name]'? This cannot be undone."
    │       ├── N wines: "Delete '[name]'? [N] wine(s) will be marked 'Location Unknown'."
    │       ├── Confirm → DELETE /api/locations/[id] → 204
    │       │       └── Row removed; affected wines show "Location Unknown"
    │       └── Cancel → modal closes, no change
    │
    ▼  [Drill-through to filtered cellar]
    ├── Tap location name (or wine_count link) → /cellar?pre-filter=location:[name]
    │       └── Cellar loads with Location chip pre-applied: [Basement Rack A ✕]
    │
    └── Navigate to / → dashboard shows updated total bottles (live DB query)
```

**Steps:**
1. **View list:** Locations listed alphabetically. Each row: name, wine count (e.g., "89 wines"), Rename button, Delete button. Empty state if none: "No storage locations yet. Add your first location below."
2. **Add location:** Inline form at top of the list — input + "Add" button. Submit on Enter or button tap. New row inserts at correct alphabetical position.
3. **Rename:** Tapping "Rename" replaces the name text with an inline input field. ESC or "Cancel" link aborts. Enter or "Save" confirms. Same uniqueness rules as create.
4. **Delete (no wines):** Simple confirmation. Single line modal, two buttons: "Delete" (destructive red) + "Cancel".
5. **Delete (wines assigned):** Warning modal with count. Two buttons. On confirm, wines get `location_id = NULL`; they now show "Location Unknown" on detail and list views.
6. **Drill-through:** Tapping the wine count number or location name navigates to `/cellar` with that location pre-filtered. Active filter chip visible immediately on the cellar list.
7. **Dashboard verification:** Back to `/` shows updated stats from live SQL query.

**Key Moments:**
- Inline rename (not a modal) keeps the location list in view — faster for a multi-location audit
- Wine count must be a tappable link to the filtered cellar — one-tap drill-through is the "aha" moment for Claire
- Delete confirmation modal content changes based on wine count — users must understand the consequence
- "Location Unknown" must be visibly surfaced on wine cards and detail pages after deletion (not silent)
---

## Screen 00: Dashboard (`/`)

**Purpose:** Universal entry point — answers "What's ready to drink?" (Marcus) and "What's my collection state?" (Claire). Server-rendered for instant load.
**User Stories:** US-6.1, US-6.2, US-6.3, US-6.4, US-5.2
**Features:** F5, F6

---

### Layout (Mobile 375px)

```
┌──────────────────────────────────────┐
│  SimpleWineApp            [+ Add]    │  ← Header bar (#0A0A0A bg)
├──────────────────────────────────────┤
│                                      │
│  ┌─────────┐  ┌─────────┐           │
│  │ 47      │  │ 23      │           │  ← Stat tiles row 1
│  │ BOTTLES │  │ WINES   │           │    (tap → /cellar, no filter)
│  └─────────┘  └─────────┘           │
│                                      │
│  ┌─────────┐  ┌─────────┐           │
│  │ 8       │  │ 5       │           │  ← Stat tiles row 2
│  │ DRINK   │  │ APPROACHING│         │    (tap → /cellar?readiness=X)
│  │ NOW     │  │ PEAK    │           │
│  └─────────┘  └─────────┘           │
│                                      │
│  ── DRINK NOW ──────────────────── ▶ │  ← Section header
│  ┌───────┐ ┌───────┐ ┌───────┐      │
│  │Rioja  │ │Barolo │ │Chardo │...   │  ← Horizontal scroll shelf
│  │★★★★☆ │ │★★★★★ │ │★★★☆☆ │      │    (swipe → more cards)
│  │[badge]│ │[badge]│ │[badge]│      │
│  └───────┘ └───────┘ └───────┘      │
│                                      │
│  ── COLLECTION BREAKDOWN ──────────  │
│                                      │
│  WINE TYPE                           │  ← Bar list
│  Red      ████████ 28  (14 wines)    │
│  White    ████     12  (6 wines)     │
│  Sparkling██       4   (2 wines)     │
│                                      │
│  COUNTRY / REGION  (top 10)          │
│  France   ████████ 10 wines →        │
│  Italy    █████    6 wines  →        │
│  USA      ████     5 wines  →        │
│                                      │
│  VINTAGE DECADE                      │
│  2020s    ██████   8 wines           │
│  2010s    ████████ 11 wines          │
│  2000s    ████     5 wines           │
│                                      │
│  ── RECENTLY ADDED ────────────────  │
│  Opus One 2019          Jan 10 →    │
│  Côtes du Rhône 2022    Jan 8  →    │
│  ...                                 │
│                                      │
│  ── RECENTLY CONSUMED ─────────────  │
│  Grenache 2018 · Consumed  Dec 25 → │
│  Barolo 2012   · Gifted    Dec 20 → │
│                                      │
│  ── HIGHEST RATED ─────────────────  │
│  Opus One 2019    ★★★★★    96 →    │
│  Margaux 2015     ★★★★☆    88 →    │
│                                      │
├──────────────────────────────────────┤
│  [Dashboard]  [Cellar]  [Locations]  │  ← Bottom nav
└──────────────────────────────────────┘
```

---

### Layout (Desktop 1024px+)

```
┌──────────────────────────────────────────────────────────────────┐
│  🍷 SimpleWineApp  │  Dashboard  Cellar  Locations  │ [+Add Wine] │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │  47      │ │  23      │ │   8      │ │   5      │           │
│  │ BOTTLES  │ │ WINES    │ │ DRINK NOW│ │ APPROACH.│           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                                                  │
│  DRINK NOW SHELF ──────────────────────────────────────────────  │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │
│  │Rioja   │ │Barolo  │ │Chardon.│ │Merlot  │ │Riesling│ ...   │
│  │Producer│ │Produc. │ │Produc. │ │Produc. │ │Produc. │       │
│  │2018    │ │2012    │ │2020    │ │2019    │ │2015    │       │
│  │★★★★☆  │ │★★★★★  │ │★★★☆☆  │ │——      │ │★★★★☆  │       │
│  │DRINK NOW│ │DRINK NOW│ │DRINK NOW│ │DRINK NOW│ │DRINK NOW│   │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘       │
│                                                                  │
│  ┌─────────────────────┐  ┌─────────────────────┐              │
│  │ COLLECTION BREAKDOWN│  │ RECENTLY ADDED       │             │
│  │                     │  │ Opus One 2019   →    │             │
│  │ Wine Type           │  │ Côtes du Rhône  →    │             │
│  │ Red    ████ 28      │  │ ...                  │             │
│  │ White  ██   12      │  ├─────────────────────┤             │
│  │                     │  │ RECENTLY CONSUMED    │             │
│  │ Country / Region    │  │ Grenache · Consumed →│             │
│  │ France  ██████ 10   │  │ Barolo · Gifted    → │             │
│  │ Italy   ████   6    │  ├─────────────────────┤             │
│  │                     │  │ HIGHEST RATED        │             │
│  │ Vintage Decade      │  │ Opus One  ★★★★★  →  │             │
│  │ 2020s  ████   8     │  │ Margaux   ★★★★☆  →  │             │
│  │ 2010s  ███████ 11   │  └─────────────────────┘             │
│  └─────────────────────┘                                        │
└──────────────────────────────────────────────────────────────────┘
```

---

### Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Drink Now count + Drink Now shelf | Above fold, visible at 375px |
| Primary | Approaching Peak count | Stat tile row 2 |
| Secondary | Total Bottles, Unique Wines | Stat tile row 1 |
| Secondary | Collection Breakdowns | Below shelf (scroll) |
| Tertiary | Recently Added, Consumed, Highest Rated | Bottom of page |

---

### Stat Tile Design

```
┌─────────────────┐
│                 │
│   47            │  ← Large number: Montserrat 900, 36px
│                 │
│   TOTAL BOTTLES │  ← JetBrains Mono uppercase, 11px, #9CA3AF
│                 │
└─────────────────┘
```

- Tile: Bone `#FAFAF7` bg, 1px `#E5E7EB` border, 8px padding, 2px radius
- Drink Now tile: `#10B981` left accent border (4px), number in `#10B981`
- Approaching Peak tile: `#F59E0B` left accent border, number in `#F59E0B`
- All tiles are tappable links — full tile is the tap target

---

### Drink Now Shelf Card Design

```
┌────────────────┐
│ Rioja Gran     │  ← name: Open Sans 14px bold, truncate 1 line
│ Reserva        │
│ Marqués 2018   │  ← producer + vintage: Open Sans 12px #6B7280
│                │
│ ★★★★☆         │  ← Stars: Gold #FBCA5C on #0A0A0A, or hidden if no rating
│                │
│ [DRINK NOW]    │  ← Badge pill: #10B981 bg, white text, JetBrains Mono
└────────────────┘
```

- Card: 160px wide × 120px tall, Bone bg, 1px border, 2px radius, 8px padding
- 8px gap between cards
- Horizontal scroll container with `-webkit-overflow-scrolling: touch`
- Peek: at 375px, 2.5 cards visible (last card partially visible = scroll signal)
- Empty state: "No wines are ready to drink right now." (centered, muted text)

---

### Collection Breakdown — Bar List Design

Each breakdown row:
```
Red    ████████████░░░░  28 bottles  (14 wines) →
```
- Bar: `#FBCA5C` fill on `#E5E7EB` track, height 8px
- Row is a tappable link → `/cellar` with that dimension pre-filtered
- Country rows link to `/cellar?filter=country:[name]`
- Decade rows link to `/cellar?filter=vintage_range:[start]-[end]`

---

### States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Default (data loaded) | All sections populated | N/A |
| Empty collection (0 wines) | Stat tiles show 0; shelf shows empty message; breakdowns hidden | "No wines added yet. [Add your first wine →]" in Recently Added |
| Drink Now shelf empty | Section shows "No wines are ready to drink right now." | Muted text, no shelf cards |
| Recently Consumed empty | "No consumption events recorded yet." | |
| Highest Rated empty | "Add tasting notes and ratings to see your top wines here." | |
| DB error | Toast: "Could not load dashboard. Please try again." | Retry button |

---

### Interactive Elements

| Element | Type | Behavior |
|---------|------|----------|
| Stat tile (any) | Tappable card | Navigate to /cellar with filter pre-applied |
| Drink Now shelf card | Tappable card | Navigate to /wines/[id] |
| Breakdown bar row | Tappable row | Navigate to /cellar with dimension filter pre-applied |
| Recently Added item | Tappable row | Navigate to /wines/[id] |
| Recently Consumed item | Tappable row | Navigate to /wines/[id] |
| Highest Rated item | Tappable row | Navigate to /wines/[id] |
| "+ Add Wine" button | Primary CTA | Navigate to /wines/new |
| "Add your first wine →" | Text link | Navigate to /wines/new |
---

## Screen 01: Collection List (`/cellar`)

**Purpose:** Browse, search, filter, and sort the full wine collection. Primary discovery surface.
**User Stories:** US-3.1, US-3.2, US-3.3, US-3.4, US-1.1, US-5.2
**Features:** F1, F3, F5

---

### Layout (Mobile 375px)

```
┌──────────────────────────────────────┐
│  My Cellar              [Filter] [⇅] │  ← Header
├──────────────────────────────────────┤
│  ┌────────────────────────────────┐  │
│  │ 🔍  Search wines...            │  │  ← Search bar (debounced 150ms)
│  └────────────────────────────────┘  │
│                                      │
│  Active Filters:                     │  ← Only shown when filters active
│  [Basement Rack A ✕]  [Hold ✕]      │
│  [Clear All]                         │
│                                      │
│  Showing 22 of 89 wines · Sort: Name A–Z ▾ │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ Château Margaux                │  │  ← Wine card
│  │ Château Margaux · 2015 · Red   │  │
│  │ Basement Rack A                │  │
│  │                                │  │
│  │ [DRINK NOW]       ★★★★☆   3   │  │  ← Badge + rating + qty
│  │                           [−][+] │  │  ← Quantity controls
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ Opus One                       │  │
│  │ Opus One Winery · 2019 · Red   │  │
│  │ Temperature Locker             │  │
│  │                                │  │
│  │ [HOLD]            ——       2   │  │
│  │                           [−][+] │  │
│  └────────────────────────────────┘  │
│  ...                                 │
│                                      │
│  [No wines match your current        │  ← Empty filter result state
│   filters. Clear All Filters]        │    (shown instead of cards)
│                                      │
├──────────────────────────────────────┤
│  [Dashboard]  [Cellar]  [Locations]  │
└──────────────────────────────────────┘
```

---

### Layout (Desktop 1024px+) — Sidebar Filter

```
┌──────────────────────────────────────────────────────────────────┐
│  🍷 SimpleWineApp  │  Dashboard  Cellar  Locations  │ [+Add Wine] │
├────────────────────┬─────────────────────────────────────────────┤
│ FILTERS            │  🔍 Search wines...         Sort: Name A–Z ▾│
│                    │ ─────────────────────────────────────────── │
│ WINE TYPE          │  Active Filters: [Basement Rack A ✕][Hold ✕]│
│ ☐ Red (14)         │  Showing 22 of 89 wines  [Clear All]         │
│ ☐ White (6)        │ ─────────────────────────────────────────── │
│ ☑ Sparkling (2)    │  ┌─────────────────────────────────────────┐│
│                    │  │ Château Margaux  · Château Margaux · 2015││
│ READINESS          │  │ Red · Basement Rack A · 3 bottles         ││
│ ☑ Hold             │  │ [DRINK NOW]  ★★★★☆          [−]  3  [+] ││
│ ☐ Drink Now        │  └─────────────────────────────────────────┘│
│ ☐ Approaching Peak │  ┌─────────────────────────────────────────┐│
│ ☐ Past Window      │  │ Opus One · Opus One Winery · 2019         ││
│ ☐ No Window Set    │  │ Red · Temperature Locker · 2 bottles      ││
│                    │  │ [HOLD]       ——             [−]  2  [+] ││
│ LOCATION           │  └─────────────────────────────────────────┘│
│ ☑ Basement Rack A  │  ...                                        │
│ ☐ Eurocave         │                                             │
│ ☐ Living Room Rack │                                             │
│                    │                                             │
│ COUNTRY / REGION   │                                             │
│ ☐ France (10)      │                                             │
│ ☐ Italy (6)        │                                             │
│ ☐ USA (5)          │                                             │
│                    │                                             │
│ VINTAGE YEAR       │                                             │
│ [2010]──────[2024] │                                             │  ← Range slider
│                    │                                             │
│ GRAPE VARIETY      │                                             │
│ ☐ Cab Sauv (8)     │                                             │
│ ☐ Pinot Noir (5)   │                                             │
│                    │                                             │
│ RATING (min)       │                                             │
│ ☐ ★★★★★ (2)       │                                             │
│ ☐ ★★★★☆ (8)       │                                             │
│ ☐ No rating (5)    │                                             │
│                    │                                             │
│ [Clear All Filters]│                                             │
└────────────────────┴─────────────────────────────────────────────┘
```

---

### Wine Card Design

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│  Château Margaux                       [DRINK NOW]   │
│  Château Margaux · 2015 · Red                        │
│  📍 Basement Rack A                                  │
│                                                      │
│  ★★★★☆                               [−]  3  [+]   │
│                                                      │
└──────────────────────────────────────────────────────┘
```

- Card background: Bone `#FAFAF7`
- 1px border `#E5E7EB`; 2px radius; 12px padding; 8px gap between cards
- Wine name: Open Sans Bold 16px, `#0A0A0A` — tappable (links to `/wines/[id]`)
- Producer · Vintage · Type: Open Sans 13px, `#6B7280`
- Location: Open Sans 12px, `#9CA3AF`, with map pin icon
- Badge: pill shape, 2px radius, JetBrains Mono uppercase 10px
- Rating: Gold stars if rated; "—" if no notes
- Quantity controls: [−] digit [+] in a row; buttons 36px × 36px min touch target
- "Cellar Empty" badge replaces readiness badge when qty = 0; [−] disabled

**Cellar Empty card state:**
```
┌──────────────────────────────────────────────────────┐
│  Merlot Reserve                     [CELLAR EMPTY]   │
│  Some Winery · 2017 · Red                            │
│  📍 Wine Fridge                                      │
│                                                      │
│  ★★★★☆                               [−]  0  [+]   │
│                             ↑ disabled (grey, aria-disabled)
└──────────────────────────────────────────────────────┘
```

---

### Filter Panel (Mobile — Bottom Drawer)

```
┌──────────────────────────────────────┐
│  ─────── (drag handle)               │
│  FILTER BY                     [✕]   │
│ ────────────────────────────────── │
│  WINE TYPE                           │
│  ☐ Red (14)    ☐ White (6)          │
│  ☐ Rosé (2)    ☐ Sparkling (3)      │
│  ☐ Dessert (1)                       │
│                                      │
│  READINESS                           │
│  ☐ Drink Now (8)  ☐ Hold (22)       │
│  ☐ Approaching Peak (5)             │
│  ☐ Past Window (3)                   │
│  ☐ No Window Set (12)               │
│                                      │
│  STORAGE LOCATION                    │
│  ☐ Basement Rack A (34)             │
│  ☐ Eurocave (21)                     │
│  ☐ Living Room Rack (18)            │
│  ☐ Location Unknown (3)             │
│                                      │
│  COUNTRY / REGION                    │
│  ☐ France (10)  ☐ Italy (6)         │
│  ☐ USA (5)                           │
│                                      │
│  VINTAGE YEAR                        │
│  [2010] ──────────────── [2024]      │
│                                      │
│  GRAPE VARIETY                       │
│  ☐ Cabernet Sauvignon (8)           │
│  ☐ Pinot Noir (5)                    │
│                                      │
│  RATING (minimum)                    │
│  ☐ ★★★★★  ☐ ★★★★☆  ☐ ★★★☆☆     │
│  ☐ No rating                         │
│                                      │
│  [Clear All]          [Done (22)]    │  ← Done shows result count
└──────────────────────────────────────┘
```

- Drawer: 90% screen height, slides up from bottom
- Drag handle at top for dismissal
- "Done (22)" button: Gold bg, Black text, shows live filtered count
- Closing drawer does NOT clear filters — chips persist in the Active Filters row

---

### Sort Dropdown

| Sort Label | Default? |
|-----------|----------|
| Name A–Z | ✓ Default |
| Name Z–A | |
| Vintage Newest | |
| Vintage Oldest | |
| Rating Highest | |
| Rating Lowest | |
| Quantity Most | |
| Quantity Fewest | |
| Recently Added | |
| Recently Consumed | |

Sort is applied client-side immediately on selection. Saved to `sessionStorage` key `swa_cellar_sort`.

---

### Active Filters Row

```
Active Filters:
[WINE TYPE: Red ✕]  [READINESS: Hold ✕]  [LOCATION: Basement Rack A ✕]
[Clear All]
```

- Chips: `#0A0A0A` bg, Gold `#FBCA5C` text, 2px radius, 24px height
- ✕ icon: 16px, tappable (44px touch target via padding)
- "Clear All": text link, `#EF4444` color (destructive action visual cue)
- Chips row is horizontally scrollable if many chips active
- Row only visible when ≥1 filter is active

---

### Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Search bar | Top of content area, sticky |
| Primary | Wine list (name, badge, rating) | Main area |
| Secondary | Active filter chips + result count | Below search bar |
| Secondary | Quantity controls on each card | Card bottom-right |
| Tertiary | Filter panel (collapsed by default) | Toggle button / sidebar |
| Tertiary | Sort dropdown | Alongside search bar |

---

### States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Default | Wine list, search empty, no filters | "Showing [N] of [N] wines" |
| Search active | List filters in real-time (150ms debounce) | Result count updates |
| Filters active | Chips visible, list narrowed | "Showing [X] of [N] wines" |
| No results (filter/search) | Empty state in list area | "No wines match your current filters. [Clear All Filters]" |
| Empty collection | Empty state, no cards | "Your cellar is empty. [Add your first wine →]" |
| Quantity at max (9999) | [+] button disabled | Tooltip: "Maximum bottle count reached." |
| Quantity = 0 | [−] button disabled, Cellar Empty badge | [−] aria-disabled |
---

## Screen 02: Wine Detail (`/wines/[id]`)

**Purpose:** Complete record for a single wine — all fields, quantity controls, tasting notes, bottle history.
**User Stories:** US-0.3, US-0.4, US-0.5, US-1.1, US-1.2, US-1.3, US-1.4, US-4.3, US-5.2
**Features:** F0, F1, F4, F5

---

### Layout (Mobile 375px)

```
┌──────────────────────────────────────┐
│  ← Back to Cellar      [Edit] [···]  │  ← Sub-header: #0A0A0A bg
├──────────────────────────────────────┤
│                                      │
│  ┌────────────────────────────────┐  │
│  │  [DRINK NOW]              ★★★★☆ │  │  ← Hero section
│  │                                │  │
│  │  Château Margaux 2015          │  │  ← Name: Montserrat 900, 24px
│  │  Château Margaux               │  │  ← Producer: Open Sans 15px #6B7280
│  │                                │  │
│  │  Red · Bordeaux · France       │  │  ← Type · Region · Country
│  │  Cabernet Sauvignon Blend      │  │  ← Grape
│  │  750ml bottle                  │  │  ← Bottle size
│  │                                │  │
│  │  📍 Basement Rack A            │  │  ← Location (prominent)
│  │                                │  │
│  │  Quantity:  [−]  3  [+]        │  │  ← Quantity controls in hero
│  └────────────────────────────────┘  │
│                                      │
│  ── DRINKING WINDOW ───────────────  │
│  2025 — 2045                         │
│  [DRINK NOW] Ready now through 2045  │
│                                      │
│  ── PURCHASE DETAILS ──────────────  │
│  Purchased: 2022-06-15               │
│  From: Wine.com                      │
│  Price: $189.99 / bottle             │
│                                      │
│  ── GENERAL NOTES ─────────────────  │
│  Birthday gift. Exceptional vintage. │
│                                      │
│  ── TASTING NOTES ─────────────────  │
│  [+ Add Tasting Note]                │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ Dec 25, 2024         ★★★★☆   │  │  ← Most recent note first
│  │ [DINNER]  [WOULD BUY AGAIN ✓] │  │
│  │                                │  │
│  │ Appearance: Deep ruby, clear   │  │
│  │ Aroma: Black cherry, cedar...  │  │
│  │ Flavor: Full bodied, velvety...│  │
│  │ Finish: Long, 45+ seconds      │  │
│  │                                │  │
│  │ Guest feedback: Everyone loved │  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ Jun 10, 2023         ★★★★☆   │  │  ← Older note
│  │ [CASUAL]                       │  │
│  │ ...                            │  │
│  └────────────────────────────────┘  │
│                                      │
│  ── BOTTLE HISTORY ────────────────  │
│  ┌────────────────────────────────┐  │
│  │ Dec 25, 2024                   │  │
│  │ [CONSUMED]   Paired with lamb  │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ Mar 12, 2024                   │  │
│  │ [GIFTED]   Wedding gift        │  │
│  └────────────────────────────────┘  │
│                                      │
│  ── DANGER ZONE ───────────────────  │
│  [Delete Wine]                       │  ← Destructive action, bottom
│                                      │
├──────────────────────────────────────┤
│  [Dashboard]  [Cellar]  [Locations]  │
└──────────────────────────────────────┘
```

---

### Layout (Desktop 1024px+) — Two Column

```
┌──────────────────────────────────────────────────────────────────┐
│  🍷 SimpleWineApp  │  Dashboard  Cellar  Locations  │ [+Add Wine] │
├──────────────────────────────────────────────────────────────────┤
│  ← Back to Cellar                          [Edit Wine]  [Delete] │
├────────────────────────────┬─────────────────────────────────────┤
│                            │                                     │
│  [DRINK NOW]          ★★★★☆ │  TASTING NOTES        [+ Add Note] │
│                            │                                     │
│  Château Margaux 2015      │  Dec 25, 2024        ★★★★☆        │
│  Château Margaux           │  [DINNER]  [WOULD BUY AGAIN ✓]    │
│                            │                                     │
│  Red · Bordeaux · France   │  Appearance: Deep ruby, clear      │
│  Cab Sauvignon Blend       │  Aroma: Black cherry, cedar...     │
│  750ml                     │  Flavor: Full bodied, velvety      │
│                            │  Finish: Long, 45+ seconds         │
│  📍 Basement Rack A        │  Guest: Everyone loved it.         │
│                            │  ─────────────────────────────── │
│  Quantity: [−]  3  [+]    │  Jun 10, 2023        ★★★★☆       │
│                            │  [CASUAL]                          │
│  ─────────────────────── │  ...                               │
│  DRINKING WINDOW           │                                     │
│  2025 – 2045               │  ─────────────────────────────── │
│  Ready now through 2045    │  BOTTLE HISTORY                    │
│                            │                                     │
│  ─────────────────────── │  Dec 25, 2024  [CONSUMED]          │
│  PURCHASE DETAILS          │  Paired with lamb chops            │
│  2022-06-15 · Wine.com     │                                     │
│  $189.99 / bottle          │  Mar 12, 2024  [GIFTED]           │
│                            │  Wedding gift                      │
│  ─────────────────────── │                                     │
│  GENERAL NOTES             │                                     │
│  Birthday gift.            │                                     │
│  Exceptional vintage.      │                                     │
│                            │                                     │
└────────────────────────────┴─────────────────────────────────────┘
```

---

### Hero Section Detail

The hero section is the most critical — all key decision-making data is here, visible without scroll at 375px.

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│  [DRINK NOW]                              ★★★★☆    │
│                                                      │
│  Château Margaux 2015                                │
│  Château Margaux                                     │
│                                                      │
│  Red · Bordeaux · France                             │
│  Cabernet Sauvignon Blend · 750ml                    │
│                                                      │
│  📍  Basement Rack A                                 │
│                                                      │
│  Quantity                                            │
│  ┌─────┐         ┌─────┐                            │
│  │  −  │    3    │  +  │                            │
│  └─────┘         └─────┘                            │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Hero content rules:**
- Readiness badge: top-left of hero card
- Most recent rating: top-right of hero card
- Wine name: Montserrat 900, 24px (largest type on page)
- Producer: Open Sans 15px, `#6B7280`
- Location: always shown with map pin, Open Sans 14px Bold
- Quantity: [−] 44px button | 3-digit number | [+] 44px button
- Cellar Empty state: [CELLAR EMPTY] badge replaces readiness badge; [−] visually greyed + aria-disabled; [+] remains active
- Location Unknown state: "📍 Location Unknown" in `#EF4444` with "(please edit to assign a location)"

---

### Readiness Badge + Drinking Window Section

```
── DRINKING WINDOW ─────────────────────────────

2025 — 2045                          [DRINK NOW]

Ready to drink now through 2045.

Vintage: 2015  |  10 years in cellar
```

- If no window set: "No drinking window set. [Edit wine to add one →]"
- Start-only: "Drink from 2025 onward (no end date set)"
- End-only: "Drink before 2045 (no start date set)"

---

### Tasting Notes Section

```
── TASTING NOTES ────────────────────────────────

                                  [+ Add Tasting Note]

┌──────────────────────────────────────────────────┐
│ December 25, 2024              ★★★★☆  (4/5)     │
│ [DINNER]   [✓ WOULD BUY AGAIN]                   │
│                                                  │
│ APPEARANCE                                       │
│ Deep ruby with violet rim, clear and brilliant   │
│                                                  │
│ AROMA                                            │
│ Black cherry, cedar, tobacco, hint of vanilla    │
│                                                  │
│ FLAVOR                                           │
│ Full bodied with velvety tannins, cassis...      │
│                                                  │
│ FINISH                                           │
│ Long and complex, 45+ second finish              │
│                                                  │
│ GUEST FEEDBACK                                   │
│ Everyone at the table was impressed.             │
└──────────────────────────────────────────────────┘
```

- Notes in reverse chronological order (newest first)
- Note card: Bone bg, 1px border, 8px padding, 2px radius
- Date: Open Sans Bold 14px
- Rating: stars + numeric (e.g., "★★★★☆ (4/5)" or "94/100") per user preference
- Would-buy-again: "✓ Would Buy Again" / "✗ Would Not Buy Again" / "? Maybe" — colored accordingly
- Occasion badge: pill, similar to event type badge
- Sensory fields (Appearance/Aroma/Flavor/Finish): JetBrains Mono uppercase label, Open Sans body
- Missing fields: not shown (section collapsed, not "N/A")
- Empty state: "No tasting notes yet. [Add a Tasting Note →]"

---

### Bottle History Section

```
── BOTTLE HISTORY ───────────────────────────────

December 25, 2024    [CONSUMED]
Paired with lamb chops — outstanding.

March 12, 2024       [GIFTED]
Wedding gift for the Andersons.

January 5, 2024      [OPENED]
New Year's Eve.
```

- Read-only (no edit/delete controls)
- Events in reverse chronological order
- Empty state: Section hidden entirely if no events (not "0 events")
- Event type badges: color-coded pills (Consumed=red, Gifted=purple, Opened=orange)
- Optional note shown in muted grey below badge

---

### Delete Wine Action

```
── ─────────────────────────────────────────── ──

  [Delete Wine]          ← Red text link, bottom of page

```

Tapping "Delete Wine" opens a confirmation modal:
```
┌─────────────────────────────────────────────────┐
│                                                 │
│  Delete Château Margaux 2015?                   │
│                                                 │
│  This cannot be undone. All tasting notes       │
│  and bottle events will also be deleted.        │
│                                                 │
│  [Cancel]              [Delete Permanently]     │
│                          ← Red bg, white text   │
└─────────────────────────────────────────────────┘
```

On confirm: DELETE /api/wines/[id] → 204 → redirect to /cellar

---

### 404 State

```
┌──────────────────────────────────────┐
│  ← Back to Cellar                    │
│                                      │
│  Wine not found.                     │
│                                      │
│  The wine you're looking for doesn't │
│  exist or has been deleted.          │
│                                      │
│  [View My Cellar]                    │
└──────────────────────────────────────┘
```

---

### Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Readiness badge, rating, name, producer, location, quantity controls | Hero section (above fold) |
| Primary | "+ Add Tasting Note" CTA | Top of Tasting Notes section |
| Secondary | Drinking window detail, vintage | Below hero |
| Secondary | Tasting notes list (newest first) | Middle of page |
| Secondary | Bottle history | Below tasting notes |
| Tertiary | Purchase details, general notes | Collapsed detail section |
| Tertiary | Delete wine | Bottom of page (out of accidental-tap zone) |

---

### States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Default | Full hero + sections populated | N/A |
| Cellar Empty (qty=0) | [CELLAR EMPTY] badge, [−] disabled | Cellar Empty badge visually distinct from readiness |
| Location Unknown | Red location text, edit prompt | "📍 Location Unknown — edit wine to assign a location" |
| No tasting notes | Empty state in section | "No tasting notes yet. [Add a Tasting Note →]" |
| No bottle history | Section hidden | (not shown) |
| No window set | Drinking window section shows guidance | "No drinking window set. [Edit wine to add one →]" |
| 404 | Not found page | "Wine not found." |
| Quantity increment loading | [+] shows spinner briefly | Optimistic update (quantity shown immediately) |
| Delete confirm modal | Modal overlay | Destructive action warning |

---

### Interactive Elements

| Element | Type | Behavior |
|---------|------|----------|
| "← Back to Cellar" | Link | Navigates back; restores sessionStorage filter state |
| [Edit] button / "Edit Wine" | Secondary CTA | Navigates to /wines/[id]/edit |
| [Delete] / "Delete Wine" | Destructive link | Opens confirmation modal |
| [−] quantity button | Action button | Opens "Remove a Bottle" bottom sheet |
| [+] quantity button | Action button | PATCH /api/wines/[id]/quantity {delta: +1} |
| "+ Add Tasting Note" | Primary CTA | Navigates to /wines/[id]/notes/new |
| "··· " overflow menu (mobile) | Menu button | Contains: Edit, Delete |
---

## Screen 03: Add / Edit Wine Form (`/wines/new` and `/wines/[id]/edit`)

**Purpose:** Create or edit a wine record. Mobile-first form with inline validation, scrollable on 375px with no horizontal overflow.
**User Stories:** US-0.1, US-0.2, US-0.4, US-5.1
**Features:** F0, F2, F5

---

### Layout (Mobile 375px) — `/wines/new`

```
┌──────────────────────────────────────┐
│  ← Cancel              Add Wine      │  ← Header: "Add Wine" or "Edit Wine"
├──────────────────────────────────────┤
│                                      │
│  ─── REQUIRED FIELDS ───────────────  │
│                                      │
│  WINE NAME *                         │
│  ┌────────────────────────────────┐  │
│  │ e.g. Château Margaux           │  │
│  └────────────────────────────────┘  │
│  ← inline error appears here        │
│                                      │
│  PRODUCER *                          │
│  ┌────────────────────────────────┐  │
│  │ e.g. Château Margaux           │  │
│  └────────────────────────────────┘  │
│                                      │
│  VINTAGE YEAR *                      │
│  ┌────────────────────────────────┐  │
│  │ e.g. 2019           (1900–2027)│  │  ← Numeric, range hint
│  └────────────────────────────────┘  │
│  ← "Vintage must be between 1900    │
│      and 2027." (on error)          │
│                                      │
│  WINE TYPE *                         │
│  ┌─────────────────────────────▾──┐  │
│  │ Select wine type...            │  │  ← Dropdown
│  └────────────────────────────────┘  │
│  Options: Red / White / Rosé /       │
│  Sparkling / Dessert / Fortified /   │
│  Orange / Other                      │
│                                      │
│  QUANTITY *                          │
│  ┌────────────────────────────────┐  │
│  │ 1                (1–9999)      │  │
│  └────────────────────────────────┘  │
│                                      │
│  STORAGE LOCATION *                  │
│  ┌─────────────────────────────▾──┐  │
│  │ Select a storage location...   │  │  ← Dropdown from /api/locations
│  └────────────────────────────────┘  │
│  ← "Selected storage location no   │
│      longer exists. Choose another."│
│                                      │
│  ─── OPTIONAL DETAILS ─────────────  │  ← Divider (collapsed by default on mobile)
│  [▸ Show optional fields]            │  ← Expand/collapse toggle
│                                      │
│  (when expanded:)                    │
│  GRAPE VARIETY                       │
│  ┌────────────────────────────────┐  │
│  │                                │  │
│  └────────────────────────────────┘  │
│                                      │
│  COUNTRY                             │
│  ┌────────────────────────────────┐  │
│  │                                │  │
│  └────────────────────────────────┘  │
│                                      │
│  REGION                              │
│  ┌────────────────────────────────┐  │
│  │                                │  │
│  └────────────────────────────────┘  │
│                                      │
│  BOTTLE SIZE                         │
│  ┌─────────────────────────────▾──┐  │
│  │ 750ml (standard)               │  │  ← Dropdown with suggestions
│  └────────────────────────────────┘  │
│  Options: 375ml / 750ml /            │
│  Magnum 1.5L / Double Magnum 3L /    │
│  Jeroboam 4.5L / (type your own)     │
│                                      │
│  PURCHASE DATE                       │
│  ┌────────────────────────────────┐  │
│  │ YYYY-MM-DD                     │  │  ← Date picker (allow today, not future)
│  └────────────────────────────────┘  │
│                                      │
│  PURCHASE SOURCE                     │
│  ┌────────────────────────────────┐  │
│  │ e.g. Wine.com                  │  │
│  └────────────────────────────────┘  │
│                                      │
│  PURCHASE PRICE (per bottle)         │
│  ┌────────────────────────────────┐  │
│  │ $ 0.00                         │  │  ← Numeric, 2dp, non-negative
│  └────────────────────────────────┘  │
│                                      │
│  DRINKING WINDOW                     │
│  Drink From (Year)     Drink Until   │
│  ┌──────────────┐  ┌──────────────┐ │
│  │ e.g. 2025    │  │ e.g. 2045    │ │  ← Two numeric fields, side by side
│  └──────────────┘  └──────────────┘ │
│  ← "Drinking window end year must   │
│      be ≥ start year." (on error)   │
│                                      │
│  GENERAL NOTES                       │
│  ┌────────────────────────────────┐  │
│  │                                │  │
│  │                                │  │  ← Textarea, advisory counter
│  │                             0/2000│  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │         Save Wine              │  │  ← Gold bg, Black text, 2px radius, uppercase
│  └────────────────────────────────┘  │
│                                      │
│  [Cancel] ← text link               │
│                                      │
└──────────────────────────────────────┘
```

---

### Edit Mode Differences (`/wines/[id]/edit`)

- Header reads "Edit Wine" with wine name as subtitle
- All fields pre-populated from existing wine record
- Storage location selector pre-selects current location
- **Location Unknown state:** If wine's location was deleted, selector shows "Location Unknown — please select a new location" in `#EF4444`, field highlighted with red border
- Save button reads "Save Changes"
- Additional "Cancel" returns to `/wines/[id]` (not `/`)

```
┌──────────────────────────────────────┐
│  ← Château Margaux      Edit Wine    │
├──────────────────────────────────────┤
│                                      │
│  STORAGE LOCATION *                  │
│  ┌─────────────────────────────▾──┐  │
│  │ ⚠ Location Unknown —          │  │  ← Red border + warning text
│  │   please select a new location│  │
│  └────────────────────────────────┘  │
│  "Location Unknown — please select   │
│   a new location."                  │
│                                      │
└──────────────────────────────────────┘
```

---

### Field Layout & Validation

#### Required Fields (marked with *)

| Field | Input Type | Validation | Error Message |
|-------|-----------|-----------|---------------|
| Wine Name * | Text (max 255) | Non-empty after trim | "[Field] is required." |
| Producer * | Text (max 255) | Non-empty after trim | "[Field] is required." |
| Vintage Year * | Number | Integer 1900–(current+1) | "Vintage must be between 1900 and [year]." |
| Wine Type * | Select dropdown | One of 8 allowed values | "Select a valid wine type." |
| Quantity * | Number | Integer 1–9999 | "Quantity must be between 1 and 9999." |
| Storage Location * | Select dropdown | Valid location_id | "Selected storage location no longer exists. Please choose another." |

#### Optional Fields

| Field | Input Type | Validation | Constraint |
|-------|-----------|-----------|-----------|
| Grape Variety | Text | Max 255 chars | Optional |
| Country | Text | Max 100 chars | Optional |
| Region | Text | Max 100 chars | Optional |
| Bottle Size | Datalist/select | Max 50 chars | Optional; suggested values |
| Purchase Date | Date | Valid date, not future | Optional |
| Purchase Source | Text | Max 255 chars | Optional |
| Purchase Price | Number | ≥0, ≤2 decimal places, max 99999.99 | Optional |
| Drink From Year | Number | Integer ≥ 1900, ≤ 2100 | Optional |
| Drink Until Year | Number | Integer ≥ start year; ≥ 1900, ≤ 2100 | Optional; pair validation |
| General Notes | Textarea | Advisory 2000 chars (not enforced) | Optional |

---

### Inline Validation Behavior

- **Trigger:** On field blur (not on each keystroke for most fields)
- **Vintage:** Live validation on change (high-risk field on mobile — user gets instant feedback)
- **Drinking window:** Cross-field validation on End Year blur (if both fields have values)
- **Error display:** Red text below the input field (`#EF4444`), 12px Open Sans
- **Error icon:** Warning `⚠` prepended to error message
- **Field border:** `2px solid #EF4444` on invalid field
- **Submit blocked:** If any required field is empty or any field has validation error
- **Server errors (422):** Same inline display; field-level mapping from `fields` response object

```
VINTAGE YEAR *
┌────────────────────────────────┐
│ 1800                           │  ← Red border
└────────────────────────────────┘
⚠ Vintage must be between 1900 and 2027.   ← Red text, 12px
```

---

### No Locations Guidance State

When no storage locations exist (new user):
```
STORAGE LOCATION *
┌────────────────────────────────┐
│ (No locations available)       │  ← disabled dropdown
└────────────────────────────────┘
ℹ You haven't set up any storage locations yet.
  [Add your first storage location →]  ← links to /locations
```

The wine form can still be partially filled in. User is guided to create a location first.

---

### Optional Fields — Mobile Collapse/Expand

On mobile (375px):
- Required fields always visible
- Optional fields behind a toggle: "[▸ Show optional fields (10)]"
- Toggle expands all optional fields inline (not a new page)
- On Edit form: optional fields auto-expanded if any have values

On desktop (1024px+):
- All fields visible without toggle in a two-column layout
- Required fields in left column, optional in right column

---

### Desktop Layout (1024px+)

```
┌────────────────────────────────────────────────────────────┐
│  ← Cellar               Add Wine                           │
├─────────────────────────┬──────────────────────────────────┤
│                         │                                  │
│  REQUIRED FIELDS        │  OPTIONAL DETAILS                │
│                         │                                  │
│  WINE NAME *            │  GRAPE VARIETY                   │
│  [________________]     │  [________________]              │
│                         │                                  │
│  PRODUCER *             │  COUNTRY                         │
│  [________________]     │  [________________]              │
│                         │                                  │
│  VINTAGE YEAR *         │  REGION                          │
│  [________________]     │  [________________]              │
│                         │                                  │
│  WINE TYPE *            │  BOTTLE SIZE                     │
│  [▾ Select type    ]    │  [▾ 750ml          ]             │
│                         │                                  │
│  QUANTITY *             │  PURCHASE DATE                   │
│  [________________]     │  [________________]              │
│                         │                                  │
│  STORAGE LOCATION *     │  PURCHASE SOURCE                 │
│  [▾ Select location]    │  [________________]              │
│                         │                                  │
│                         │  PURCHASE PRICE                  │
│                         │  [$ _____________ ]              │
│                         │                                  │
│                         │  DRINKING WINDOW                 │
│                         │  From [______] Until [______]    │
│                         │                                  │
│                         │  GENERAL NOTES                   │
│                         │  [                           ]   │
│                         │  [                        0/2000]│
│                         │                                  │
│  [Save Wine]            │  [Cancel]                        │
└─────────────────────────┴──────────────────────────────────┘
```

---

### Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Required fields (name, producer, vintage, type, qty, location) | Top of form / left column |
| Primary | Save button | Bottom (mobile) / bottom-left (desktop) |
| Secondary | Validation errors (inline) | Adjacent to each field |
| Secondary | Drinking window fields | Optional section |
| Tertiary | Purchase details, general notes | Optional section |

---

### States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Default (clean) | Empty required fields, dropdowns with placeholders | N/A |
| Edit (pre-filled) | All fields populated with current values | N/A |
| Validation error (single field) | Red border + red error text below field | Error message |
| Validation error (submit) | All invalid fields highlighted simultaneously | Focus jumps to first error |
| Location Unknown (edit) | Red border on location field, warning text | "Location Unknown — please select a new location" |
| No locations (new) | Location dropdown disabled, guidance link | "Add your first storage location →" |
| Submitting | Save button shows spinner, disabled | Button text: "Saving..." |
| Success | Redirect to /wines/[id] | Green toast: "Wine added!" or "Changes saved!" |
| Server error (422) | Inline errors from server | Per-field error messages |
| Server error (500) | Toast | "Could not save wine. Please try again." |
---

## Screen 04: Tasting Note Form (`/wines/[id]/notes/new`)

**Purpose:** Add a structured tasting note with rating. Reachable directly or from post-consume flow. Form state preserved on navigation.
**User Stories:** US-4.1, US-4.2, US-4.3, US-4.4
**Features:** F4

---

### Layout (Mobile 375px)

```
┌──────────────────────────────────────┐
│  ← Château Margaux    Add Tasting Note │  ← Header with wine name
├──────────────────────────────────────┤
│                                      │
│  ─── RATING & DATE ─────────────────  │
│                                      │
│  TASTING DATE *                      │
│  ┌────────────────────────────────┐  │
│  │ 2026-06-05  (today)            │  │  ← Pre-filled to today; date picker
│  └────────────────────────────────┘  │
│  ← "Tasting date cannot be in the   │
│      future." (on error)            │
│                                      │
│  RATING                              │
│  ★ ★ ★ ★ ☆                         │  ← 5-star widget (interactive)
│  OR if 100-point preference:         │
│  ┌────────────────────────────────┐  │
│  │ 94                  (1–100)    │  │  ← Numeric input
│  └────────────────────────────────┘  │
│                                      │
│  [Switch to 100-point ↗]            │  ← Small toggle link; or "Switch to 5-star"
│                                      │
│  WOULD BUY AGAIN                     │
│  ┌──────┐ ┌──────┐ ┌───────┐       │
│  │ Yes  │ │  No  │ │ Maybe │       │  ← Button group (single-select toggle)
│  └──────┘ └──────┘ └───────┘       │
│                                      │
│  OCCASION                            │
│  ┌─────────────────────────────▾──┐  │
│  │ Select occasion...             │  │  ← Dropdown
│  └────────────────────────────────┘  │
│  Options: Dinner / Gift / Casual /   │
│  Celebration / Restaurant /          │
│  Tasting / Other                     │
│                                      │
│  ─── TASTING NOTES ─────────────────  │
│                                      │
│  APPEARANCE                          │
│  ┌────────────────────────────────┐  │
│  │                                │  │  ← Textarea, optional
│  │                             0/1000│ │
│  └────────────────────────────────┘  │
│                                      │
│  AROMA                               │
│  ┌────────────────────────────────┐  │
│  │                                │  │
│  │                             0/1000│ │
│  └────────────────────────────────┘  │
│                                      │
│  FLAVOR                              │
│  ┌────────────────────────────────┐  │
│  │                                │  │
│  │                             0/1000│ │
│  └────────────────────────────────┘  │
│                                      │
│  FINISH                              │
│  ┌────────────────────────────────┐  │
│  │                                │  │
│  │                             0/1000│ │
│  └────────────────────────────────┘  │
│                                      │
│  GUEST FEEDBACK                      │
│  ┌────────────────────────────────┐  │
│  │                                │  │  ← Textarea, optional
│  │                             0/2000│ │
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │         Save Note              │  │  ← Gold bg, Black text, 2px radius
│  └────────────────────────────────┘  │
│                                      │
│  [Cancel] ← text link               │
│                                      │
└──────────────────────────────────────┘
```

---

### Rating Widget — 5-Star Mode

```
RATING
┌───────────────────────────────────────┐
│                                       │
│   ☆  ☆  ☆  ☆  ☆                    │  ← Unselected (empty state)
│                                       │
│   ★  ★  ★  ★  ☆                    │  ← 4 stars selected
│                                       │
└───────────────────────────────────────┘
```

- Stars: 40px × 40px touch target each
- Gold `#FBCA5C` fill for selected stars
- Muted `#D1D5DB` for empty stars
- Tap to select; tap same star again to clear rating
- Keyboard: left/right arrows to change value, spacebar to set
- ARIA: `role="radiogroup"` with 5 `role="radio"` elements

---

### Rating Widget — 100-Point Mode

```
RATING
┌─────────────────┐
│  94       /100  │  ← Number input
└─────────────────┘
⚠ Rating must be between 1 and 100.    ← On error
```

- Large touch-friendly number input
- Numeric keyboard on mobile
- Range displayed as hint text: "(1–100)"
- Toggle link below: "Switch to 5-star ↗"

---

### Rating Scale Toggle

The scale preference is a user setting (`user_settings.rating_scale`). The toggle:
- Lives below the rating widget as a small text link
- Text: "Switch to 100-point ↗" or "Switch to 5-star ↗"
- Tapping calls PATCH /api/settings and re-renders the rating widget immediately
- Previously entered rating value converted (e.g., 4 stars → 80 points) without data loss
- Visual: `#6B7280` link text, 12px Open Sans

---

### Would Buy Again — Button Group

```
WOULD BUY AGAIN
┌─────────┐  ┌─────────┐  ┌──────────┐
│   Yes   │  │   No    │  │  Maybe   │
└─────────┘  └─────────┘  └──────────┘
```

- Unselected: Bone bg, `#0A0A0A` border, `#0A0A0A` text
- Selected "Yes": `#10B981` bg, white text (green = positive)
- Selected "No": `#EF4444` bg, white text (red = negative)
- Selected "Maybe": `#F59E0B` bg, white text (amber = uncertain)
- 44px min height, buttons fill equal width across row
- Not required — user can skip selection

---

### Sensory Fields Design

Each of the four sensory fields (Appearance, Aroma, Flavor, Finish) follows the same pattern:

```
APPEARANCE                             ← JetBrains Mono uppercase, 11px, #9CA3AF
┌──────────────────────────────────┐
│ Deep ruby with violet rim...     │  ← Open Sans 14px
│                                  │
│                              68/ │
│                            1000  │  ← Character counter (right-aligned)
└──────────────────────────────────┘
```

- Textarea: auto-grows with content
- Character counter: shown from 0, turns `#EF4444` if over limit
- All sensory fields optional — no validation error if empty
- Fields are independently focusable (separate textareas, not one large blob)
- Vertical order: Appearance → Aroma → Flavor → Finish (logical tasting progression)

---

### Form State Preservation

Critical for Claire's use case (accidental navigation mid-note):

- All field values written to `sessionStorage` on every input event (key: `swa_note_draft_[wine_id]`)
- On page load, check `sessionStorage` for existing draft — if found, pre-populate fields with a notice: "ℹ We restored your unsaved draft."
- On successful save, clear the draft from `sessionStorage`
- On explicit Cancel, prompt: "Discard your unsaved note?" → "Discard" / "Keep Editing"
- On browser back button: same prompt (beforeunload where supported)

```
ℹ We restored your unsaved draft from your last session.
  [Discard draft] — text link

```

---

### Post-Consume Flow Integration (US-4.2)

When navigating from the bottle removal flow:
- `tasted_on` is pre-filled to today (the day of consumption)
- Small contextual note below the header: "Adding note for consumed bottle"
- No other differences from the direct flow

---

### Desktop Layout (1024px+)

```
┌───────────────────────────────────────────────────────────────┐
│  ← Château Margaux                     Add Tasting Note       │
├──────────────────────┬────────────────────────────────────────┤
│                      │                                        │
│  TASTING DATE *      │  APPEARANCE                            │
│  [2026-06-05]        │  [                                ]    │
│                      │  [                            0/1000]  │
│  RATING              │                                        │
│  ★ ★ ★ ★ ☆         │  AROMA                                 │
│  [Switch to 100-pt]  │  [                                ]    │
│                      │  [                            0/1000]  │
│  WOULD BUY AGAIN     │                                        │
│  [Yes] [No] [Maybe]  │  FLAVOR                                │
│                      │  [                                ]    │
│  OCCASION            │  [                            0/1000]  │
│  [▾ Select...    ]   │                                        │
│                      │  FINISH                                │
│                      │  [                                ]    │
│                      │  [                            0/1000]  │
│                      │                                        │
│  [Save Note]         │  GUEST FEEDBACK                        │
│  [Cancel]            │  [                                ]    │
│                      │  [                            0/2000]  │
└──────────────────────┴────────────────────────────────────────┘
```

Left column: date, rating, disposition, occasion, actions
Right column: sensory fields (more space for text entry)

---

### Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Rating widget | Top of form, most prominent field |
| Primary | Tasting date | First field (required) |
| Primary | Save Note CTA | Bottom of left column / bottom of form |
| Secondary | Would Buy Again, Occasion | Below rating |
| Secondary | Appearance, Aroma, Flavor, Finish | Right column / main textarea section |
| Tertiary | Guest Feedback | Bottom of form |
| Tertiary | Rating scale toggle | Below rating widget |

---

### States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Default (new) | Date pre-filled today, rating empty, all text fields empty | N/A |
| Post-consume | Date pre-filled, contextual note shown | "Adding note for consumed bottle" |
| Draft restored | All fields populated from sessionStorage | "ℹ We restored your unsaved draft." |
| Tasting date in future | Red border + error below date field | "Tasting date cannot be in the future." |
| Rating out of range | Error below rating widget | "Rating must be between 1 and 5." / "...100." |
| Character limit exceeded | Counter turns red | No blocking — advisory only |
| Scale switch (in progress) | Rating widget re-renders with new scale | Value converted; no data loss |
| Submitting | Save button shows spinner, disabled | Button text: "Saving..." |
| Success | Redirect to /wines/[id]#notes | Green toast: "Tasting note saved!" |
| Server error | Toast | "Could not save tasting note. Please try again." |
| Cancel with unsaved data | Confirmation prompt | "Discard your unsaved note?" |

---

### Interactive Elements

| Element | Type | Behavior |
|---------|------|----------|
| Star rating widget | Interactive stars | Click to rate 1–5; click again to clear |
| Rating scale toggle | Text link | PATCH /api/settings; re-renders widget |
| Would Buy Again buttons | Toggle button group | Single-select; tap to select/deselect |
| Occasion dropdown | Select | One of 7 options |
| Tasting date input | Date picker | Native date input; restricts to today or earlier |
| Sensory textareas | Textarea | Auto-height; character counter |
| Save Note | Primary button | Client validate → POST /api/wines/[id]/notes |
| Cancel | Text link | Prompt if unsaved data; navigate to /wines/[id] |
---

## Screen 05: Storage Locations (`/locations`)

**Purpose:** Create, rename, and delete named storage locations. View wine counts per location. Drill through to a filtered cellar list.
**User Stories:** US-2.1, US-2.2, US-2.3, US-2.4
**Features:** F2

---

### Layout (Mobile 375px)

```
┌──────────────────────────────────────┐
│  Storage Locations                    │  ← Page title: Montserrat 900 20px
├──────────────────────────────────────┤
│                                      │
│  ─── ADD LOCATION ──────────────────  │
│  ┌───────────────────────┐ [Add]     │
│  │ Location name...      │           │  ← Inline form at top
│  └───────────────────────┘           │
│  ← "A location with that name       │
│      already exists." (on conflict) │
│                                      │
│  ─── YOUR LOCATIONS ────────────────  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ Basement Rack A                │  │  ← Location row: name (tappable link)
│  │ 34 wines →                     │  │    wine_count (tappable → filtered cellar)
│  │                    [Rename] [Delete]│
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ Eurocave                       │  │
│  │ 21 wines →                     │  │
│  │                    [Rename] [Delete]│
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ Living Room Rack               │  │
│  │ 18 wines →                     │  │
│  │                    [Rename] [Delete]│
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ Wine Fridge                    │  │
│  │ 0 wines                        │  │  ← 0 wines: no link, no arrow
│  │                    [Rename] [Delete]│
│  └────────────────────────────────┘  │
│                                      │
│  [Empty state when no locations:]    │
│  No storage locations yet.           │
│  Add your first location above.      │
│                                      │
├──────────────────────────────────────┤
│  [Dashboard]  [Cellar]  [Locations]  │
└──────────────────────────────────────┘
```

---

### Location Row — Normal State

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│  Basement Rack A                    [Rename] [Delete]│
│  34 wines →                                          │
│                                                      │
└──────────────────────────────────────────────────────┘
```

- Location name: Open Sans Bold 16px, `#0A0A0A`
- Wine count: Open Sans 13px, `#6B7280`, with "→" arrow — full row tappable to `/cellar?location=[name]`
- "0 wines" — no tappable link (nothing to filter to)
- [Rename]: secondary button, small (text, no bg, 2px radius, `#0A0A0A` border)
- [Delete]: destructive text link, `#EF4444`
- Row has 1px `#E5E7EB` bottom border

---

### Location Row — Rename Active State

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│  ┌──────────────────────────────┐  [Save] [Cancel]  │
│  │ Basement Rack A              │                   │
│  └──────────────────────────────┘                   │
│  ← "A location with that name already exists."      │
│                                                      │
└──────────────────────────────────────────────────────┘
```

- Tapping "Rename" replaces the static name with an inline edit field
- Field pre-filled with current name, cursor at end
- [Save]: Gold bg, Black text, 2px radius, 28px height
- [Cancel]: text link, dismisses without change
- Validation error appears below the inline input
- Pressing Enter submits; pressing Escape cancels
- On save: name updates in list; wine records reflect new name via FK

---

### Delete Confirmation Modal — 0 Wines

```
┌───────────────────────────────────────────┐
│                                           │
│  Delete "Wine Fridge"?                    │
│                                           │
│  This cannot be undone.                   │
│                                           │
│  ┌─────────┐              ┌──────────┐    │
│  │ Cancel  │              │  Delete  │    │
│  └─────────┘              └──────────┘    │
│                              ↑            │
│                         Red bg, white text│
└───────────────────────────────────────────┘
```

---

### Delete Confirmation Modal — N Wines Assigned

```
┌───────────────────────────────────────────┐
│                                           │
│  Delete "Basement Rack A"?                │
│                                           │
│  34 wine(s) will be marked               │
│  "Location Unknown".                      │
│  This cannot be undone.                   │
│                                           │
│  ┌─────────┐              ┌──────────┐    │
│  │ Cancel  │              │  Delete  │    │
│  └─────────┘              └──────────┘    │
└───────────────────────────────────────────┘
```

- Modal overlay: `rgba(0, 0, 0, 0.5)` scrim
- Modal: Bone bg, 8px radius (exception to 2px rule — modal corners), 24px padding
- Max width: 340px (fits 375px with 16px margin each side)
- [Cancel]: Bone bg, `#0A0A0A` border, `#0A0A0A` text
- [Delete]: `#EF4444` bg, white text, uppercase
- Focus trapped within modal while open (accessibility)
- Close on Cancel; close on backdrop click (optional)

---

### Add Location Form

```
─── ADD LOCATION ────────────────────────────────

┌─────────────────────────────────────┐  [Add]
│ e.g. Basement Rack A                │
└─────────────────────────────────────┘
← Max 100 characters
← "A location with that name already exists."
```

- Inline form (not a modal — stays on the same page)
- Input: Open Sans 14px, 44px height
- [Add] button: Gold bg, Black text, 2px radius, uppercase — same row as input
- Submit on Enter key
- On success: new row inserts at correct alphabetical position; input clears; success toast
- Empty name error: "Location name is required." (inline, below input)
- Duplicate name: "A location with that name already exists." (inline, `#EF4444`)

---

### Desktop Layout (1024px+)

```
┌──────────────────────────────────────────────────────────────────┐
│  🍷 SimpleWineApp  │  Dashboard  Cellar  Locations  │ [+Add Wine] │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Storage Locations                                               │
│                                                                  │
│  ┌──────────────────────────────────────┐  [Add]                │
│  │ Location name...                     │                        │
│  └──────────────────────────────────────┘                        │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Basement Rack A           34 wines →      [Rename]  [Delete] ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │ Eurocave                  21 wines →      [Rename]  [Delete] ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │ Living Room Rack          18 wines →      [Rename]  [Delete] ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │ Wine Fridge                0 wines        [Rename]  [Delete] ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

On desktop: table-like list with columns; Rename inline edit expands within the row.

---

### Drill-Through to Filtered Cellar

Tapping the wine count link ("34 wines →") navigates to:
`/cellar` with Location filter pre-applied (via URL param or sessionStorage pre-population)

On the cellar page:
- Active filter chip shows: [LOCATION: Basement Rack A ✕]
- Result count: "Showing 34 of 89 wines"
- User can add more filters without losing the location chip

---

### Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Location list with wine counts | Main content |
| Primary | Add Location form | Top of page (immediately actionable) |
| Secondary | Rename/Delete actions per row | Right side of each row |
| Secondary | Drill-through wine count links | Inline in each row |
| Tertiary | Empty state guidance | Only when no locations exist |

---

### States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Default (locations exist) | Alphabetical list | N/A |
| Empty (no locations) | Empty state message | "No storage locations yet. Add your first location above." |
| Add location: duplicate error | Red border + red text below input | "A location with that name already exists." |
| Add location: success | New row appears, input clears | Toast: "Location added!" |
| Rename active | Inline edit field replaces name | N/A |
| Rename: duplicate error | Red error below inline input | "A location with that name already exists." |
| Rename: success | Name updated in list | Toast: "Location renamed!" |
| Delete modal open | Modal overlay | Warning copy (with/without wine count) |
| Delete: success | Row removed from list | Toast: "Location deleted." |

---

### Interactive Elements

| Element | Type | Behavior |
|---------|------|----------|
| Location name (text) | Informational | Non-tappable label |
| Wine count "N wines →" | Tappable link | Navigate to /cellar with location filter |
| [Add] button | Primary action | POST /api/locations |
| [Rename] button | Secondary action | Toggle inline edit field |
| [Delete] button/link | Destructive | Open confirmation modal |
| [Save] in rename | Confirm action | PUT /api/locations/[id] |
| [Cancel] in rename | Abort | Restore original name |
| Delete modal [Cancel] | Modal action | Close modal, no change |
| Delete modal [Delete] | Destructive confirm | DELETE /api/locations/[id] → 204 |
---

## Y0: Interaction Patterns

---

### Pattern 1: Remove a Bottle — Bottom Sheet Modal

**When to use:** User taps [−] on a wine detail page or cellar card (quantity > 0)
**Components:** US-1.2, US-4.2

```
┌──────────────────────────────────────┐
│ ──────── (drag handle)               │
│                                      │
│  Remove a Bottle                     │  ← Montserrat 900 18px
│  Château Margaux 2015               │  ← Wine name in subheading
│                                      │
│  What happened to this bottle?       │
│                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────┐ │
│  │ Consumed │ │  Gifted  │ │Opened│ │  ← Event type buttons (required)
│  └──────────┘ └──────────┘ └──────┘ │
│  (no selection = all outline)        │
│  (selected = Gold bg, Black text)    │
│                                      │
│  NOTES (optional)                    │
│  ┌────────────────────────────────┐  │
│  │                                │  │
│  │                             0/500│ │
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │     Confirm Removal            │  │  ← Disabled (grey) until type selected
│  └────────────────────────────────┘  │
│                                      │
│  [Cancel]                            │  ← Text link, closes sheet
│                                      │
└──────────────────────────────────────┘
```

**Behavior:**
1. Sheet slides up from bottom (translateY animation, 200ms ease-out)
2. Background: `rgba(0,0,0,0.5)` scrim, non-scrollable
3. Event type: MUST select one before "Confirm Removal" becomes active
4. "Confirm Removal" disabled state: `#9CA3AF` bg, white text, not clickable
5. "Confirm Removal" active state: Gold `#FBCA5C` bg, `#0A0A0A` text
6. Tapping scrim or [Cancel]: closes sheet, no action
7. On confirm: PATCH request fires; sheet closes; quantity updates; tasting note prompt appears (Consumed/Gifted only)

---

### Pattern 2: Tasting Note Prompt (Post-Consume)

**When to use:** After Consumed or Gifted bottle event is confirmed
**User Story:** US-4.2

```
┌──────────────────────────────────────┐
│                                      │
│  🍷 Bottle marked as consumed!       │
│     Château Margaux 2015             │
│                                      │
│  Would you like to add a             │
│  tasting note?                       │
│                                      │
│  ┌──────────────┐  [Skip]           │
│  │  Add a Note  │                   │  ← "Add a Note": Gold, "Skip": text link
│  └──────────────┘                   │
│                                      │
└──────────────────────────────────────┘
```

**Behavior:**
- Appears inline below the quantity display on wine detail page (not a full modal)
- Slides in from below the quantity row (slideDown animation)
- "Add a Note": navigates to `/wines/[id]/notes/new`
- "Skip": dismisses the prompt (height collapses), page returns to normal state
- Prompt does NOT appear after an "Opened" event

---

### Pattern 3: Delete Confirmation Modal

**When to use:** User taps "Delete Wine" on wine detail, or "Delete" on a location row
**User Stories:** US-0.5, US-2.4

```
┌──────────────────────────────────────┐
│ ████████████████████████████████████ │  ← Scrim
│ ██  ┌────────────────────────┐  ████ │
│ ██  │                        │  ████ │
│ ██  │  Delete "Wine Name"?   │  ████ │  ← Title
│ ██  │                        │  ████ │
│ ██  │  This cannot be        │  ████ │
│ ██  │  undone. All tasting   │  ████ │
│ ██  │  notes and bottle      │  ████ │
│ ██  │  events will also be   │  ████ │
│ ██  │  deleted.              │  ████ │
│ ██  │                        │  ████ │
│ ██  │  [Cancel]  [Delete]    │  ████ │
│ ██  └────────────────────────┘  ████ │
└──────────────────────────────────────┘
```

**Behavior:**
- Modal: Bone bg, 16px radius (modal exception), 20px padding, max-width 340px
- [Cancel]: outline button, closes modal
- [Delete]: `#EF4444` bg, white text, uppercase
- Focus trapped in modal (Tab cycles between Cancel and Delete)
- ESC key closes modal (same as Cancel)
- Scrim click: does NOT close (prevents accidental dismissal of destructive action)
- On confirm: API call → success → redirect; toast on completion

---

### Pattern 4: Active Filter Chips

**When to use:** One or more filters active on `/cellar`
**User Story:** US-3.2, US-3.4

```
Active Filters:
┌────────────────────────┐
│ WINE TYPE: Red  ✕      │  │  LOCATION: Basement Rack A  ✕  │  │  READINESS: Hold  ✕  │
└────────────────────────┘
[Clear All]
```

**Chip design:**
- `#0A0A0A` background, `#FBCA5C` text (Gold on Black = 19.4:1 contrast — AAA)
- 2px radius, 8px horizontal padding, 24px height
- ✕ icon: 16px, 44px touch target (with padding)
- Chips row: horizontally scrollable (overflow-x: auto, scrollbar hidden)
- Order: stable (chips don't rearrange on add/remove)
- "Clear All": text link, `#EF4444`, always at end of row

**Behavior:**
- Tapping ✕ on a chip: removes that specific filter only; list re-renders
- "Clear All": removes all chips AND clears search text; resets sessionStorage keys
- Adding a new chip: appends to the end of the row; row scrolls to reveal new chip

---

### Pattern 5: Inline Validation

**When to use:** Form fields with validation rules (wine form, tasting note form, location form)
**User Stories:** US-0.2, US-5.1

```
VINTAGE YEAR *
┌────────────────────────────────┐
│ 1850                           │  ← Field with red border
└────────────────────────────────┘
⚠ Vintage must be between 1900 and 2027.
```

**Rules:**
- Trigger: on field blur (FocusOut event) for most fields
- Vintage and drinking window: validate on change (high-risk real-time feedback)
- Error: `#EF4444` text, 12px Open Sans, appears immediately below field
- Prepend `⚠` character to error message
- Field border changes to `2px solid #EF4444`
- On correction: error clears on next valid input (on Change after first error shown)
- Submit: validates all fields; focuses first error field; scrolls to it

---

### Pattern 6: Quantity Controls

**When to use:** On wine cards in `/cellar` and wine detail page
**User Stories:** US-1.1, US-1.2, US-1.4

```
Normal:          [−]   3   [+]
Cellar Empty:    [−]   0   [+]
                  ↑ disabled (greyed)
Max (9999):      [−]  9999 [+]
                              ↑ disabled
```

**Design:**
- [−] and [+]: 44px × 44px minimum touch target
- [−] button: `#0A0A0A` bg, white `−` text (when active)
- [+] button: `#0A0A0A` bg, white `+` text (when active)
- Disabled state: `#9CA3AF` bg, `#FFFFFF` text, `aria-disabled="true"`, `cursor: not-allowed`
- Quantity number: Open Sans Bold 18px, centered between buttons
- Optimistic UI: quantity updates immediately on [+]; modal gates [−]

---

### Pattern 7: Toast Notifications

**When to use:** After successful or failed API operations

**Success toast:**
```
┌─────────────────────────────────────────────┐
│ ✓  Wine added to your cellar!               │
└─────────────────────────────────────────────┘
```
- `#10B981` left border (4px), Bone bg
- Auto-dismiss after 4 seconds
- Position: top-center (mobile), top-right (desktop)
- Can be dismissed by tapping

**Error toast:**
```
┌─────────────────────────────────────────────┐
│ ✕  Could not save wine. [Retry]             │
└─────────────────────────────────────────────┘
```
- `#EF4444` left border (4px), Bone bg
- Does NOT auto-dismiss (user must act)
- [Retry] link re-triggers the failed action

---

### Pattern 8: Empty States

Each empty state pairs an explanation with a clear next action.

| Screen / Section | Empty State Copy | CTA |
|-----------------|-----------------|-----|
| `/cellar` (no wines) | "Your cellar is empty." | "[Add your first wine →]" |
| `/cellar` (no filter match) | "No wines match your current filters." | "[Clear All Filters]" |
| Dashboard — Drink Now shelf | "No wines are ready to drink right now." | (no CTA — informational) |
| Dashboard — Recently Added | "No wines added yet." | "[Add your first wine →]" |
| Dashboard — Recently Consumed | "No consumption events recorded yet." | (no CTA) |
| Dashboard — Highest Rated | "Add tasting notes and ratings to see your top wines here." | (no CTA) |
| Wine detail — Tasting Notes | "No tasting notes yet." | "[Add a Tasting Note →]" |
| Wine detail — Bottle History | (section hidden entirely) | N/A |
| `/locations` (no locations) | "No storage locations yet. Add your first location above." | (inline form is already present) |

**Empty state design:**
- Centered in the section area
- Muted text: `#9CA3AF`, Open Sans 14px italic
- CTA: standard Gold text link
- No illustrations in MVP (text-only empty states)
---

## Y1: Responsive Considerations

---

### Breakpoint System

| Breakpoint | Range | Primary layout |
|-----------|-------|----------------|
| Mobile | 375px – 767px | Single column; bottom tab nav; collapsed filter drawer |
| Tablet | 768px – 1023px | 2-column content; side-by-side form fields; top header |
| Desktop | 1024px+ | Full sidebar filter; 3-column dashboard; top header with CTA |

**Mobile-first approach:** All styles default to 375px. Media queries add layout complexity at larger breakpoints.

---

### Dashboard (`/`)

| Breakpoint | Layout |
|-----------|--------|
| Mobile (375px) | 2×2 stat tile grid; horizontal scroll Drink Now shelf (2.5 cards peek); breakdowns as stacked lists; recent activity as full-width rows |
| Tablet (768px) | 4 stat tiles in a row; shelf shows 4 cards; breakdowns in 2-column grid |
| Desktop (1024px) | 4 stat tiles; shelf shows 5+ cards; 2-column layout: breakdowns left, activity lists right |

**Drink Now shelf card widths:**
- Mobile: 160px (2.5 cards at 375px, 8px gaps)
- Tablet: 180px
- Desktop: 200px

**No horizontal scroll at any breakpoint** except for the intentional Drink Now shelf.

---

### Collection List (`/cellar`)

| Breakpoint | Layout |
|-----------|--------|
| Mobile (375px) | Full-width wine cards; filter in bottom drawer (90% height); sort in dropdown adjacent to search |
| Tablet (768px) | Full-width wine cards; filter panel as collapsible sidebar (240px); 2 wine cards per row |
| Desktop (1024px) | Persistent sidebar filter panel (280px); wine cards in 1–2 column grid; filter panel always visible (no toggle needed) |

**Wine card grid:**
- Mobile: 1 card per row
- Tablet: 2 cards per row (with sidebar open: 1 card; sidebar closed: 2 cards)
- Desktop: 2 cards per row alongside 280px sidebar

**Active filter chips row:**
- Mobile: horizontally scrollable, hidden scrollbar
- Desktop: wraps to multiple lines (max 2 lines, then "and N more" overflow)

**Search bar:**
- Mobile: full width, 44px height
- Desktop: 480px max width (doesn't span the full content area)

---

### Wine Detail (`/wines/[id]`)

| Breakpoint | Layout |
|-----------|--------|
| Mobile (375px) | Single column; hero section full-width; sections stacked vertically: hero → drinking window → purchase → tasting notes → bottle history |
| Tablet (768px) | Single column (wider); sections have more padding; tasting note cards side by side |
| Desktop (1024px) | 2-column: left (wine info + purchase + drinking window), right (tasting notes + bottle history); sticky left column while scrolling right |

**Quantity controls:**
- All breakpoints: 44px touch targets for [−] and [+] buttons

**Tasting note cards:**
- Mobile: full-width card, sensory fields stacked
- Desktop: 2-column card interior: (date + rating + disposition + occasion) left; (sensory fields + guest feedback) right

---

### Add / Edit Wine Form (`/wines/new`, `/wines/[id]/edit`)

| Breakpoint | Layout |
|-----------|--------|
| Mobile (375px) | Single column; required fields always visible; optional fields behind toggle; native select + date pickers |
| Tablet (768px) | Single column (wider); optional fields shown by default (no toggle) |
| Desktop (1024px) | 2-column: required fields left, optional fields right; both columns always visible; drinking window fields side by side (already 2-column even on tablet) |

**Form field heights:**
- All breakpoints: minimum 44px input height (WCAG touch target)

**Drinking window pair (Drink From / Drink Until):**
- Mobile: two fields side by side within the optional section (50% width each)
- Desktop: side by side within right column

**Save button:**
- Mobile: full width at bottom
- Desktop: left-aligned, natural content width

---

### Tasting Note Form (`/wines/[id]/notes/new`)

| Breakpoint | Layout |
|-----------|--------|
| Mobile (375px) | Single column; rating at top, then date, disposition, occasion; sensory fields stacked below |
| Tablet (768px) | Single column (wider); star rating slightly larger |
| Desktop (1024px) | 2-column: left (date, rating, disposition, occasion, actions); right (all 4 sensory fields + guest feedback) |

**Star rating widget:**
- Mobile: 44px × 44px stars (5 = 220px + gaps, fits 375px)
- Desktop: 48px × 48px stars

**Sensory textareas:**
- Mobile: 4 rows min height each
- Desktop: 6 rows min height each (more vertical space in right column)

---

### Storage Locations (`/locations`)

| Breakpoint | Layout |
|-----------|--------|
| Mobile (375px) | Single column; Add form full-width stacked above list; action buttons ([Rename] [Delete]) on right of each row |
| Tablet (768px) | Single column (wider); location name and count in same row |
| Desktop (1024px) | Table layout: columns for Name, Wine Count, Actions; wider rows |

**Rename inline edit:**
- Mobile: inline edit replaces the location name text in the same row; action buttons shift below
- Desktop: inline edit expands within the table row; Save/Cancel in the Actions column

---

### Navigation

| Breakpoint | Navigation type |
|-----------|----------------|
| Mobile (375px) | Bottom tab bar (56px fixed); FAB above tab bar (bottom-right) |
| Tablet (768px) | Top header navigation (horizontal links) |
| Desktop (1024px) | Top header navigation (horizontal links); "+ Add Wine" button in header |

**Bottom tab bar (mobile):**
- Height: 56px
- Safe area inset: respected via `padding-bottom: env(safe-area-inset-bottom)` for notched phones
- Tabs: Dashboard | Cellar | Locations
- FAB: 56px diameter circle, `#FBCA5C` bg, `#0A0A0A` icon, 4px above tab bar

**Top header (tablet/desktop):**
- Height: 56px
- `#0A0A0A` bg, Bone text
- Logo left, nav links center-right, CTA button right

---

### Touch Targets (All Breakpoints)

Minimum 44px × 44px for all interactive elements per WCAG 2.5.5 (AAA) and iOS HIG.

| Element | Minimum touch target |
|---------|---------------------|
| [−] and [+] quantity buttons | 44px × 44px |
| Star rating stars | 44px × 44px each |
| Filter chip ✕ | 44px × 44px (padding) |
| Rename / Delete buttons | 44px height |
| Bottom tab bar items | 56px height (full tab bar) |
| FAB | 56px × 56px |
| Card tap area | Full card surface |
| Form inputs | 44px height |

---

### No-Horizontal-Scroll Guarantee

At 375px, the following must produce zero horizontal overflow:
- All form fields (including side-by-side drinking window pair)
- All wine cards in the cellar list
- The hero section on wine detail
- The stat tile grid on dashboard
- All buttons and CTAs

**Implementation note:** Use `width: 100%` on all containers; avoid fixed-width elements that exceed viewport; use `box-sizing: border-box` universally; test with `overflow-x: hidden` on `body`.
---

## Y2: Accessibility Notes (WCAG 2.1 AA)

---

### Color Contrast Requirements

All foreground/background color pairs must meet WCAG 2.1 AA minimum: **4.5:1 for normal text**, **3:1 for large text (18px+ or 14px+ bold)** and UI components.

| Pairing | Foreground | Background | Ratio | Pass? |
|---------|-----------|-----------|-------|-------|
| Body text | `#0A0A0A` | `#FAFAF7` (Bone) | 19.9:1 | ✓ AAA |
| Muted text | `#6B7280` | `#FAFAF7` | 5.9:1 | ✓ AA |
| Very muted text | `#9CA3AF` | `#FAFAF7` | 3.9:1 | ✗ FAIL for normal text |
| Very muted text (large) | `#9CA3AF` | `#FAFAF7` | 3.9:1 | ✓ for 18px+ |
| Gold on Black | `#FBCA5C` | `#0A0A0A` | 9.8:1 | ✓ AAA |
| White on Black | `#FFFFFF` | `#0A0A0A` | 21:1 | ✓ AAA |
| White on Drink Now green | `#FFFFFF` | `#10B981` | 2.5:1 | ✗ FAIL |
| Black on Drink Now green | `#0A0A0A` | `#10B981` | 8.4:1 | ✓ AA |
| White on Hold blue | `#FFFFFF` | `#3B82F6` | 3.1:1 | ✓ AA (large text / UI) |
| Black on Approaching Peak amber | `#0A0A0A` | `#F59E0B` | 7.1:1 | ✓ AAA |
| White on Past Window grey | `#FFFFFF` | `#6B7280` | 3.0:1 | ✓ AA (large text / UI) |
| Black on No Window muted | `#0A0A0A` | `#9CA3AF` | 5.2:1 | ✓ AA |
| White on Consumed red | `#FFFFFF` | `#EF4444` | 3.9:1 | ✓ AA (large) |
| White on Gifted purple | `#FFFFFF` | `#8B5CF6` | 3.9:1 | ✓ AA (large) |
| Black on Opened orange | `#0A0A0A` | `#F97316` | 5.5:1 | ✓ AA |
| Error text | `#EF4444` | `#FAFAF7` | 4.5:1 | ✓ AA |
| Gold chip text | `#FBCA5C` | `#0A0A0A` | 9.8:1 | ✓ AAA |

**Action items:**
- Badge text for Drink Now: use **black `#0A0A0A`** (not white) — white fails on `#10B981`
- Badge text for Hold: use white with font size ≥14px bold (meets 3:1 for UI components)
- `#9CA3AF` muted text: restrict to 18px+ or 14px+ bold contexts only (section labels, hints)

---

### Semantic HTML

| Element | Required Semantic |
|---------|------------------|
| Page titles | `<h1>` per page (e.g., "My Cellar", "Add Wine") |
| Section headings | `<h2>` for "Drink Now", "Tasting Notes", etc. |
| Wine cards | `<article>` or `<li>` within `<ul>` |
| Location list | `<ul>` with `<li>` per location |
| Forms | `<form>` with associated `<label>` for every input |
| Navigation | `<nav>` with `aria-label="Main navigation"` |
| Bottom tab bar | `<nav aria-label="Primary navigation">` with `<a>` and `aria-current="page"` |
| Modals | `role="dialog"` + `aria-modal="true"` + `aria-labelledby` pointing to modal title |
| Filter chips | `<button type="button">` with `aria-label="Remove [filter name] filter"` |
| Stat tiles | `<a>` (tappable link) with descriptive text: "47 total bottles — view cellar" |
| Error messages | `role="alert"` or `aria-live="polite"` for inline validation |
| Readiness badge | `<span>` with text content (not icon-only) |

---

### Keyboard Navigation

| Feature | Keyboard Behavior |
|---------|-----------------|
| General | Tab/Shift+Tab cycles through all interactive elements in DOM order |
| Wine cards | Enter/Space activates the card link (navigates to detail) |
| [+] / [−] buttons | Enter/Space activates; focused with Tab |
| Star rating | Left/Right arrows change value; Space sets; focus visible on each star |
| Filter checkboxes | Space toggles; Arrow keys move within a group |
| Bottom sheet modal | Opens on Enter/Space on [−]; focus moves into modal; Tab trapped; Escape closes |
| Delete modal | Focus moves to Cancel button on open; Tab between Cancel and Delete; Escape = Cancel |
| Inline rename | Enter saves; Escape cancels |
| Sort dropdown | Arrow keys to navigate options; Enter to select |
| Search bar | Standard text input; results update as typed |

**Focus management rules:**
- Opening a modal: focus moves to the first focusable element inside the modal (typically Cancel button for destructive actions)
- Closing a modal: focus returns to the element that triggered the modal
- Page navigation: focus moves to the `<h1>` of the new page
- Form submit error: focus moves to the first invalid field

**Focus indicator:**
- Visible on all interactive elements
- Style: `2px solid #FBCA5C` (Gold) outline with `2px offset` — visible on both light and dark backgrounds
- Never `outline: none` without a custom focus style replacement

---

### ARIA Labels

| Element | ARIA Attribute |
|---------|---------------|
| Search input | `aria-label="Search your wine collection"` |
| Filter toggle button | `aria-expanded="true/false"` + `aria-controls="filter-panel"` |
| Filter panel | `id="filter-panel"` + `role="region"` + `aria-label="Filter options"` |
| Filter chip remove button | `aria-label="Remove Readiness: Hold filter"` |
| [−] quantity button | `aria-label="Remove one bottle of [wine name]"` |
| [+] quantity button | `aria-label="Add one bottle of [wine name]"` |
| Disabled [−] at qty 0 | `aria-disabled="true"` + `aria-label="Cannot remove bottle: none remaining"` |
| Readiness badge | `role="status"` or `<span>` with text (no icon-only badges) |
| Cellar Empty badge | Text must read "CELLAR EMPTY" (visible text, not just icon) |
| Would Buy Again buttons | `role="radiogroup"` with 3 `role="radio"` children |
| Star rating widget | `role="radiogroup"` `aria-label="Rating"` with 5 `role="radio"` stars |
| Delete confirmation modal | `role="dialog"` `aria-modal="true"` `aria-labelledby="modal-title"` |
| Loading/submitting state | `aria-busy="true"` on form element; spinner has `role="status"` `aria-label="Saving..."` |
| Toast notifications | `role="alert"` (error/urgent) or `role="status"` (success) |
| "Back to Cellar" link | `aria-label="Back to My Cellar"` |
| Result count | `aria-live="polite"` region — announced on filter change |

---

### Screen Reader Considerations

**Wine cards in cellar list:**
- Each card `<article>` should have `aria-label="[Wine Name], [Vintage], [Wine Type], [Location], [Readiness badge], [Rating], [Quantity] bottles"`
- Avoids ambiguous "button" labels without context

**Quantity controls:**
- Both [−] and [+] buttons should announce the new quantity after action: use `aria-live="polite"` on the quantity display element
- Example: quantity display `<span aria-live="polite" aria-atomic="true">3</span>` — screen reader announces "3" when value changes

**Readiness badges:**
- Text content must be the full badge name ("DRINK NOW", "HOLD", etc.)
- Not just color — color alone is insufficient for WCAG 1.4.1 (Use of Color)

**Tasting note form:**
- Character counters: `aria-live="polite"` so screen readers announce the count as user types
- Example: `<span aria-live="polite">68 of 1000 characters</span>`

**Filter chips:**
- When a chip is added: announce "Filter added: [dimension] [value]" via `aria-live="polite"`
- When a chip is removed: announce "Filter removed: [dimension] [value]"

**Delete confirmation:**
- Modal title read first on focus
- "This cannot be undone" must be in the modal body (not as a tooltip)

---

### Motion & Animation

- All CSS transitions/animations: respect `prefers-reduced-motion: reduce`
- Bottom sheet slide-up: skip animation if reduced motion preferred (show instantly)
- Toast slide-in: same
- Filter panel expand: same
- Provide no "blink" or rapid flashing elements

```css
@media (prefers-reduced-motion: reduce) {
  * {
    transition-duration: 0.001ms !important;
    animation-duration: 0.001ms !important;
  }
}
```

---

### Form Accessibility

- Every input has a visible `<label>` (not placeholder-only)
- Required fields: `aria-required="true"` + visual asterisk `*`
- Asterisk explained: footnote "* Required field" at form top
- Error state: `aria-invalid="true"` on invalid input + `aria-describedby` pointing to error message `<span>`
- Error message ID pattern: `error-[field-name]` (e.g., `error-vintage`)

```html
<!-- Example valid pattern -->
<label for="vintage">Vintage Year *</label>
<input
  id="vintage"
  type="number"
  aria-required="true"
  aria-invalid="true"
  aria-describedby="error-vintage"
/>
<span id="error-vintage" role="alert">
  ⚠ Vintage must be between 1900 and 2027.
</span>
```

---

### WCAG 2.1 Checklist Summary

| Criterion | Level | Status | Notes |
|-----------|-------|--------|-------|
| 1.1.1 Non-text content | A | ✓ | Alt text on all icons; badges have text |
| 1.3.1 Info and relationships | A | ✓ | Semantic HTML structure |
| 1.3.3 Sensory characteristics | A | ✓ | Badges not color-only (text names) |
| 1.4.1 Use of color | A | ✓ | Event type and readiness use text + color |
| 1.4.3 Contrast (minimum) | AA | ✓ | See table above; black on green badge |
| 1.4.4 Resize text | AA | ✓ | Responsive layout, no fixed text sizes |
| 1.4.10 Reflow | AA | ✓ | Single-column at 375px, no horizontal scroll |
| 1.4.11 Non-text contrast | AA | ✓ | Button borders, input borders meet 3:1 |
| 2.1.1 Keyboard | A | ✓ | All interactive elements keyboard accessible |
| 2.1.2 No keyboard trap | A | ✓ | Modals trap focus but allow Escape |
| 2.4.1 Bypass blocks | A | ✓ | Skip-to-content link at page top |
| 2.4.3 Focus order | A | ✓ | DOM order = visual order |
| 2.4.4 Link purpose | A | ✓ | Descriptive link text / aria-labels |
| 2.4.7 Focus visible | AA | ✓ | Gold outline on all focused elements |
| 2.5.3 Label in name | A | ✓ | Button text matches accessible name |
| 2.5.5 Target size | AAA | ✓ (target) | 44px minimum touch targets |
| 3.1.1 Language of page | A | ✓ | `lang="en"` on `<html>` |
| 3.3.1 Error identification | A | ✓ | Inline errors adjacent to fields |
| 3.3.2 Labels or instructions | A | ✓ | Labels + hints on all inputs |
| 4.1.2 Name, role, value | A | ✓ | ARIA attributes per table above |
| 4.1.3 Status messages | AA | ✓ | `role="alert"` on toasts and errors |
