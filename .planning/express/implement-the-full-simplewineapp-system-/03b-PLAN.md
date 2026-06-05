---
phase: implement-the-full-simplewineapp-system
plan: 03b
type: execute
wave: 3b
depends_on: [1, 2a, 2b]
files_modified:
  - app/cellar/page.tsx
  - components/WineCellarList.tsx
  - components/FilterPanel.tsx
  - components/WineCard.tsx
  - components/ReadinessBadge.tsx
  - components/RatingWidget.tsx
  - components/TastingNoteForm.tsx
  - app/wines/[id]/notes/new/page.tsx
  - app/page.tsx
  - components/DashboardShelf.tsx
autonomous: true

features:
  implements: ["F3", "F4", "F5", "F6"]
  depends_on: ["F0", "F1", "F2"]
  enables: []

must_haves:
  truths:
    - "/cellar renders all wines fetched from GET /api/wines with search bar, filter button, sort dropdown, and result count"
    - "Search debounced 150ms filters wines by name/producer/grape/country/region case-insensitively; result count updates"
    - "FilterPanel exposes 8 dimensions (wine type, producer, country/region, vintage year, grape variety, storage location, readiness, rating); OR within dimension, AND across"
    - "Active filters render as dismissible chips; ✕ removes individual chip; Clear All removes all filters + search; sessionStorage is reset"
    - "Filter/search/sort state saved to sessionStorage keys swa_cellar_search, swa_cellar_filters, swa_cellar_sort and restored on back-navigation"
    - "URL query params (?readiness=, ?wine_type=, ?location=, ?country=, ?vintage_min=, ?vintage_max=) are read on page load and init filter state (overriding sessionStorage)"
    - "ReadinessBadge renders color-coded pill for all 5 badge states using computeReadinessBadge from lib/readiness.ts — never cached"
    - "TastingNoteForm at /wines/[id]/notes/new renders RatingWidget (5-star or 100-pt per user_settings), all optional sensory fields with char counters, draft preserved in sessionStorage key swa_note_draft_[wine_id]"
    - "Dashboard at / (default landing) renders 4 stat tiles, Drink Now horizontal-scroll shelf, 3 collection breakdowns (type/country/decade), Recently Added (5), Recently Consumed (5), Highest Rated (5) — all server-rendered"
    - "Dashboard stat tiles link to /cellar with matching readiness URL param; breakdown segments link to /cellar with dimension URL param; shelf cards link to /wines/[id]"
  artifacts:
    - path: "app/cellar/page.tsx"
      provides: "Server shell: fetches wines + locations, passes to WineCellarList; reads URL query params and passes as initialFilters"
      exports: ["default export page component"]
    - path: "components/WineCellarList.tsx"
      provides: "'use client' — search/filter/sort engine; renders WineCard list; manages sessionStorage"
      exports: ["WineCellarList"]
    - path: "components/FilterPanel.tsx"
      provides: "'use client' — 8-dimension filter panel; mobile bottom drawer + desktop sidebar; chip rendering"
      exports: ["FilterPanel"]
    - path: "components/ReadinessBadge.tsx"
      provides: "Color-coded badge pill for 5 readiness states; uses computeReadinessBadge"
      exports: ["ReadinessBadge"]
    - path: "components/RatingWidget.tsx"
      provides: "'use client' — 5-star clickable stars (gold) OR 100-pt numeric input; scale controlled by prop"
      exports: ["RatingWidget"]
    - path: "components/TastingNoteForm.tsx"
      provides: "'use client' — full tasting note form with sessionStorage draft; posts to /api/wines/[id]/notes"
      exports: ["TastingNoteForm"]
    - path: "app/wines/[id]/notes/new/page.tsx"
      provides: "Server shell: fetches wine + user settings; renders TastingNoteForm"
      exports: ["default export page component"]
    - path: "app/page.tsx"
      provides: "Dashboard Server Component: fetches GET /api/dashboard; renders stat tiles, Drink Now shelf, breakdowns, activity lists"
      exports: ["default export page component"]
    - path: "components/DashboardShelf.tsx"
      provides: "Horizontal-scroll wine card row for Drink Now shelf"
      exports: ["DashboardShelf"]
  key_links:
    - from: "components/WineCellarList.tsx"
      to: "lib/readiness.ts computeReadinessBadge"
      via: "import { computeReadinessBadge } from '@/lib/readiness'"
      pattern: "computeReadinessBadge"
    - from: "components/WineCellarList.tsx"
      to: "sessionStorage"
      via: "read on mount (try/catch); write on filter/search/sort change"
      pattern: "swa_cellar_"
    - from: "app/cellar/page.tsx"
      to: "WineCellarList"
      via: "passes wines[], locations[], initialFilters from URL searchParams"
      pattern: "searchParams"
    - from: "components/TastingNoteForm.tsx"
      to: "POST /api/wines/[id]/notes"
      via: "fetch on form submit"
      pattern: "api/wines.*notes"
    - from: "components/TastingNoteForm.tsx"
      to: "sessionStorage key swa_note_draft_[wine_id]"
      via: "onChange saves draft; onMount restores draft; onSuccess clears draft"
      pattern: "swa_note_draft_"
    - from: "app/page.tsx"
      to: "GET /api/dashboard"
      via: "server-side fetch in dashboard page"
      pattern: "api/dashboard"
    - from: "components/RatingWidget.tsx"
      to: "lib/rating.ts displayRating"
      via: "import { displayRating } from '@/lib/rating'"
      pattern: "displayRating"

integration_contracts:
  requires:
    - from_plan: "02a"
      artifact: "app/api/wines/route.ts"
      exports: ["GET /api/wines → { wines: Wine[] }"]
      verify: "grep -n 'export.*GET' app/api/wines/route.ts && echo CONTRACT_OK"
    - from_plan: "02a"
      artifact: "app/api/locations/route.ts"
      exports: ["GET /api/locations → { locations: LocationWithCount[] }"]
      verify: "grep -n 'export.*GET' app/api/locations/route.ts && echo CONTRACT_OK"
    - from_plan: "02b"
      artifact: "app/api/dashboard/route.ts"
      exports: ["GET /api/dashboard → DashboardResponse"]
      verify: "grep -n 'export.*GET' app/api/dashboard/route.ts && grep -n 'drink_now' app/api/dashboard/route.ts && echo CONTRACT_OK"
    - from_plan: "02b"
      artifact: "app/api/wines/[id]/notes/route.ts"
      exports: ["POST /api/wines/[id]/notes → TastingNote (201)"]
      verify: "grep -n 'export.*POST' \"app/api/wines/[id]/notes/route.ts\" && echo CONTRACT_OK"
    - from_plan: "02b"
      artifact: "app/api/settings/route.ts"
      exports: ["GET /api/settings → UserSettings { rating_scale }"]
      verify: "grep -n 'export.*GET' app/api/settings/route.ts && echo CONTRACT_OK"
    - from_plan: "02b"
      artifact: "lib/readiness.ts"
      exports: ["computeReadinessBadge", "ReadinessBadge"]
      verify: "grep -n 'export function computeReadinessBadge' lib/readiness.ts && echo CONTRACT_OK"
    - from_plan: "02b"
      artifact: "lib/rating.ts"
      exports: ["displayRating", "RatingScale"]
      verify: "grep -n 'export function displayRating' lib/rating.ts && echo CONTRACT_OK"
  provides:
    - artifact: "app/cellar/page.tsx"
      exports: ["default page (Server Component)"]
      shape: |
        // Server Component — fetches wines + locations, parses URL searchParams
        // Passes: wines: Wine[], locations: LocationWithCount[], initialFilters from URL params
        // Renders: <WineCellarList wines={wines} locations={locations} initialFilters={initialFilters} />
      verify: "grep -n 'WineCellarList' app/cellar/page.tsx && echo CONTRACT_OK"
    - artifact: "components/WineCellarList.tsx"
      exports: ["WineCellarList"]
      shape: |
        'use client'
        interface WineCellarListProps { wines: Wine[]; locations: LocationWithCount[]; initialFilters?: CellarFilterState; }
        export function WineCellarList(props: WineCellarListProps): JSX.Element
      verify: "grep -n 'export function WineCellarList\\|export default.*WineCellarList' components/WineCellarList.tsx && echo CONTRACT_OK"
    - artifact: "components/FilterPanel.tsx"
      exports: ["FilterPanel"]
      shape: |
        'use client'
        interface FilterPanelProps { filters: CellarFilterState; wines: Wine[]; locations: LocationWithCount[]; onChange: (f: CellarFilterState) => void; onClose?: () => void; }
        export function FilterPanel(props: FilterPanelProps): JSX.Element
      verify: "grep -n 'export function FilterPanel\\|export default.*FilterPanel' components/FilterPanel.tsx && echo CONTRACT_OK"
    - artifact: "components/ReadinessBadge.tsx"
      exports: ["ReadinessBadge"]
      shape: |
        import type { ReadinessBadge as ReadinessBadgeType } from '@/lib/readiness';
        interface ReadinessBadgeProps { badge: ReadinessBadgeType; }
        export function ReadinessBadge({ badge }: ReadinessBadgeProps): JSX.Element
      verify: "grep -n 'export function ReadinessBadge\\|export default.*ReadinessBadge' components/ReadinessBadge.tsx && echo CONTRACT_OK"
    - artifact: "components/RatingWidget.tsx"
      exports: ["RatingWidget"]
      shape: |
        'use client'
        interface RatingWidgetProps { value: number | null; scale: 'five_star' | 'hundred_point'; onChange: (v: number | null) => void; }
        export function RatingWidget(props: RatingWidgetProps): JSX.Element
      verify: "grep -n 'export function RatingWidget\\|export default.*RatingWidget' components/RatingWidget.tsx && echo CONTRACT_OK"
    - artifact: "components/TastingNoteForm.tsx"
      exports: ["TastingNoteForm"]
      shape: |
        'use client'
        interface TastingNoteFormProps { wineId: number; wineName: string; ratingScale: 'five_star'|'hundred_point'; prefillDate?: string; }
        export function TastingNoteForm(props: TastingNoteFormProps): JSX.Element
      verify: "grep -n 'export function TastingNoteForm\\|export default.*TastingNoteForm' components/TastingNoteForm.tsx && echo CONTRACT_OK"
    - artifact: "app/wines/[id]/notes/new/page.tsx"
      exports: ["default page (Server Component)"]
      shape: |
        // Server Component — fetches wine + GET /api/settings; renders TastingNoteForm
        // Redirect to /wines/[id] after successful note save
      verify: "grep -n 'TastingNoteForm' \"app/wines/[id]/notes/new/page.tsx\" && echo CONTRACT_OK"
    - artifact: "app/page.tsx"
      exports: ["default page (Dashboard Server Component)"]
      shape: |
        // Server Component — fetches GET /api/dashboard → DashboardResponse
        // Renders: 4 stat tiles, DashboardShelf, 3 breakdown sections, recently_added, recently_consumed, highest_rated
        // Default landing route /
      verify: "grep -n 'DashboardShelf\\|drink_now\\|stat' app/page.tsx && echo CONTRACT_OK"
    - artifact: "components/DashboardShelf.tsx"
      exports: ["DashboardShelf"]
      shape: |
        interface DashboardShelfProps { wines: Wine[]; }
        export function DashboardShelf({ wines }: DashboardShelfProps): JSX.Element
        // horizontal-scroll card row; 160px × 120px cards; peek 2.5 cards at 375px
      verify: "grep -n 'export function DashboardShelf\\|export default.*DashboardShelf' components/DashboardShelf.tsx && echo CONTRACT_OK"
