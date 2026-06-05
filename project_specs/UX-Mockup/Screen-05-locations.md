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
