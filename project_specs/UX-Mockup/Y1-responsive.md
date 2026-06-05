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