---

<objective>
Build all P1 frontend components and pages: the /cellar collection list with FilterPanel + sessionStorage persistence (F3), the TastingNoteForm with RatingWidget at /wines/[id]/notes/new (F4), the ReadinessBadge shared component (F5), and the Dashboard landing page at / with stat tiles, Drink Now shelf, breakdowns, and activity lists (F6).

Purpose: Wave 3b completes the P1 feature set. After this wave, all 7 features (F0–F6) are fully implemented end-to-end. The Dashboard is the default landing route that every user sees on app open.

Output:
- app/cellar/page.tsx: Server shell fetching wines + locations; URL param parsing for filter init
- components/WineCellarList.tsx: 'use client' — complete search/filter/sort engine with sessionStorage
- components/FilterPanel.tsx: 'use client' — 8-dimension filter panel, mobile bottom-drawer + desktop sidebar, chip rendering
- components/ReadinessBadge.tsx: color-coded pill for 5 readiness states
- components/RatingWidget.tsx: 'use client' — 5-star (interactive stars) or 100-pt (numeric input) rating input
- components/TastingNoteForm.tsx: 'use client' — full note form with draft preservation in sessionStorage
- app/wines/[id]/notes/new/page.tsx: Server shell for tasting note creation
- app/page.tsx: Dashboard Server Component fetching GET /api/dashboard
- components/DashboardShelf.tsx: horizontal-scroll Drink Now shelf
</objective>

