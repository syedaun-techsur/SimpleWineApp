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
