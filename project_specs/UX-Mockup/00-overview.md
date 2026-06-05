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