<feature_dependencies>
Implements: F3: /cellar page with WineCellarList (search/filter/sort), FilterPanel (8 dimensions, dismissible chips), sessionStorage persistence, URL param init
            F4: TastingNoteForm at /wines/[id]/notes/new, RatingWidget (5-star or 100-pt), draft preservation in sessionStorage key swa_note_draft_[wine_id]
            F5: ReadinessBadge component (5 color-coded states), computeReadinessBadge integration in WineCellarList + WineForm live preview (wave 3a's WineForm uses ReadinessBadge)
            F6: Dashboard at / — stat tiles, Drink Now shelf (DashboardShelf), type/country/decade breakdowns, recently added/consumed/highest rated — all server-rendered via GET /api/dashboard
Depends on: F0 (GET /api/wines from wave 2a), F1 (quantity controls from wave 3a's WineCard), F2 (GET /api/locations from wave 2a), lib/readiness.ts (wave 2b), lib/rating.ts (wave 2b), GET /api/dashboard (wave 2b), POST /api/wines/[id]/notes (wave 2b), GET /api/settings (wave 2b)
Enables: None (wave 3b is the final feature wave; wave 4 is integration-only)
</feature_dependencies>

<execution_context>
@/root/.config/opencode/pivota_spec-framework/workflows/execute-plan.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/express/implement-the-full-simplewineapp-system-/WAVE-SCHEDULE.md
@project_specs/TechArch-SimpleWineApp.md
@project_specs/UX-Mockup-SimpleWineApp.md
@project_specs/UserStories-SimpleWineApp.md
@.planning/express/implement-the-full-simplewineapp-system-/02a-PLAN.md
@.planning/express/implement-the-full-simplewineapp-system-/02b-PLAN.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Build ReadinessBadge, RatingWidget, and /cellar page (WineCellarList + FilterPanel)</name>
  <files>
    components/ReadinessBadge.tsx
    components/RatingWidget.tsx
    components/WineCard.tsx
    components/WineCellarList.tsx
    components/FilterPanel.tsx
    app/cellar/page.tsx
  </files>
  <action>
Build the complete /cellar feature: ReadinessBadge shared component (used everywhere), RatingWidget for tasting notes, WineCellarList client-side engine, FilterPanel, and the cellar page server shell.

---

**components/ReadinessBadge.tsx** — Color-coded pill for 5 readiness states. No "use client" needed (pure render). Uses `computeReadinessBadge` when passed `start`/`end`; or accepts a pre-computed `badge` prop.

Badge colors from UX-Mockup design tokens:
- Drink Now: `#10B981` background, white text
- Hold: `#3B82F6` background, white text
- Approaching Peak: `#F59E0B` background, white text (`#0A0A0A` for contrast)
- Past Window: `#6B7280` background, white text
- No Window Set: `#9CA3AF` background, `#0A0A0A` text
- Cellar Empty: `#D1D5DB` background, `#0A0A0A` text (separate variant)

```typescript
import { computeReadinessBadge, type ReadinessBadge as ReadinessBadgeType } from '@/lib/readiness';

interface ReadinessBadgeProps {
  badge?: ReadinessBadgeType | 'Cellar Empty';
  start?: number | null;
  end?: number | null;
}

const BADGE_STYLES: Record<string, { bg: string; color: string }> = {
  'Drink Now':       { bg: '#10B981', color: '#FFFFFF' },
  'Hold':            { bg: '#3B82F6', color: '#FFFFFF' },
  'Approaching Peak':{ bg: '#F59E0B', color: '#0A0A0A' },
  'Past Window':     { bg: '#6B7280', color: '#FFFFFF' },
  'No Window Set':   { bg: '#9CA3AF', color: '#0A0A0A' },
  'Cellar Empty':    { bg: '#D1D5DB', color: '#0A0A0A' },
};

export function ReadinessBadge({ badge, start, end }: ReadinessBadgeProps) {
  const computed: ReadinessBadgeType | 'Cellar Empty' = badge ?? computeReadinessBadge(start ?? null, end ?? null);
  const style = BADGE_STYLES[computed] ?? BADGE_STYLES['No Window Set'];
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: '2px',
        backgroundColor: style.bg,
        color: style.color,
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '10px',
        fontWeight: 400,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        lineHeight: '1.6',
      }}
      aria-label={`Readiness: ${computed}`}
    >
      {computed}
    </span>
  );
}
```

---

**components/RatingWidget.tsx** — `"use client"` interactive rating input. 5-star mode renders 5 clickable star buttons (Gold `#FBCA5C` filled on `#0A0A0A` background when selected). 100-pt mode renders a numeric `<input type="number" min="1" max="100">`. Both support null (no rating set).

```typescript
'use client';

import { displayRating } from '@/lib/rating';

interface RatingWidgetProps {
  value: number | null;          // stored 1-100 normalized value OR null
  scale: 'five_star' | 'hundred_point';
  onChange: (storedValue: number | null) => void;
  readOnly?: boolean;
}

export function RatingWidget({ value, scale, onChange, readOnly = false }: RatingWidgetProps) {
  if (scale === 'five_star') {
    // Display stars 1-5; value is stored 1-100, convert for display
    const starValue = value !== null ? Math.round((value / 20) * 2) / 2 : null;
    return (
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }} role="group" aria-label="Rating (5 stars)">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = starValue !== null && starValue >= star;
          return (
            <button
              key={star}
              type="button"
              onClick={() => !readOnly && onChange(star * 20)}
              aria-label={`${star} star${star !== 1 ? 's' : ''}`}
              aria-pressed={filled}
              disabled={readOnly}
              style={{
                background: 'none',
                border: 'none',
                cursor: readOnly ? 'default' : 'pointer',
                fontSize: '24px',
                color: filled ? '#FBCA5C' : '#9CA3AF',
                padding: '4px',
                minWidth: '44px',
                minHeight: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ★
            </button>
          );
        })}
        {value !== null && !readOnly && (
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label="Clear rating"
            style={{ fontSize: '12px', color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
          >
            ✕
          </button>
        )}
      </div>
    );
  }

  // 100-point mode
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <input
        type="number"
        min={1}
        max={100}
        value={value ?? ''}
        onChange={(e) => {
          const v = parseInt(e.target.value, 10);
          if (e.target.value === '') onChange(null);
          else if (!isNaN(v) && v >= 1 && v <= 100) onChange(v);
        }}
        disabled={readOnly}
        placeholder="1–100"
        aria-label="Rating (1–100 points)"
        style={{
          width: '80px',
          padding: '8px',
          border: '1px solid #E5E7EB',
          borderRadius: '2px',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '16px',
        }}
      />
      <span style={{ color: '#9CA3AF', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', textTransform: 'uppercase' }}>
        / 100
      </span>
    </div>
  );
}
```

---

**components/WineCard.tsx** — If WineCard was created in wave 3a (frontend-core), check first and extend it. If it doesn't exist yet, create it here. WineCard must show: wine name (link to /wines/[id]), producer · vintage · wine_type, location, ReadinessBadge (or Cellar Empty), rating (formatted per scale), quantity controls [−] qty [+].

Key requirement: show `most_recent_rating` formatted per the current `ratingScale` prop. Use `displayRating(most_recent_rating, ratingScale)` from lib/rating.ts. If no rating: show "—".

```typescript
import Link from 'next/link';
import { ReadinessBadge } from './ReadinessBadge';
import { displayRating } from '@/lib/rating';
import type { Wine } from '@/lib/types'; // or define inline

interface WineCardProps {
  wine: Wine & { most_recent_rating?: number | null };
  ratingScale: 'five_star' | 'hundred_point';
  onIncrement?: () => void;
  onDecrement?: () => void;
}

export function WineCard({ wine, ratingScale, onIncrement, onDecrement }: WineCardProps) {
  const badge = wine.quantity === 0 ? 'Cellar Empty' : undefined;
  const ratingDisplay = wine.most_recent_rating != null
    ? displayRating(wine.most_recent_rating, ratingScale)
    : '—';

  return (
    <div style={{
      background: '#FAFAF7',
      border: '1px solid #E5E7EB',
      borderRadius: '2px',
      padding: '12px',
      marginBottom: '8px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Link href={`/wines/${wine.id}`} style={{ color: '#0A0A0A', fontWeight: 600, fontSize: '16px', textDecoration: 'none', fontFamily: 'Open Sans, sans-serif' }}>
          {wine.name}
        </Link>
        <ReadinessBadge
          badge={badge}
          start={wine.drinking_window_start}
          end={wine.drinking_window_end}
        />
      </div>
      <p style={{ color: '#6B7280', fontSize: '13px', margin: '4px 0', fontFamily: 'Open Sans, sans-serif' }}>
        {wine.producer} · {wine.vintage} · {wine.wine_type}
      </p>
      <p style={{ color: '#9CA3AF', fontSize: '12px', margin: '4px 0', fontFamily: 'Open Sans, sans-serif' }}>
        📍 {wine.location_name ?? 'Location Unknown'}
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
        <span style={{ color: '#FBCA5C', fontSize: '14px' }}>
          {ratingScale === 'five_star' && wine.most_recent_rating != null
            ? '★'.repeat(Math.round(wine.most_recent_rating / 20)) + '☆'.repeat(5 - Math.round(wine.most_recent_rating / 20))
            : ratingDisplay}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            type="button"
            onClick={onDecrement}
            disabled={wine.quantity === 0}
            aria-disabled={wine.quantity === 0}
            aria-label="Remove a bottle"
            style={{
              width: '36px', height: '36px', border: '1px solid #E5E7EB', borderRadius: '2px',
              background: '#FAFAF7', cursor: wine.quantity === 0 ? 'not-allowed' : 'pointer',
              color: wine.quantity === 0 ? '#9CA3AF' : '#0A0A0A', fontSize: '16px',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >−</button>
          <span style={{ minWidth: '24px', textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: '14px' }}>
            {wine.quantity}
          </span>
          <button
            type="button"
            onClick={onIncrement}
            disabled={wine.quantity >= 9999}
            aria-disabled={wine.quantity >= 9999}
            aria-label="Add a bottle"
            style={{
              width: '36px', height: '36px', border: '1px solid #E5E7EB', borderRadius: '2px',
              background: '#FAFAF7', cursor: wine.quantity >= 9999 ? 'not-allowed' : 'pointer',
              color: wine.quantity >= 9999 ? '#9CA3AF' : '#0A0A0A', fontSize: '16px',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >+</button>
        </div>
      </div>
    </div>
  );
}
```

Note: quantity controls on cellar cards only increment/decrement; decrement on detail page shows the RemoveBottleModal. On the cellar list, just call `PATCH /api/wines/[id]/quantity` with delta:1 for increment. Decrement from cellar card: navigate to /wines/[id] for the full modal flow (or show a simplified inline modal — simpler is better here; just call the API with delta:-1 and a default event_type of 'Consumed', then show a toast). Keep it simple: call PATCH directly from the card with delta:1 for increment; for decrement on cellar cards open RemoveBottleModal if it exists from wave 3a, otherwise just call with delta:-1 and event_type 'Consumed' inline.

---

**components/FilterPanel.tsx** — `"use client"`. Exposes 8 filter dimensions. Mobile: bottom drawer (90% height, slides up). Desktop (≥1024px): left sidebar. Shows dismissible chips for active filters in the main content area (NOT inside the panel).

Filter state type:
```typescript
export interface CellarFilterState {
  search: string;
  wine_type: string[];
  producer: string[];
  country: string[];
  vintage_min: number | null;
  vintage_max: number | null;
  grape: string[];
  location: string[];
  readiness: string[];
  rating_min: number | null;
  sort: string; // 'name_asc' | 'name_desc' | 'vintage_newest' | 'vintage_oldest' | 'rating_highest' | 'rating_lowest' | 'quantity_most' | 'quantity_fewest' | 'recently_added' | 'recently_consumed'
}
```

The FilterPanel receives:
- `filters`: current CellarFilterState
- `wines`: Wine[] (for computing dynamic option counts)
- `locations`: LocationWithCount[]
- `onChange(f: CellarFilterState)`: called when a filter changes
- `isOpen: boolean` (mobile only)
- `onClose?: () => void` (mobile close)

Dimension rendering:
- **Wine Type**: checkboxes for Red, White, Rosé, Sparkling, Dessert, Fortified, Orange, Other — show count of matching wines in brackets
- **Readiness**: checkboxes for the 5 badge values — computed via `computeReadinessBadge` on each wine
- **Storage Location**: checkboxes from locations list (include "Location Unknown" if any wine has null location_id)
- **Country / Region**: checkboxes for unique country values (top 10 by count)
- **Vintage Year**: two number inputs for min/max range
- **Grape Variety**: checkboxes for unique grape values (top 10)
- **Rating (minimum)**: checkboxes for ★★★★★ (≥80), ★★★★☆ (≥60), ★★★☆☆ (≥40), No rating
- **Producer**: checkboxes for unique producer values (top 10)

Sort dropdown (lives outside the filter panel, in the main toolbar): 10 options. Default: name_asc.

FilterPanel also renders a "Done (N)" button on mobile showing live result count, and "Clear All Filters" button.

Key implementation notes:
- Use OR logic within each dimension array filter
- Use AND logic across dimension arrays
- All filtering is client-side — no server round-trip
- Dynamic counts computed from the FULL wines array (not already-filtered), so options don't disappear while filtering

```typescript
'use client';

import { useState, useMemo } from 'react';
import { computeReadinessBadge } from '@/lib/readiness';

// ... (full implementation with the CellarFilterState type, FilterPanel component)
// Key: each dimension section has checkboxes; checking one value appends to the array;
// unchecking removes from array; onChange called on each change.
// Readiness filter: options are computed by calling computeReadinessBadge on every wine
// in the full wines list and collecting unique badge values with their counts.
```

---

**components/WineCellarList.tsx** — `"use client"`. The main client component for /cellar. Manages all filter state, applies filtering/sorting to the wine list, renders WineCard list, and handles sessionStorage.

sessionStorage keys:
- `swa_cellar_search` — string search query
- `swa_cellar_filters` — JSON of CellarFilterState (without search and sort)
- `swa_cellar_sort` — string sort key

On mount:
1. If `initialFilters` prop is provided (from URL params), use those — URL params take precedence
2. Otherwise, read from sessionStorage (try/catch for private browsing)
3. If nothing, use defaults (empty filters, Name A–Z sort)

Filter application pipeline (in order):
1. Search filter: case-insensitive substring match on name, producer, grape, country, region
2. wine_type filter (OR): wine.wine_type must be in selected set
3. readiness filter (OR): computeReadinessBadge(wine.drinking_window_start, wine.drinking_window_end) must match
4. location filter (OR): wine.location_name must match (or "Location Unknown" for null)
5. country filter (OR): wine.country matches
6. grape filter (OR): wine.grape matches
7. producer filter (OR): wine.producer matches
8. vintage range: wine.vintage >= vintage_min AND wine.vintage <= vintage_max
9. rating_min: wine.most_recent_rating >= rating_min threshold
10. Sort the resulting array

Sort implementations:
- name_asc: localeCompare name A→Z
- name_desc: localeCompare name Z→A
- vintage_newest: b.vintage - a.vintage
- vintage_oldest: a.vintage - b.vintage
- rating_highest: (b.most_recent_rating ?? -1) - (a.most_recent_rating ?? -1)
- rating_lowest: (a.most_recent_rating ?? 9999) - (b.most_recent_rating ?? 9999)
- quantity_most: b.quantity - a.quantity
- quantity_fewest: a.quantity - b.quantity
- recently_added: sort by created_at DESC (Date string comparison)
- recently_consumed: wines that have a recent bottle event first — if this data isn't in the wine object, fall back to recently_added

The component renders:
- Search bar (top, full-width)
- Active Filters row (only if any filter active): chips for each active filter value with ✕; Clear All text link
- Toolbar: "Showing N of M wines" count + Sort dropdown
- Filter button (mobile: opens bottom drawer; desktop: sidebar always visible)
- Wine list using WineCard components

Active filter chips format: "[DIMENSION: value ✕]" in black bg with Gold text, 2px radius, JetBrains Mono uppercase.

On each filter change: write all three sessionStorage keys (try/catch).

```typescript
'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { WineCard } from './WineCard';
import { FilterPanel, type CellarFilterState } from './FilterPanel';
import { computeReadinessBadge } from '@/lib/readiness';
// ... full implementation
```

---

**app/cellar/page.tsx** — Server Component shell. Fetches wines + locations, parses URL searchParams for initial filter state, renders WineCellarList.

```typescript
import { WineCellarList } from '@/components/WineCellarList';
import type { CellarFilterState } from '@/components/FilterPanel';

export default async function CellarPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Fetch wines and locations in parallel
  const [winesRes, locationsRes] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/wines`, { cache: 'no-store' }),
    fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/locations`, { cache: 'no-store' }),
  ]);

  const { wines } = winesRes.ok ? await winesRes.json() : { wines: [] };
  const { locations } = locationsRes.ok ? await locationsRes.json() : { locations: [] };

  // Parse URL query params for initial filter state (overrides sessionStorage per F03-FR-05)
  // Supported params: readiness, wine_type, location, country, vintage_min, vintage_max
  const initialFilters: Partial<CellarFilterState> | undefined = buildInitialFilters(searchParams);

  return (
    <main>
      <WineCellarList wines={wines} locations={locations} initialFilters={initialFilters} />
    </main>
  );
}

function buildInitialFilters(params: Record<string, string | string[] | undefined>): Partial<CellarFilterState> | undefined {
  const filters: Partial<CellarFilterState> = {};
  let hasAny = false;
  const get = (k: string) => { const v = params[k]; return typeof v === 'string' ? v : Array.isArray(v) ? v[0] : undefined; };

  if (get('readiness'))     { filters.readiness = [get('readiness')!]; hasAny = true; }
  if (get('wine_type'))     { filters.wine_type = [get('wine_type')!]; hasAny = true; }
  if (get('location'))      { filters.location = [get('location')!]; hasAny = true; }
  if (get('country'))       { filters.country = [get('country')!]; hasAny = true; }
  if (get('vintage_min'))   { filters.vintage_min = parseInt(get('vintage_min')!, 10) || null; hasAny = true; }
  if (get('vintage_max'))   { filters.vintage_max = parseInt(get('vintage_max')!, 10) || null; hasAny = true; }

  return hasAny ? filters : undefined;
}
```

Note on server-side fetch: In Next.js 14 App Router, use `http://localhost:3000/api/...` for internal API calls from server components, or better yet, call the DB directly via the shared `query()` helper from lib/db.ts to avoid the HTTP round-trip. If lib/db.ts is available in the server context, prefer direct DB queries over internal fetch. If not, use the fetch pattern with `{ cache: 'no-store' }`.

  </action>
  <verify>
```bash
# Verify all component files exist
ls components/ReadinessBadge.tsx components/RatingWidget.tsx components/WineCard.tsx \
   components/WineCellarList.tsx components/FilterPanel.tsx app/cellar/page.tsx && echo "ALL CELLAR FILES EXIST"

# Verify ReadinessBadge exports
grep -n 'export function ReadinessBadge\|export default.*ReadinessBadge' components/ReadinessBadge.tsx && echo "READINESS BADGE EXPORT OK"

# Verify ReadinessBadge uses computeReadinessBadge
grep -n 'computeReadinessBadge' components/ReadinessBadge.tsx && echo "READINESS BADGE USES COMPUTE OK"

# Verify badge colors present
grep -n '#10B981' components/ReadinessBadge.tsx && echo "DRINK NOW COLOR OK"
grep -n '#3B82F6' components/ReadinessBadge.tsx && echo "HOLD COLOR OK"
grep -n '#F59E0B' components/ReadinessBadge.tsx && echo "APPROACHING PEAK COLOR OK"

# Verify RatingWidget exports and supports both scales
grep -n 'export function RatingWidget\|export default.*RatingWidget' components/RatingWidget.tsx && echo "RATING WIDGET EXPORT OK"
grep -n 'five_star\|hundred_point' components/RatingWidget.tsx && echo "RATING WIDGET SCALES OK"

# Verify FilterPanel exports CellarFilterState interface
grep -n 'export.*CellarFilterState' components/FilterPanel.tsx && echo "FILTER STATE EXPORTED OK"
grep -n 'export function FilterPanel\|export default.*FilterPanel' components/FilterPanel.tsx && echo "FILTER PANEL EXPORT OK"

# Verify FilterPanel has 8 dimensions
grep -c 'wine_type\|readiness\|location\|country\|vintage\|grape\|producer\|rating' components/FilterPanel.tsx && echo "FILTER DIMENSIONS PRESENT"

# Verify WineCellarList uses sessionStorage
grep -n 'swa_cellar_' components/WineCellarList.tsx && echo "SESSION STORAGE KEYS OK"

# Verify WineCellarList restores from URL params
grep -n 'initialFilters' components/WineCellarList.tsx && echo "URL PARAM INIT OK"

# Verify cellar page passes initialFilters from URL searchParams
grep -n 'searchParams\|initialFilters' app/cellar/page.tsx && echo "CELLAR PAGE URL PARAM PARSING OK"

# TypeScript compile check
npx tsc --noEmit 2>&1 | tail -10 || echo "TSC CHECK DONE"
```
  </verify>
  <done>
- components/ReadinessBadge.tsx: exports `ReadinessBadge`; accepts `badge` prop OR `start`/`end` props; calls `computeReadinessBadge` for computed states; renders color-coded pill with correct hex colors (Drink Now `#10B981`, Hold `#3B82F6`, Approaching Peak `#F59E0B`, Past Window `#6B7280`, No Window Set `#9CA3AF`, Cellar Empty `#D1D5DB`); WCAG AA compliant text (white or `#0A0A0A`); JetBrains Mono uppercase label
- components/RatingWidget.tsx: exports `RatingWidget`; supports `scale='five_star'` (5 clickable ★ stars with Gold `#FBCA5C` fill, 44px touch targets, clear button) and `scale='hundred_point'` (numeric input 1-100); accepts stored 1-100 value internally; `onChange` fires with stored value
- components/WineCard.tsx: exports `WineCard`; shows name (link to /wines/[id]), producer/vintage/type, location, ReadinessBadge (or Cellar Empty when qty=0), rating formatted via displayRating, quantity controls [−] qty [+] with disabled states at 0/9999
- components/FilterPanel.tsx: exports `FilterPanel` and `CellarFilterState` type; 8 filter dimensions (wine_type, readiness, location, country, vintage range, grape, rating_min, producer); OR within dimension, AND across; dynamic counts from wines array; mobile bottom drawer + desktop sidebar layout; "Done (N)" button + "Clear All" button; JetBrains Mono uppercase labels
- components/WineCellarList.tsx: exports `WineCellarList`; `"use client"`; reads sessionStorage on mount with try/catch; URL `initialFilters` prop overrides sessionStorage; writes all 3 sessionStorage keys on each change; 10 sort options with Name A–Z default; filter pipeline: search → wine_type → readiness → location → country → grape → producer → vintage range → rating; active filter chips with Gold text on Black bg; "Showing N of M wines" count; "No wines match" empty state
- app/cellar/page.tsx: Server Component; fetches GET /api/wines and GET /api/locations in parallel with cache:'no-store'; parses URL searchParams for readiness/wine_type/location/country/vintage_min/vintage_max; passes as `initialFilters` to WineCellarList
  </done>
</task>

<task type="auto">
  <name>Task 2: Build TastingNoteForm + /wines/[id]/notes/new page (F4)</name>
  <files>
    components/TastingNoteForm.tsx
    app/wines/[id]/notes/new/page.tsx
  </files>
  <action>
Build the TastingNoteForm client component and its server page shell at /wines/[id]/notes/new.

---

**components/TastingNoteForm.tsx** — `"use client"`. Full tasting note creation form.

Props:
```typescript
interface TastingNoteFormProps {
  wineId: number;
  wineName: string;
  ratingScale: 'five_star' | 'hundred_point';  // from GET /api/settings
  prefillDate?: string;   // YYYY-MM-DD; pre-filled when arriving from consume flow (US-4.2)
}
```

Form fields (from TechArch §4.2 CreateNoteBody):
1. **tasted_on** (required): `<input type="date">` defaulting to today; rejects future dates
2. **Rating**: `<RatingWidget>` — most prominent field, first visible control above all text fields
3. **appearance** (optional): `<textarea>` max 1000 chars with live character counter
4. **aroma** (optional): `<textarea>` max 1000 chars with counter
5. **flavor** (optional): `<textarea>` max 1000 chars with counter
6. **finish** (optional): `<textarea>` max 1000 chars with counter
7. **would_buy_again** (optional): radio buttons Yes / No / Maybe
8. **occasion** (optional): select dropdown — dinner / gift / casual / celebration / restaurant / tasting / other
9. **guest_feedback** (optional): `<textarea>` max 2000 chars with counter

sessionStorage draft preservation (F04-FR-05):
- Key: `swa_note_draft_[wineId]`
- On each field change: write all form values as JSON to sessionStorage (try/catch)
- On mount: read draft from sessionStorage and restore field values (try/catch)
- On successful submit: clear the draft key from sessionStorage

Submit flow:
- Client validates: tasted_on must not be empty; if provided, must not be in the future
- POST to `/api/wines/${wineId}/notes` with all form values
- On 201: clear draft from sessionStorage; use `router.push(`/wines/${wineId}`)` to redirect to detail page (scrolled to notes section if possible via hash: `/wines/${wineId}#notes`)
- On 422: show inline error messages from the response `fields` object
- On 500: show error toast "Could not save tasting note. Please try again."

Rating scale switch:
- Show "Switch to 100-point / Switch to 5-star" toggle button that calls `PATCH /api/settings { rating_scale: ... }` and updates the component's local `scale` state (which controls RatingWidget); also updates the `ratingScale` for display (no page reload needed — optimistic update)

Label style: JetBrains Mono uppercase 11px `#9CA3AF` for section/field labels. Button style: uppercase, 2px radius, Gold bg for primary CTA, Black text.

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { RatingWidget } from './RatingWidget';

// ... full implementation

export function TastingNoteForm({ wineId, wineName, ratingScale: initialScale, prefillDate }: TastingNoteFormProps) {
  const router = useRouter();
  const draftKey = `swa_note_draft_${wineId}`;
  const today = new Date().toISOString().split('T')[0];

  const [scale, setScale] = useState<'five_star' | 'hundred_point'>(initialScale);
  const [tastedOn, setTastedOn] = useState(prefillDate ?? today);
  const [rating, setRating] = useState<number | null>(null);
  const [appearance, setAppearance] = useState('');
  const [aroma, setAroma] = useState('');
  const [flavor, setFlavor] = useState('');
  const [finish, setFinish] = useState('');
  const [wouldBuyAgain, setWouldBuyAgain] = useState<'yes' | 'no' | 'maybe' | null>(null);
  const [occasion, setOccasion] = useState('');
  const [guestFeedback, setGuestFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Restore draft on mount
  useEffect(() => {
    try {
      const draft = sessionStorage.getItem(draftKey);
      if (draft) {
        const d = JSON.parse(draft);
        if (d.tastedOn) setTastedOn(d.tastedOn);
        if (d.rating !== undefined) setRating(d.rating);
        if (d.appearance) setAppearance(d.appearance);
        if (d.aroma) setAroma(d.aroma);
        if (d.flavor) setFlavor(d.flavor);
        if (d.finish) setFinish(d.finish);
        if (d.wouldBuyAgain) setWouldBuyAgain(d.wouldBuyAgain);
        if (d.occasion) setOccasion(d.occasion);
        if (d.guestFeedback) setGuestFeedback(d.guestFeedback);
      }
    } catch { /* sessionStorage unavailable */ }
  }, [draftKey]);

  // Save draft on any field change
  const saveDraft = useCallback(() => {
    try {
      sessionStorage.setItem(draftKey, JSON.stringify({
        tastedOn, rating, appearance, aroma, flavor, finish, wouldBuyAgain, occasion, guestFeedback,
      }));
    } catch { /* sessionStorage unavailable */ }
  }, [draftKey, tastedOn, rating, appearance, aroma, flavor, finish, wouldBuyAgain, occasion, guestFeedback]);

  useEffect(() => { saveDraft(); }, [saveDraft]);

  const handleScaleSwitch = async () => {
    const newScale = scale === 'five_star' ? 'hundred_point' : 'five_star';
    try {
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating_scale: newScale }),
      });
      setScale(newScale);
      setRating(null); // reset rating on scale change
    } catch { /* ignore scale switch errors; keep current scale */ }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Client validation
    if (!tastedOn) { setErrors({ tasted_on: 'Tasting date is required.' }); return; }
    const d = new Date(tastedOn);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
    if (d > todayEnd) { setErrors({ tasted_on: 'Tasting date cannot be in the future.' }); return; }

    setSubmitting(true);
    try {
      const body: Record<string, unknown> = { tasted_on: tastedOn };
      if (rating !== null) {
        // rating is stored value (1-100); API expects user-scale input
        // We pass the stored value directly since we store internally as 1-100
        // But the API normalizes: five_star × 20. So we must pass the INPUT scale value.
        // For five_star: stored = input × 20, so input = stored / 20
        // For hundred_point: stored = input, so input = stored
        // Actually: the API reads user_settings.rating_scale and normalizes.
        // Our RatingWidget returns the STORED 1-100 value internally (star × 20).
        // But the API will call normalizeRating(input, scale) again — so we must pass the RAW INPUT.
        // Fix: RatingWidget's onChange for five_star fires `star * 20` (stored value).
        // We must pass `star` (1-5) to the API, not the stored value.
        // Simplest fix: pass rating as-is only for hundred_point; for five_star divide by 20.
        const apiRating = scale === 'five_star' ? Math.round(rating / 20) : rating;
        body.rating = apiRating;
      }
      if (appearance) body.appearance = appearance;
      if (aroma) body.aroma = aroma;
      if (flavor) body.flavor = flavor;
      if (finish) body.finish = finish;
      if (wouldBuyAgain) body.would_buy_again = wouldBuyAgain;
      if (occasion) body.occasion = occasion;
      if (guestFeedback) body.guest_feedback = guestFeedback;

      const res = await fetch(`/api/wines/${wineId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.status === 201) {
        try { sessionStorage.removeItem(draftKey); } catch { /* ok */ }
        router.push(`/wines/${wineId}`);
      } else {
        const data = await res.json();
        if (data.fields) setErrors(data.fields);
        else setErrors({ _: data.message ?? 'Could not save tasting note. Please try again.' });
      }
    } catch {
      setErrors({ _: 'Could not save tasting note. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Render form
  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '600px', padding: '16px' }}>
      <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: '24px', color: '#0A0A0A', marginBottom: '8px' }}>
        Add Tasting Note
      </h1>
      <p style={{ color: '#6B7280', fontFamily: 'Open Sans, sans-serif', marginBottom: '24px' }}>{wineName}</p>

      {errors._ && (
        <div style={{ background: '#FEF2F2', border: '1px solid #EF4444', borderLeft: '4px solid #EF4444', padding: '12px', marginBottom: '16px', borderRadius: '2px' }}>
          {errors._}
        </div>
      )}

      {/* Rating — most prominent, first field */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', textTransform: 'uppercase', color: '#9CA3AF', letterSpacing: '0.05em' }}>
            Rating
          </label>
          <button type="button" onClick={handleScaleSwitch}
            style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', textTransform: 'uppercase', color: '#6B7280', background: 'none', border: '1px solid #E5E7EB', borderRadius: '2px', padding: '4px 8px', cursor: 'pointer' }}>
            Switch to {scale === 'five_star' ? '100-point' : '5-star'}
          </button>
        </div>
        <RatingWidget value={rating} scale={scale} onChange={setRating} />
      </div>

      {/* Tasting date */}
      <div style={{ marginBottom: '16px' }}>
        <label htmlFor="tasted_on" style={{ display: 'block', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', textTransform: 'uppercase', color: '#9CA3AF', letterSpacing: '0.05em', marginBottom: '4px' }}>
          Tasting Date *
        </label>
        <input id="tasted_on" type="date" value={tastedOn} max={today} required
          onChange={(e) => setTastedOn(e.target.value)}
          style={{ width: '100%', padding: '8px', border: errors.tasted_on ? '1px solid #EF4444' : '1px solid #E5E7EB', borderRadius: '2px', fontFamily: 'Open Sans, sans-serif', fontSize: '16px' }}
        />
        {errors.tasted_on && <p style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>{errors.tasted_on}</p>}
      </div>

      {/* Sensory fields with char counters */}
      {([['appearance', appearance, setAppearance, 1000], ['aroma', aroma, setAroma, 1000], ['flavor', flavor, setFlavor, 1000], ['finish', finish, setFinish, 1000]] as const).map(([field, val, setter, max]) => (
        <div key={field} style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <label htmlFor={field} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', textTransform: 'uppercase', color: '#9CA3AF', letterSpacing: '0.05em' }}>
              {field.charAt(0).toUpperCase() + field.slice(1)}
            </label>
            <span style={{ fontSize: '11px', color: val.length > max * 0.9 ? '#EF4444' : '#9CA3AF' }}>{val.length} / {max}</span>
          </div>
          <textarea id={field} value={val} maxLength={max}
            onChange={(e) => setter(e.target.value as never)}
            rows={3}
            style={{ width: '100%', padding: '8px', border: '1px solid #E5E7EB', borderRadius: '2px', fontFamily: 'Open Sans, sans-serif', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box' }}
          />
        </div>
      ))}

      {/* Would buy again */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', textTransform: 'uppercase', color: '#9CA3AF', letterSpacing: '0.05em', marginBottom: '8px' }}>
          Would Buy Again
        </label>
        <div style={{ display: 'flex', gap: '12px' }}>
          {(['yes', 'no', 'maybe'] as const).map((opt) => (
            <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontFamily: 'Open Sans, sans-serif', fontSize: '14px' }}>
              <input type="radio" name="would_buy_again" value={opt} checked={wouldBuyAgain === opt} onChange={() => setWouldBuyAgain(opt)} />
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </label>
          ))}
        </div>
      </div>

      {/* Occasion */}
      <div style={{ marginBottom: '16px' }}>
        <label htmlFor="occasion" style={{ display: 'block', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', textTransform: 'uppercase', color: '#9CA3AF', letterSpacing: '0.05em', marginBottom: '4px' }}>
          Occasion
        </label>
        <select id="occasion" value={occasion} onChange={(e) => setOccasion(e.target.value)}
          style={{ width: '100%', padding: '8px', border: '1px solid #E5E7EB', borderRadius: '2px', fontFamily: 'Open Sans, sans-serif', fontSize: '14px', background: '#FAFAF7' }}>
          <option value="">Select an occasion...</option>
          {['dinner', 'gift', 'casual', 'celebration', 'restaurant', 'tasting', 'other'].map((occ) => (
            <option key={occ} value={occ}>{occ.charAt(0).toUpperCase() + occ.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Guest feedback */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <label htmlFor="guest_feedback" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', textTransform: 'uppercase', color: '#9CA3AF', letterSpacing: '0.05em' }}>
            Guest Feedback
          </label>
          <span style={{ fontSize: '11px', color: guestFeedback.length > 1800 ? '#EF4444' : '#9CA3AF' }}>{guestFeedback.length} / 2000</span>
        </div>
        <textarea id="guest_feedback" value={guestFeedback} maxLength={2000}
          onChange={(e) => setGuestFeedback(e.target.value)}
          rows={4}
          style={{ width: '100%', padding: '8px', border: '1px solid #E5E7EB', borderRadius: '2px', fontFamily: 'Open Sans, sans-serif', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box' }}
        />
      </div>

      {/* Submit */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <button type="submit" disabled={submitting}
          style={{
            padding: '12px 24px',
            background: '#FBCA5C',
            color: '#0A0A0A',
            border: 'none',
            borderRadius: '2px',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '13px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            cursor: submitting ? 'not-allowed' : 'pointer',
            fontWeight: 700,
          }}>
          {submitting ? 'Saving...' : 'Save Note'}
        </button>
        <a href={`/wines/${wineId}`}
          style={{ fontFamily: 'Open Sans, sans-serif', fontSize: '14px', color: '#6B7280', textDecoration: 'none' }}>
          Cancel
        </a>
      </div>
    </form>
  );
}
```

---

**app/wines/[id]/notes/new/page.tsx** — Server Component shell. Fetches the wine (for wineName display) and user settings (for initial ratingScale). Parses `?date=YYYY-MM-DD` query param from the post-consume flow (US-4.2).

```typescript
import { notFound } from 'next/navigation';
import { TastingNoteForm } from '@/components/TastingNoteForm';

export default async function NewTastingNotePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { date?: string };
}) {
  const wineId = parseInt(params.id, 10);
  if (isNaN(wineId)) notFound();

  // Fetch wine and settings in parallel
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const [wineRes, settingsRes] = await Promise.all([
    fetch(`${base}/api/wines/${wineId}`, { cache: 'no-store' }),
    fetch(`${base}/api/settings`, { cache: 'no-store' }),
  ]);

  if (wineRes.status === 404) notFound();

  const wineData = wineRes.ok ? await wineRes.json() : null;
  const settingsData = settingsRes.ok ? await settingsRes.json() : { rating_scale: 'five_star' };

  if (!wineData?.wine) notFound();

  const prefillDate = searchParams.date && /^\d{4}-\d{2}-\d{2}$/.test(searchParams.date)
    ? searchParams.date
    : undefined;

  return (
    <main style={{ minHeight: '100vh', background: '#FAFAF7', padding: '16px' }}>
      <TastingNoteForm
        wineId={wineId}
        wineName={`${wineData.wine.name} ${wineData.wine.vintage}`}
        ratingScale={settingsData.rating_scale ?? 'five_star'}
        prefillDate={prefillDate}
      />
    </main>
  );
}
```

  </action>
  <verify>
```bash
# Verify files exist
ls components/TastingNoteForm.tsx "app/wines/[id]/notes/new/page.tsx" && echo "TASTING NOTE FILES EXIST"

# Verify TastingNoteForm exports
grep -n 'export function TastingNoteForm\|export default.*TastingNoteForm' components/TastingNoteForm.tsx && echo "TASTING NOTE FORM EXPORT OK"

# Verify use client directive
grep -n '"use client"' components/TastingNoteForm.tsx && echo "USE CLIENT OK"

# Verify sessionStorage draft preservation
grep -n 'swa_note_draft_' components/TastingNoteForm.tsx && echo "DRAFT KEY OK"
grep -n 'sessionStorage.setItem\|sessionStorage.getItem\|sessionStorage.removeItem' components/TastingNoteForm.tsx && echo "SESSION STORAGE OPS OK"

# Verify RatingWidget is used
grep -n 'RatingWidget' components/TastingNoteForm.tsx && echo "RATING WIDGET USED OK"

# Verify scale switch calls PATCH /api/settings
grep -n 'PATCH.*settings\|api/settings' components/TastingNoteForm.tsx && echo "SCALE SWITCH API CALL OK"

# Verify all 7 occasion values present
grep -n 'dinner\|casual\|celebration\|restaurant\|tasting' components/TastingNoteForm.tsx && echo "OCCASION VALUES OK"

# Verify POST to /api/wines/[id]/notes
grep -n 'api/wines.*notes\|POST.*notes' components/TastingNoteForm.tsx && echo "POST NOTES API OK"

# Verify page shell reads rating_scale from settings
grep -n 'rating_scale\|api/settings' "app/wines/[id]/notes/new/page.tsx" && echo "SETTINGS READ OK"

# Verify page handles 404
grep -n 'notFound' "app/wines/[id]/notes/new/page.tsx" && echo "404 HANDLING OK"

# TypeScript check
npx tsc --noEmit 2>&1 | tail -10 || echo "TSC DONE"
```
  </verify>
  <done>
- components/TastingNoteForm.tsx: exports `TastingNoteForm`; `"use client"`; props: wineId, wineName, ratingScale (initial), prefillDate
- On mount: restores all fields from `swa_note_draft_[wineId]` in sessionStorage (try/catch)
- On each field change: saves all fields to `swa_note_draft_[wineId]` in sessionStorage (try/catch)
- On successful submit (201): removes draft key from sessionStorage; redirects to `/wines/[wineId]` via router.push
- Rating field: uses `RatingWidget` as first/most prominent field; scale switch button calls `PATCH /api/settings` and updates local state
- Tasting date: `<input type="date">` max today; client validates not in future
- Sensory fields (appearance/aroma/flavor/finish): `<textarea>` with live char counters (max 1000)
- would_buy_again: radio buttons yes/no/maybe
- occasion: select dropdown with 7 values (dinner/gift/casual/celebration/restaurant/tasting/other)
- guest_feedback: `<textarea>` with char counter (max 2000)
- API call: POST `/api/wines/${wineId}/notes`; rating sent as raw input scale value (five_star: 1-5, hundred_point: 1-100); server normalizes
- Error handling: inline field errors from 422 response.fields; general error for 500
- app/wines/[id]/notes/new/page.tsx: Server Component; fetches wine (404 if not found) + GET /api/settings in parallel; passes wineName, ratingScale, prefillDate (from ?date= param) to TastingNoteForm
  </done>
</task>

<task type="auto">
  <name>Task 3: Build Dashboard landing page (/) with DashboardShelf and all sections (F6)</name>
  <files>
    app/page.tsx
    components/DashboardShelf.tsx
  </files>
  <action>
Build the Dashboard Server Component at app/page.tsx (the default / route) and the DashboardShelf horizontal-scroll component. The dashboard is the first thing users see on every app launch.

---

**components/DashboardShelf.tsx** — Horizontally scrollable wine card row for the Drink Now shelf.

Spec from UX-Mockup:
- Card: 160px wide × 120px tall, Bone `#FAFAF7` bg, 1px border `#E5E7EB`, 2px radius, 8px padding
- 8px gap between cards
- Horizontal scroll with `-webkit-overflow-scrolling: touch`
- At 375px: 2.5 cards visible (peek pattern)
- Empty state: "No wines are ready to drink right now." centered muted text

Card content: wine name (truncated 1 line, link to /wines/[id]), producer + vintage (muted), ReadinessBadge (always "Drink Now"), most_recent_rating as stars if present.

```typescript
import Link from 'next/link';
import { ReadinessBadge } from './ReadinessBadge';
import { displayRating } from '@/lib/rating';
import type { Wine } from './WineCellarList'; // or define inline interface

interface DashboardShelfProps {
  wines: Wine[];
  ratingScale?: 'five_star' | 'hundred_point';
}

export function DashboardShelf({ wines, ratingScale = 'five_star' }: DashboardShelfProps) {
  if (wines.length === 0) {
    return (
      <p style={{
        color: '#9CA3AF',
        fontFamily: 'Open Sans, sans-serif',
        fontSize: '14px',
        textAlign: 'center',
        padding: '24px 0',
      }}>
        No wines are ready to drink right now.
      </p>
    );
  }

  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      overflowX: 'auto',
      WebkitOverflowScrolling: 'touch' as never,
      paddingBottom: '8px',
      scrollbarWidth: 'none',
    }}>
      {wines.map((wine) => {
        const ratingDisplay = wine.most_recent_rating != null
          ? (ratingScale === 'five_star'
              ? '★'.repeat(Math.round(wine.most_recent_rating / 20)) + '☆'.repeat(5 - Math.round(wine.most_recent_rating / 20))
              : String(wine.most_recent_rating))
          : null;

        return (
          <Link
            key={wine.id}
            href={`/wines/${wine.id}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minWidth: '160px',
              width: '160px',
              height: '120px',
              background: '#FAFAF7',
              border: '1px solid #E5E7EB',
              borderRadius: '2px',
              padding: '8px',
              textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            <div>
              <p style={{
                fontFamily: 'Open Sans, sans-serif',
                fontWeight: 700,
                fontSize: '14px',
                color: '#0A0A0A',
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {wine.name}
              </p>
              <p style={{
                fontFamily: 'Open Sans, sans-serif',
                fontSize: '12px',
                color: '#6B7280',
                margin: '2px 0 0',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {wine.producer} {wine.vintage}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {ratingDisplay && (
                <span style={{ color: '#FBCA5C', fontSize: '13px' }}>{ratingDisplay}</span>
              )}
              <ReadinessBadge badge="Drink Now" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
```

---

**app/page.tsx** — Dashboard Server Component. The default `/` landing route.

Fetches `GET /api/dashboard` (returns DashboardResponse from wave 2b). Also fetches user settings for rating scale display.

Renders (in order per UX-Mockup):

1. **Stat Tiles** (2×2 grid at 375px, 4-in-a-row at desktop):
   - Total Bottles (links to /cellar): Bone bg, 1px border, 8px padding, 2px radius
   - Unique Wines (links to /cellar)
   - Drink Now count (links to /cellar?readiness=Drink+Now): `#10B981` left accent border (4px), number in green
   - Approaching Peak count (links to /cellar?readiness=Approaching+Peak): `#F59E0B` left accent border, number in amber
   - Numbers: Montserrat 900, 36px. Labels: JetBrains Mono uppercase 11px `#9CA3AF`

2. **Drink Now Shelf**: section header "DRINK NOW" (JetBrains Mono uppercase), then `<DashboardShelf wines={data.drink_now_wines} ratingScale={ratingScale} />`

3. **Collection Breakdown** (below shelf):
   - **WINE TYPE**: bar list. Each row: wine_type label, bar (`#FBCA5C` fill on `#E5E7EB` track, 8px height), bottle_count, wine_count. Tappable → `/cellar?wine_type=[type]`
   - **COUNTRY / REGION** (top 10): bar list. Each row: country, bar, wine_count. Tappable → `/cellar?country=[country]`
   - **VINTAGE DECADE**: bar list. Each row: decade label (e.g., "2010s"), bar, wine_count. Tappable → `/cellar?vintage_min=[decade]&vintage_max=[decade+9]`
   - If no wines: hide breakdowns section or show "Add wines to see your collection breakdown."

4. **Recently Added** (5 wines): section header + list. Each item: name + vintage, date (Jan 10). Links to /wines/[id].

5. **Recently Consumed** (5 events): section header + list. Each item: wine_name · event_type badge, date. Links to /wines/[id].

6. **Highest Rated** (5 wines): section header + list. Each item: name, rating formatted per scale. Links to /wines/[id].

Empty states (from UserStories):
- Recently Added empty: "No wines added yet. [Add your first wine →]"
- Recently Consumed empty: "No consumption events recorded yet."
- Highest Rated empty: "Add tasting notes and ratings to see your top wines here."

```typescript
import Link from 'next/link';
import { DashboardShelf } from '@/components/DashboardShelf';
import { displayRating } from '@/lib/rating';
import type { DashboardResponse } from '@/lib/types'; // or inline interface

export default async function DashboardPage() {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  // Fetch dashboard data and settings in parallel
  const [dashRes, settingsRes] = await Promise.all([
    fetch(`${base}/api/dashboard`, { cache: 'no-store' }),
    fetch(`${base}/api/settings`, { cache: 'no-store' }),
  ]);

  const data: DashboardResponse | null = dashRes.ok ? await dashRes.json() : null;
  const settings = settingsRes.ok ? await settingsRes.json() : { rating_scale: 'five_star' };
  const ratingScale: 'five_star' | 'hundred_point' = settings?.rating_scale ?? 'five_star';

  // Graceful fallback if dashboard fetch fails
  const stats = data?.stats ?? { total_bottles: 0, unique_wines: 0, drink_now_count: 0, approaching_peak_count: 0 };
  const drinkNowWines = data?.drink_now_wines ?? [];
  const typeBreakdown = data?.type_breakdown ?? [];
  const countryBreakdown = data?.country_breakdown ?? [];
  const decadeBreakdown = data?.decade_breakdown ?? [];
  const recentlyAdded = data?.recently_added ?? [];
  const recentlyConsumed = data?.recently_consumed ?? [];
  const highestRated = data?.highest_rated ?? [];

  // For bar chart: find max values for relative bar widths
  const maxTypeBottles = Math.max(1, ...typeBreakdown.map((t) => t.bottle_count));
  const maxCountryWines = Math.max(1, ...countryBreakdown.map((c) => c.wine_count));
  const maxDecadeWines = Math.max(1, ...decadeBreakdown.map((d) => d.wine_count));

  const sectionLabelStyle: React.CSSProperties = {
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: '#9CA3AF',
    margin: '24px 0 12px',
    display: 'block',
  };

  const statTileStyle = (accentColor?: string): React.CSSProperties => ({
    background: '#FAFAF7',
    border: '1px solid #E5E7EB',
    borderLeft: accentColor ? `4px solid ${accentColor}` : '1px solid #E5E7EB',
    borderRadius: '2px',
    padding: '8px 12px',
    textDecoration: 'none',
    display: 'block',
    flex: 1,
    minWidth: 0,
  });

  return (
    <main style={{ background: '#FAFAF7', minHeight: '100vh', padding: '16px', maxWidth: '1200px', margin: '0 auto' }}>

      {/* Stat Tiles — 2×2 mobile, 4-in-a-row desktop */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '8px',
        marginBottom: '8px',
      }}>
        {/* Total Bottles */}
        <Link href="/cellar" style={statTileStyle()}>
          <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: '36px', color: '#0A0A0A', lineHeight: 1 }}>
            {stats.total_bottles}
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', textTransform: 'uppercase', color: '#9CA3AF', marginTop: '4px', letterSpacing: '0.05em' }}>
            Total Bottles
          </div>
        </Link>

        {/* Unique Wines */}
        <Link href="/cellar" style={statTileStyle()}>
          <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: '36px', color: '#0A0A0A', lineHeight: 1 }}>
            {stats.unique_wines}
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', textTransform: 'uppercase', color: '#9CA3AF', marginTop: '4px', letterSpacing: '0.05em' }}>
            Unique Wines
          </div>
        </Link>

        {/* Drink Now */}
        <Link href="/cellar?readiness=Drink+Now" style={statTileStyle('#10B981')}>
          <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: '36px', color: '#10B981', lineHeight: 1 }}>
            {stats.drink_now_count}
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', textTransform: 'uppercase', color: '#9CA3AF', marginTop: '4px', letterSpacing: '0.05em' }}>
            Drink Now
          </div>
        </Link>

        {/* Approaching Peak */}
        <Link href="/cellar?readiness=Approaching+Peak" style={statTileStyle('#F59E0B')}>
          <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: '36px', color: '#F59E0B', lineHeight: 1 }}>
            {stats.approaching_peak_count}
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', textTransform: 'uppercase', color: '#9CA3AF', marginTop: '4px', letterSpacing: '0.05em' }}>
            Approaching Peak
          </div>
        </Link>
      </div>

      {/* Drink Now Shelf */}
      <span style={sectionLabelStyle}>Drink Now</span>
      <DashboardShelf wines={drinkNowWines} ratingScale={ratingScale} />

      {/* Collection Breakdown */}
      {(typeBreakdown.length > 0 || countryBreakdown.length > 0 || decadeBreakdown.length > 0) ? (
        <section aria-label="Collection Breakdown">
          {/* Wine Type */}
          {typeBreakdown.length > 0 && (
            <>
              <span style={sectionLabelStyle}>Wine Type</span>
              {typeBreakdown.map((item) => (
                <Link key={item.wine_type} href={`/cellar?wine_type=${encodeURIComponent(item.wine_type)}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', textDecoration: 'none', color: '#0A0A0A' }}>
                  <span style={{ fontFamily: 'Open Sans, sans-serif', fontSize: '14px', minWidth: '80px' }}>{item.wine_type}</span>
                  <div style={{ flex: 1, background: '#E5E7EB', height: '8px', borderRadius: '2px' }}>
                    <div style={{ width: `${(item.bottle_count / maxTypeBottles) * 100}%`, background: '#FBCA5C', height: '8px', borderRadius: '2px' }} />
                  </div>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#6B7280', minWidth: '80px', textAlign: 'right' }}>
                    {item.bottle_count} btl · {item.wine_count} wines
                  </span>
                </Link>
              ))}
            </>
          )}

          {/* Country / Region */}
          {countryBreakdown.length > 0 && (
            <>
              <span style={sectionLabelStyle}>Country / Region (Top 10)</span>
              {countryBreakdown.map((item) => (
                <Link key={item.country} href={`/cellar?country=${encodeURIComponent(item.country)}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', textDecoration: 'none', color: '#0A0A0A' }}>
                  <span style={{ fontFamily: 'Open Sans, sans-serif', fontSize: '14px', minWidth: '80px' }}>{item.country}</span>
                  <div style={{ flex: 1, background: '#E5E7EB', height: '8px', borderRadius: '2px' }}>
                    <div style={{ width: `${(item.wine_count / maxCountryWines) * 100}%`, background: '#FBCA5C', height: '8px', borderRadius: '2px' }} />
                  </div>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#6B7280', minWidth: '60px', textAlign: 'right' }}>
                    {item.wine_count} wines →
                  </span>
                </Link>
              ))}
            </>
          )}

          {/* Vintage Decade */}
          {decadeBreakdown.length > 0 && (
            <>
              <span style={sectionLabelStyle}>Vintage Decade</span>
              {decadeBreakdown.map((item) => (
                <Link key={item.decade} href={`/cellar?vintage_min=${item.decade}&vintage_max=${item.decade + 9}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', textDecoration: 'none', color: '#0A0A0A' }}>
                  <span style={{ fontFamily: 'Open Sans, sans-serif', fontSize: '14px', minWidth: '80px' }}>{item.decade}s</span>
                  <div style={{ flex: 1, background: '#E5E7EB', height: '8px', borderRadius: '2px' }}>
                    <div style={{ width: `${(item.wine_count / maxDecadeWines) * 100}%`, background: '#FBCA5C', height: '8px', borderRadius: '2px' }} />
                  </div>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#6B7280', minWidth: '60px', textAlign: 'right' }}>
                    {item.wine_count} wines
                  </span>
                </Link>
              ))}
            </>
          )}
        </section>
      ) : (
        <p style={{ color: '#9CA3AF', fontFamily: 'Open Sans, sans-serif', fontSize: '14px', margin: '16px 0' }}>
          Add wines to see your collection breakdown.
        </p>
      )}

      {/* Recently Added */}
      <span style={sectionLabelStyle}>Recently Added</span>
      {recentlyAdded.length === 0 ? (
        <p style={{ color: '#9CA3AF', fontFamily: 'Open Sans, sans-serif', fontSize: '14px' }}>
          No wines added yet. <Link href="/wines/new" style={{ color: '#0A0A0A', textDecoration: 'underline' }}>Add your first wine →</Link>
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {recentlyAdded.map((wine) => (
            <li key={wine.id} style={{ borderBottom: '1px solid #E5E7EB', padding: '8px 0' }}>
              <Link href={`/wines/${wine.id}`} style={{ display: 'flex', justifyContent: 'space-between', textDecoration: 'none', color: '#0A0A0A' }}>
                <span style={{ fontFamily: 'Open Sans, sans-serif', fontSize: '14px', fontWeight: 600 }}>
                  {wine.name} {wine.vintage}
                </span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#9CA3AF' }}>
                  {new Date(wine.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* Recently Consumed */}
      <span style={sectionLabelStyle}>Recently Consumed</span>
      {recentlyConsumed.length === 0 ? (
        <p style={{ color: '#9CA3AF', fontFamily: 'Open Sans, sans-serif', fontSize: '14px' }}>
          No consumption events recorded yet.
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {recentlyConsumed.map((item) => (
            <li key={item.event_id} style={{ borderBottom: '1px solid #E5E7EB', padding: '8px 0' }}>
              <Link href={`/wines/${item.wine_id}`} style={{ display: 'flex', justifyContent: 'space-between', textDecoration: 'none', color: '#0A0A0A', alignItems: 'center' }}>
                <span style={{ fontFamily: 'Open Sans, sans-serif', fontSize: '14px' }}>
                  {item.wine_name} {item.vintage}
                  <span style={{
                    marginLeft: '8px',
                    display: 'inline-block',
                    padding: '1px 6px',
                    borderRadius: '2px',
                    background: item.event_type === 'Consumed' ? '#EF4444' : '#8B5CF6',
                    color: '#FFFFFF',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '10px',
                    textTransform: 'uppercase',
                  }}>
                    {item.event_type}
                  </span>
                </span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#9CA3AF' }}>
                  {new Date(item.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* Highest Rated */}
      <span style={sectionLabelStyle}>Highest Rated</span>
      {highestRated.length === 0 ? (
        <p style={{ color: '#9CA3AF', fontFamily: 'Open Sans, sans-serif', fontSize: '14px' }}>
          Add tasting notes and ratings to see your top wines here.
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {highestRated.map((item) => {
            const displayedRating = ratingScale === 'five_star'
              ? '★'.repeat(Math.round(item.rating / 20)) + '☆'.repeat(5 - Math.round(item.rating / 20))
              : String(item.rating);
            return (
              <li key={item.wine_id} style={{ borderBottom: '1px solid #E5E7EB', padding: '8px 0' }}>
                <Link href={`/wines/${item.wine_id}`} style={{ display: 'flex', justifyContent: 'space-between', textDecoration: 'none', color: '#0A0A0A', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'Open Sans, sans-serif', fontSize: '14px', fontWeight: 600 }}>
                    {item.wine_name} {item.vintage}
                  </span>
                  <span style={{ color: '#FBCA5C', fontSize: '14px' }}>{displayedRating} →</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

    </main>
  );
}
```

  </action>
  <verify>
```bash
# Verify files exist
ls app/page.tsx components/DashboardShelf.tsx && echo "DASHBOARD FILES EXIST"

# Verify DashboardShelf exports
grep -n 'export function DashboardShelf\|export default.*DashboardShelf' components/DashboardShelf.tsx && echo "DASHBOARD SHELF EXPORT OK"

# Verify DashboardShelf uses ReadinessBadge with "Drink Now"
grep -n 'ReadinessBadge\|Drink Now' components/DashboardShelf.tsx && echo "SHELF READINESS BADGE OK"

# Verify horizontal scroll shelf
grep -n 'overflowX.*auto\|overflow-x.*auto' components/DashboardShelf.tsx && echo "HORIZONTAL SCROLL OK"

# Verify empty shelf state
grep -n 'No wines are ready' components/DashboardShelf.tsx && echo "EMPTY SHELF STATE OK"

# Verify dashboard page server component (no "use client")
! grep -n '"use client"' app/page.tsx && echo "DASHBOARD IS SERVER COMPONENT OK"

# Verify dashboard fetches GET /api/dashboard
grep -n 'api/dashboard' app/page.tsx && echo "DASHBOARD API FETCH OK"

# Verify 4 stat tiles
grep -n 'total_bottles\|unique_wines\|drink_now_count\|approaching_peak_count' app/page.tsx && echo "4 STAT TILES OK"

# Verify stat tile links with readiness URL params
grep -n 'readiness=Drink' app/page.tsx && grep -n 'readiness=Approaching' app/page.tsx && echo "STAT TILE LINKS OK"

# Verify Drink Now shelf section
grep -n 'DashboardShelf' app/page.tsx && echo "DRINK NOW SHELF IN DASHBOARD OK"

# Verify 3 breakdown sections
grep -n 'type_breakdown\|country_breakdown\|decade_breakdown' app/page.tsx && echo "3 BREAKDOWNS OK"

# Verify breakdown links with URL params
grep -n 'wine_type=\|country=\|vintage_min=' app/page.tsx && echo "BREAKDOWN LINKS OK"

# Verify recently added / consumed / highest rated
grep -n 'recently_added\|recently_consumed\|highest_rated' app/page.tsx && echo "ACTIVITY LISTS OK"

# Verify empty states per UserStories
grep -n 'No wines added yet\|No consumption events\|Add tasting notes' app/page.tsx && echo "EMPTY STATES OK"

# Verify cache no-store (server-rendered, never cached)
grep -n 'cache.*no-store\|no-store' app/page.tsx && echo "NO-STORE CACHE OK"

# TypeScript check
npx tsc --noEmit 2>&1 | tail -10 || echo "TSC DONE"
```
  </verify>
  <done>
- components/DashboardShelf.tsx: exports `DashboardShelf`; horizontal-scroll container with overflow-x:auto + WebkitOverflowScrolling:touch; card 160px×120px, Bone bg, 1px border, 2px radius; each card links to /wines/[id]; shows wine name (truncated 1-line), producer + vintage, rating stars if present, ReadinessBadge with badge="Drink Now"; empty state: "No wines are ready to drink right now."
- app/page.tsx: Server Component (no "use client"); fetches GET /api/dashboard and GET /api/settings with cache:'no-store' in parallel; all fallback to 0/empty on fetch failure
- 4 stat tiles in 2×2 grid (mobile): Total Bottles → /cellar, Unique Wines → /cellar, Drink Now (green accent) → /cellar?readiness=Drink+Now, Approaching Peak (amber accent) → /cellar?readiness=Approaching+Peak; numbers in Montserrat 900 36px; labels in JetBrains Mono uppercase 11px
- Drink Now shelf: section label + DashboardShelf component with drink_now_wines[] from dashboard API
- 3 collection breakdowns: Wine Type (with bottle_count + wine_count, links to /cellar?wine_type=[type]), Country/Region top 10 (links to /cellar?country=[country]), Vintage Decade (links to /cellar?vintage_min=[decade]&vintage_max=[decade+9]); bar charts with Gold fill; hidden if no wines with "Add wines to see your collection breakdown."
- Recently Added (5): name + vintage + date, links to /wines/[id]; empty state with "Add your first wine →" link
- Recently Consumed (5): name + event type badge (red Consumed, purple Gifted) + date, links to /wines/[id]; empty state text
- Highest Rated (5): name + rating formatted per ratingScale, links to /wines/[id]; empty state text
- All content is server-rendered on every request (no stale cache states — NFR-007 / F05 badge-never-cached)
  </done>
</task>

</tasks>

<verification>
```bash
# ── Wave 3b complete check ──────────────────────────────────────────────

# 1. All output files exist
ls components/ReadinessBadge.tsx components/RatingWidget.tsx \
   components/WineCard.tsx components/WineCellarList.tsx \
   components/FilterPanel.tsx app/cellar/page.tsx \
   components/TastingNoteForm.tsx \
   "app/wines/[id]/notes/new/page.tsx" \
   app/page.tsx components/DashboardShelf.tsx && echo "ALL FILES OK"

# 2. Feature F3: cellar page + filter components
grep -n 'swa_cellar_search\|swa_cellar_filters\|swa_cellar_sort' components/WineCellarList.tsx && echo "F3 SESSION STORAGE OK"
grep -n 'initialFilters\|searchParams' app/cellar/page.tsx && echo "F3 URL PARAMS OK"
grep -n 'export.*CellarFilterState' components/FilterPanel.tsx && echo "F3 FILTER STATE TYPE OK"

# 3. Feature F4: tasting note form
grep -n 'swa_note_draft_' components/TastingNoteForm.tsx && echo "F4 DRAFT PRESERVATION OK"
grep -n 'RatingWidget' components/TastingNoteForm.tsx && echo "F4 RATING WIDGET USED OK"
grep -n 'api/wines.*notes' components/TastingNoteForm.tsx && echo "F4 POST NOTES OK"

# 4. Feature F5: ReadinessBadge uses computeReadinessBadge
grep -n 'computeReadinessBadge' components/ReadinessBadge.tsx && echo "F5 READINESS BADGE COMPUTED OK"
grep -n 'computeReadinessBadge' components/WineCellarList.tsx && echo "F5 READINESS FILTER IN CELLAR OK"

# 5. Feature F6: dashboard server-rendered with all 8 data sections
grep -n 'api/dashboard' app/page.tsx && echo "F6 DASHBOARD API OK"
grep -n 'drink_now_count\|approaching_peak_count\|total_bottles\|unique_wines' app/page.tsx && echo "F6 STAT TILES OK"
grep -n 'DashboardShelf' app/page.tsx && echo "F6 DRINK NOW SHELF OK"
grep -n 'type_breakdown\|country_breakdown\|decade_breakdown' app/page.tsx && echo "F6 BREAKDOWNS OK"
grep -n 'recently_added\|recently_consumed\|highest_rated' app/page.tsx && echo "F6 ACTIVITY LISTS OK"

# 6. Prior wave contracts satisfied
grep -n 'export function computeReadinessBadge' lib/readiness.ts && echo "READINESS LIB CONTRACT OK"
grep -n 'export function displayRating' lib/rating.ts && echo "RATING LIB CONTRACT OK"
grep -n 'export.*GET' app/api/dashboard/route.ts && echo "DASHBOARD API CONTRACT OK"

# 7. No "use client" in server pages
! grep -n '"use client"' app/page.tsx && echo "DASHBOARD IS SERVER COMPONENT OK"
! grep -n '"use client"' app/cellar/page.tsx && echo "CELLAR PAGE IS SERVER COMPONENT OK"

# 8. TypeScript final check
npx tsc --noEmit 2>&1 | tail -5 && echo "TSC FINAL OK"
```
</verification>

<success_criteria>
- /cellar page loads all wines from GET /api/wines; search bar filters by name/producer/grape/country/region with 150ms debounce; "Showing N of M wines" updates
- All 8 filter dimensions present in FilterPanel; OR within dimension, AND across; active filter chips show with ✕ dismiss; Clear All removes all; sessionStorage restored on back-navigation
- URL query params (?readiness=, ?wine_type=, ?location=, ?country=, ?vintage_min=, ?vintage_max=) correctly initialize filter state (overriding sessionStorage)
- ReadinessBadge shows correct color for all 5 states; never cached (computed at render via computeReadinessBadge)
- RatingWidget renders interactive 5-star (Gold ★☆ with 44px touch targets) or 100-pt numeric input based on scale prop
- TastingNoteForm at /wines/[id]/notes/new: draft preserved in sessionStorage on every field change; restored on remount; cleared on successful submit; rating sent as user-scale input (not normalized); redirects to /wines/[id] after save
- Dashboard at / renders server-side on every load: 4 stat tiles (0-safe), Drink Now shelf (or empty message), 3 breakdowns (hidden when empty), recently added/consumed/highest rated (with correct empty states)
- Stat tiles Drink Now + Approaching Peak link to /cellar with correct readiness URL param; breakdown segments link with dimension URL param
- No X-Frame-Options headers (checked from wave 1 next.config.mjs); all routes resolve to real pages (no 404s on NavBar links)
</success_criteria>

<output>
After completion, create `.planning/express/implement-the-full-simplewineapp-system-/03b-SUMMARY.md` with:
- Files created/modified
- Key implementation decisions (client-side filter pipeline order, sessionStorage graceful degradation, rating scale input convention)
- Integration contract values consumed from waves 2a and 2b (which exports used)
- Any deviations from spec (flag prominently)
</output>
