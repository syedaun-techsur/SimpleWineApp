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
