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
