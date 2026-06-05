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
