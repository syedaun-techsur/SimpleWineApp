---
phase: implement-the-full-simplewineapp-system
plan: 03a
type: execute
wave: 3a
depends_on: [1, 2a]
files_modified:
  - app/layout.tsx
  - app/globals.css
  - app/components/NavBar.tsx
  - app/components/QuantityControls.tsx
  - app/components/RemoveBottleModal.tsx
  - app/components/ConfirmModal.tsx
  - app/components/ReadinessBadge.tsx
  - app/wines/new/page.tsx
  - app/wines/[id]/page.tsx
  - app/wines/[id]/edit/page.tsx
  - app/locations/page.tsx
autonomous: true

features:
  implements: ["F0", "F1", "F2"]
  depends_on: ["F0", "F1", "F2"]
  enables: ["F3", "F4", "F5", "F6"]

must_haves:
  truths:
    - "NavBar renders at bottom (mobile) and top (desktop) with Dashboard, Cellar, Locations links plus + Add Wine — no dead nav links (NFR-010)"
    - "/wines/new renders a form with 6 required fields + expandable optional section; submits to POST /api/wines; redirects to /wines/[id] on success"
    - "/wines/[id]/edit renders all fields pre-populated; submits to PUT /api/wines/[id]; Location Unknown state shown when location deleted"
    - "/wines/[id] shows hero section (badge, rating, name, producer, type, location, quantity controls) + sections for drinking window, purchase, notes, tasting notes, bottle history, delete action"
    - "QuantityControls: [+] increments via PATCH delta:1; [-] opens RemoveBottleModal; both disabled at limits; Cellar Empty badge when qty=0"
    - "RemoveBottleModal: bottom sheet, 3 event type buttons, optional notes textarea (500 char), Confirm disabled until type selected; post-Consumed/Gifted shows tasting note prompt"
    - "ConfirmModal: used for delete wine and delete location; focus-trapped; ESC closes; scrim click does NOT close"
    - "/locations lists all locations alphabetically with wine counts, add form at top, inline rename, delete confirmation modal"
    - "All routes functional at 375px with no horizontal scroll (NFR-001)"
    - "TechSur brand applied: Gold #FBCA5C CTAs, Black #0A0A0A nav, Bone #FAFAF7 canvas, Montserrat 900 headings, Open Sans body, JetBrains Mono labels (NFR-008)"
  artifacts:
    - path: "app/layout.tsx"
      provides: "Root layout with Google Fonts (Montserrat 900, Open Sans, JetBrains Mono), global CSS, NavBar"
      exports: ["RootLayout"]
    - path: "app/globals.css"
      provides: "CSS custom properties for brand tokens, base resets, USWDS-compatible utility classes"
    - path: "app/components/NavBar.tsx"
      provides: "Mobile bottom tab bar + desktop top header; active route highlighting; + Add Wine CTA"
      exports: ["NavBar"]
    - path: "app/components/QuantityControls.tsx"
      provides: "'use client' component for + / - quantity on wine detail and cards; Cellar Empty badge at qty=0"
      exports: ["QuantityControls"]
    - path: "app/components/RemoveBottleModal.tsx"
      provides: "'use client' bottom sheet modal for bottle removal event selection; tasting note prompt after Consumed/Gifted"
      exports: ["RemoveBottleModal"]
    - path: "app/components/ConfirmModal.tsx"
      provides: "'use client' reusable confirmation modal (focus-trapped, ESC-closeable)"
      exports: ["ConfirmModal"]
    - path: "app/components/ReadinessBadge.tsx"
      provides: "Color-coded readiness badge pill using computeReadinessBadge(); 5 states"
      exports: ["ReadinessBadge"]
    - path: "app/wines/new/page.tsx"
      provides: "Server component shell that renders WineForm for new wine creation"
      exports: ["default (page)"]
    - path: "app/wines/[id]/page.tsx"
      provides: "Server component: fetches wine+notes+events from GET /api/wines/[id]; renders full detail page; 404 if not found"
      exports: ["default (page)"]
    - path: "app/wines/[id]/edit/page.tsx"
      provides: "Server component shell that renders WineForm pre-populated for edit"
      exports: ["default (page)"]
    - path: "app/locations/page.tsx"
      provides: "'use client' page: LocationsManager with add form, alphabetical list, inline rename, delete modal"
      exports: ["default (page)"]
  key_links:
    - from: "app/wines/new/page.tsx"
      to: "app/api/wines/route.ts"
      via: "fetch POST /api/wines from WineForm client action"
      pattern: "api/wines"
    - from: "app/wines/[id]/page.tsx"
      to: "app/api/wines/[id]/route.ts"
      via: "Server component fetch GET /api/wines/[id]"
      pattern: "api/wines.*id"
    - from: "app/components/QuantityControls.tsx"
      to: "app/api/wines/[id]/quantity/route.ts"
      via: "PATCH /api/wines/[id]/quantity"
      pattern: "quantity"
    - from: "app/locations/page.tsx"
      to: "app/api/locations/route.ts"
      via: "GET/POST/PUT/DELETE /api/locations"
      pattern: "api/locations"

integration_contracts:
  requires:
    - from_plan: "01"
      artifact: "next.config.mjs"
      exports: ["No X-Frame-Options header", "output: standalone"]
      verify: "grep -n 'X-Content-Type-Options' next.config.mjs && ! grep -n 'X-Frame-Options' next.config.mjs && echo CONTRACT_OK"
    - from_plan: "2a"
      artifact: "app/api/wines/route.ts"
      exports: ["GET /api/wines → { wines: Wine[] }", "POST /api/wines → Wine (201)"]
      verify: "grep -n 'export.*GET\\|export.*POST' app/api/wines/route.ts && echo CONTRACT_OK"
    - from_plan: "2a"
      artifact: "app/api/wines/[id]/route.ts"
      exports: ["GET /api/wines/[id] → { wine, tasting_notes, bottle_events }", "PUT /api/wines/[id] → Wine", "DELETE /api/wines/[id] → 204"]
      verify: "grep -n 'export.*GET\\|export.*PUT\\|export.*DELETE' app/api/wines/\\[id\\]/route.ts && echo CONTRACT_OK"
    - from_plan: "2a"
      artifact: "app/api/wines/[id]/quantity/route.ts"
      exports: ["PATCH /api/wines/[id]/quantity → { quantity, event_id }"]
      verify: "grep -n 'export.*PATCH' app/api/wines/\\[id\\]/quantity/route.ts && echo CONTRACT_OK"
    - from_plan: "2a"
      artifact: "app/api/locations/route.ts"
      exports: ["GET /api/locations → { locations: LocationWithCount[] }", "POST /api/locations → LocationWithCount (201)"]
      verify: "grep -n 'export.*GET\\|export.*POST' app/api/locations/route.ts && echo CONTRACT_OK"
    - from_plan: "2a"
      artifact: "app/api/locations/[id]/route.ts"
      exports: ["PUT /api/locations/[id] → Location (200)", "DELETE /api/locations/[id] → 204"]
      verify: "grep -n 'export.*PUT\\|export.*DELETE' app/api/locations/\\[id\\]/route.ts && echo CONTRACT_OK"
  provides:
    - artifact: "app/components/NavBar.tsx"
      exports: ["NavBar"]
      shape: |
        'use client'
        export function NavBar() — renders bottom tab bar (mobile) + top header (desktop)
        Routes: / (Dashboard), /cellar (Cellar), /locations (Locations), /wines/new (+ Add Wine)
        Active route: Gold #FBCA5C highlight; Montserrat 900 brand mark
      verify: "grep -n 'export.*NavBar\\|export default' app/components/NavBar.tsx && grep -n '/locations\\|/cellar' app/components/NavBar.tsx && echo CONTRACT_OK"
    - artifact: "app/components/QuantityControls.tsx"
      exports: ["QuantityControls"]
      shape: |
        'use client'
        interface QuantityControlsProps { wineId: number; initialQuantity: number; wineName: string }
        export function QuantityControls(props: QuantityControlsProps): JSX.Element
        // Calls PATCH /api/wines/[id]/quantity; renders RemoveBottleModal on decrement
      verify: "grep -n 'export.*QuantityControls\\|export default' app/components/QuantityControls.tsx && echo CONTRACT_OK"
    - artifact: "app/components/ReadinessBadge.tsx"
      exports: ["ReadinessBadge"]
      shape: |
        interface ReadinessBadgeProps { start?: number | null; end?: number | null }
        export function ReadinessBadge(props): JSX.Element
        // Computes badge client-side using current year; 5 states: Drink Now/Hold/Approaching Peak/Past Window/No Window Set
      verify: "grep -n 'export.*ReadinessBadge\\|export default' app/components/ReadinessBadge.tsx && echo CONTRACT_OK"
    - artifact: "app/components/ConfirmModal.tsx"
      exports: ["ConfirmModal"]
      shape: |
        interface ConfirmModalProps { title: string; body: string; onConfirm: () => void; onCancel: () => void; confirmLabel?: string; danger?: boolean }
        export function ConfirmModal(props): JSX.Element
        // Focus-trapped, ESC closes, scrim click does NOT close
      verify: "grep -n 'export.*ConfirmModal\\|export default' app/components/ConfirmModal.tsx && echo CONTRACT_OK"
    - artifact: "app/wines/[id]/page.tsx"
      exports: ["default page — wine detail server component"]
      shape: |
        Server component: fetches GET /api/wines/[id]; renders wine hero, tasting notes, bottle history
        404 response renders "Wine not found." page
        Renders QuantityControls (client), ReadinessBadge, tasting notes list, bottle events list
      verify: "grep -n 'export default\\|export async function' app/wines/\\[id\\]/page.tsx && echo CONTRACT_OK"
    - artifact: "app/locations/page.tsx"
      exports: ["default page — locations manager client component"]
      shape: |
        'use client' page; fetches GET /api/locations on mount
        Add form (POST /api/locations), inline rename (PUT /api/locations/[id]), delete modal (DELETE /api/locations/[id])
        Location name links to /cellar?location=[name]
      verify: "grep -n 'export default\\|use client' app/locations/page.tsx && grep -n '/cellar' app/locations/page.tsx && echo CONTRACT_OK"
---

<objective>
Build all P0 frontend UI: the brand/layout system, NavBar, shared UI components (QuantityControls, RemoveBottleModal, ConfirmModal, ReadinessBadge), wine create/edit form pages, wine detail page, and the storage locations management page.

Purpose: These are the core interactive surfaces the user touches for F0 (Wine CRUD), F1 (Quantity & Bottle Events), and F2 (Storage Locations). Every subsequent wave builds on the NavBar and shared components established here.

Output:
- app/layout.tsx: Root layout with Google Fonts, global CSS link, NavBar
- app/globals.css: TechSur brand tokens as CSS custom properties + base styles
- app/components/NavBar.tsx: Mobile bottom tab bar + desktop header, gold active states, + Add Wine CTA
- app/components/QuantityControls.tsx: [−]/[+] with Cellar Empty badge, RemoveBottleModal integration
- app/components/RemoveBottleModal.tsx: Bottom sheet, event type selection, 500-char notes, tasting note prompt
- app/components/ConfirmModal.tsx: Reusable focus-trapped confirmation dialog
- app/components/ReadinessBadge.tsx: 5-state computed readiness pill (uses current year, never cached)
- app/wines/new/page.tsx + WineForm inline: create form with required/optional sections, inline validation
- app/wines/[id]/page.tsx: Server-fetched detail page with all sections
- app/wines/[id]/edit/page.tsx: Pre-populated edit form, Location Unknown state
- app/locations/page.tsx: LocationsManager (add, rename, delete with modal)
</objective>

<feature_dependencies>
Implements: F0: Wine Inventory CRUD UI (WineForm for /wines/new and /wines/[id]/edit, wine detail page /wines/[id] with all fields + delete flow)
            F1: Quantity & Bottle Status UI (QuantityControls + RemoveBottleModal on wine detail and cellar cards, Cellar Empty badge, post-consume tasting note prompt)
            F2: Storage Locations UI (/locations page: LocationsManager with add/rename/delete, ConfirmModal for delete, drill-through links to /cellar)
Depends on: F0, F1, F2 API routes from wave 2a (GET/POST /api/wines, GET/PUT/DELETE /api/wines/[id], PATCH /api/wines/[id]/quantity, GET/POST /api/locations, PUT/DELETE /api/locations/[id])
Enables: F3 (WineCellarList uses NavBar, QuantityControls, ReadinessBadge), F4 (TastingNoteForm uses ConfirmModal), F5 (ReadinessBadge reused on WineForm live preview), F6 (Dashboard uses ReadinessBadge, NavBar)
</feature_dependencies>

<execution_context>
@/root/.config/opencode/pivota_spec-framework/workflows/execute-plan.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/express/implement-the-full-simplewineapp-system-/WAVE-SCHEDULE.md
@project_specs/TechArch-SimpleWineApp.md
@project_specs/UX-Mockup-SimpleWineApp.md
@.planning/express/implement-the-full-simplewineapp-system-/01-SUMMARY.md
@.planning/express/implement-the-full-simplewineapp-system-/02a-SUMMARY.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Brand system, root layout, NavBar, and shared UI primitives</name>
  <files>
    app/layout.tsx
    app/globals.css
    app/components/NavBar.tsx
    app/components/ConfirmModal.tsx
    app/components/ReadinessBadge.tsx
  </files>
  <action>
Establish the TechSur brand system, root layout with Google Fonts, NavBar (mobile bottom tab bar + desktop header), reusable ConfirmModal, and ReadinessBadge.

---

**app/globals.css** — CSS custom properties for brand tokens + base resets:

```css
/* TechSur brand tokens */
:root {
  --color-gold: #FBCA5C;
  --color-black: #0A0A0A;
  --color-bone: #FAFAF7;
  --color-border: #E5E7EB;
  --color-muted: #9CA3AF;
  --color-error: #EF4444;
  --color-success: #10B981;
  --color-hold: #3B82F6;
  --color-approaching: #F59E0B;
  --color-past: #6B7280;

  --font-display: 'Montserrat', sans-serif;
  --font-body: 'Open Sans', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  --radius-sm: 2px;
  --radius-modal: 8px;

  --touch-target: 44px;
}

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body {
  background: var(--color-bone);
  color: var(--color-black);
  font-family: var(--font-body);
  font-size: 16px;
  line-height: 1.5;
  -webkit-text-size-adjust: 100%;
}

/* Prevent horizontal overflow globally */
body {
  overflow-x: hidden;
  max-width: 100vw;
}

/* Typography */
h1, h2, h3, .display {
  font-family: var(--font-display);
  font-weight: 900;
}

.label-mono {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-muted);
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: var(--touch-target);
  padding: 0 16px;
  border-radius: var(--radius-sm);
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  border: 2px solid transparent;
  transition: opacity 0.15s;
  text-decoration: none;
}

.btn-primary {
  background: var(--color-gold);
  color: var(--color-black);
}

.btn-secondary {
  background: transparent;
  color: var(--color-black);
  border-color: var(--color-black);
}

.btn-danger {
  background: var(--color-error);
  color: #ffffff;
}

.btn:disabled,
.btn[aria-disabled="true"] {
  background: var(--color-muted);
  color: #ffffff;
  cursor: not-allowed;
  pointer-events: none;
}

/* Cards */
.card {
  background: var(--color-bone);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 12px;
}

/* Inline error */
.field-error {
  color: var(--color-error);
  font-size: 12px;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.input-error {
  border-color: var(--color-error) !important;
  border-width: 2px;
}

/* Form inputs */
input[type="text"],
input[type="number"],
input[type="date"],
select,
textarea {
  width: 100%;
  height: var(--touch-target);
  padding: 0 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--color-black);
  background: #ffffff;
  appearance: none;
}

textarea {
  height: auto;
  min-height: 80px;
  padding: 10px 12px;
  resize: vertical;
}

select {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%230A0A0A' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 36px;
}

/* Section headers */
.section-header {
  font-family: var(--font-mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-muted);
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 8px;
  margin-bottom: 16px;
  margin-top: 24px;
}

/* Scrim overlay */
.scrim {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 100;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

/* Badge pills */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
  white-space: nowrap;
}

/* Bottom nav padding on mobile */
@media (max-width: 767px) {
  main {
    padding-bottom: 72px; /* space for bottom nav */
  }
}

/* Page content padding */
.page-content {
  max-width: 768px;
  margin: 0 auto;
  padding: 16px;
}

@media (min-width: 1024px) {
  .page-content {
    max-width: 1200px;
    padding: 24px 32px;
  }
}

/* Toast container */
.toast-container {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 200;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
  min-width: 280px;
  max-width: calc(100vw - 32px);
}

@media (min-width: 768px) {
  .toast-container {
    left: auto;
    right: 16px;
    transform: none;
  }
}

.toast {
  background: var(--color-black);
  color: #ffffff;
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  font-size: 14px;
  border-left: 4px solid;
  pointer-events: all;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.toast-success { border-color: var(--color-success); }
.toast-error { border-color: var(--color-error); }
```

---

**app/layout.tsx** — Root layout. Import Google Fonts via next/font, link globals.css, render NavBar. No X-Frame-Options (enforced via next.config.mjs already). Dev server binds to 0.0.0.0 via package.json `"dev": "next dev -H 0.0.0.0"`.

```tsx
import type { Metadata } from 'next';
import { Montserrat, Open_Sans } from 'next/font/google';
import './globals.css';
import { NavBar } from './components/NavBar';

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['900'],
  variable: '--font-montserrat',
  display: 'swap',
});

const openSans = Open_Sans({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-opensans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SimpleWineApp',
  description: 'Your personal wine cellar',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${montserrat.variable} ${openSans.variable}`}>
      <body>
        <NavBar />
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}
```

Update `globals.css` font fallbacks to use the CSS variables:
```css
:root {
  --font-display: var(--font-montserrat, 'Montserrat', sans-serif);
  --font-body: var(--font-opensans, 'Open Sans', sans-serif);
  --font-mono: 'JetBrains Mono', monospace;
}
```

Also update `package.json` dev script to bind to 0.0.0.0:
```json
"dev": "next dev -H 0.0.0.0 -p 3000"
```

---

**app/components/NavBar.tsx** — Mobile bottom tab bar (375px) + desktop top header (1024px+). UX: Gold active indicator, JetBrains Mono labels, Black background. Three primary nav items (Dashboard → `/`, Cellar → `/cellar`, Locations → `/locations`) + FAB / header button for `+ Add Wine` → `/wines/new`.

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/', icon: '⬛' },
  { label: 'Cellar', href: '/cellar', icon: '🍷' },
  { label: 'Locations', href: '/locations', icon: '📍' },
] as const;

export function NavBar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Desktop top header */}
      <header style={{
        display: 'none',
        background: 'var(--color-black)',
        color: 'var(--color-bone)',
        padding: '0 32px',
        height: '56px',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
      className="desktop-header"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <Link href="/" style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            fontSize: '18px',
            color: 'var(--color-bone)',
            textDecoration: 'none',
          }}>
            🍷 SimpleWineApp
          </Link>
          <nav aria-label="Primary navigation" style={{ display: 'flex', gap: '24px' }}>
            {NAV_ITEMS.map(item => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: isActive(item.href) ? 'var(--color-gold)' : 'var(--color-bone)',
                  textDecoration: isActive(item.href) ? 'none' : 'none',
                  borderBottom: isActive(item.href) ? '2px solid var(--color-gold)' : '2px solid transparent',
                  paddingBottom: '4px',
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <Link
          href="/wines/new"
          className="btn btn-primary"
          style={{ fontSize: '13px', minHeight: '36px', padding: '0 16px' }}
        >
          + Add Wine
        </Link>
      </header>

      {/* Mobile bottom tab bar */}
      <nav
        aria-label="Primary navigation"
        className="mobile-nav"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '56px',
          background: 'var(--color-black)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          zIndex: 50,
          borderTop: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        {NAV_ITEMS.map(item => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                padding: '8px 16px',
                textDecoration: 'none',
                color: active ? 'var(--color-gold)' : 'var(--color-muted)',
                minWidth: '64px',
                minHeight: '44px',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: '20px' }}>{item.icon}</span>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Mobile FAB for + Add Wine */}
      <Link
        href="/wines/new"
        aria-label="Add wine"
        className="mobile-fab"
        style={{
          position: 'fixed',
          bottom: '72px',
          right: '16px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'var(--color-gold)',
          color: 'var(--color-black)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          fontWeight: 700,
          textDecoration: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          zIndex: 49,
        }}
      >
        +
      </Link>

      <style>{`
        @media (min-width: 1024px) {
          .desktop-header { display: flex !important; }
          .mobile-nav { display: none !important; }
          .mobile-fab { display: none !important; }
          main { padding-bottom: 0 !important; }
        }
      `}</style>
    </>
  );
}
```

---

**app/components/ReadinessBadge.tsx** — 5-state readiness badge. Computes from current year on every render (never cached). Used on wine detail, cards, and form preview.

```tsx
interface ReadinessBadgeProps {
  start?: number | null;
  end?: number | null;
  size?: 'sm' | 'md';
}

type BadgeState = 'drink-now' | 'hold' | 'approaching' | 'past' | 'no-window' | 'cellar-empty';

export function computeReadinessBadge(start?: number | null, end?: number | null): BadgeState {
  if (!start && !end) return 'no-window';
  const cy = new Date().getFullYear();
  // start-only window
  if (start && !end) {
    if (cy >= start) return 'drink-now';
    if (cy === start - 1 || cy === start - 2) return 'approaching';
    return 'hold';
  }
  // end-only window
  if (!start && end) {
    if (cy > end) return 'past';
    return 'drink-now';
  }
  // Both set
  if (cy > end!) return 'past';
  if (cy >= start! && cy <= end!) return 'drink-now';
  if (cy === start! - 1 || cy === start! - 2) return 'approaching';
  return 'hold';
}

const BADGE_CONFIG: Record<BadgeState, { label: string; bg: string; color: string }> = {
  'drink-now':   { label: 'Drink Now',       bg: '#10B981', color: '#ffffff' },
  'hold':        { label: 'Hold',             bg: '#3B82F6', color: '#ffffff' },
  'approaching': { label: 'Approaching Peak', bg: '#F59E0B', color: '#0A0A0A' },
  'past':        { label: 'Past Window',      bg: '#6B7280', color: '#ffffff' },
  'no-window':   { label: 'No Window Set',    bg: '#9CA3AF', color: '#0A0A0A' },
  'cellar-empty':{ label: 'Cellar Empty',     bg: '#D1D5DB', color: '#0A0A0A' },
};

export function ReadinessBadge({ start, end, size = 'md' }: ReadinessBadgeProps) {
  const state = computeReadinessBadge(start, end);
  const config = BADGE_CONFIG[state];
  return (
    <span
      className="badge"
      style={{
        background: config.bg,
        color: config.color,
        fontSize: size === 'sm' ? '10px' : '11px',
      }}
    >
      {config.label}
    </span>
  );
}

export function CellarEmptyBadge() {
  const config = BADGE_CONFIG['cellar-empty'];
  return (
    <span
      className="badge"
      style={{ background: config.bg, color: config.color }}
    >
      Cellar Empty
    </span>
  );
}
```

---

**app/components/ConfirmModal.tsx** — Reusable focus-trapped confirmation modal. Used for delete wine and delete location. ESC closes; scrim click does NOT close (prevents accidental dismissal of destructive action).

```tsx
'use client';

import { useEffect, useRef } from 'react';

interface ConfirmModalProps {
  title: string;
  body: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
}

export function ConfirmModal({
  title, body, onConfirm, onCancel,
  confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  danger = false, loading = false,
}: ConfirmModalProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  // Focus cancel button on open
  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  // ESC key closes
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
      // Tab trap
      if (e.key === 'Tab') {
        const focusable = [cancelRef.current!, confirmRef.current!].filter(Boolean);
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onCancel]);

  return (
    <div
      className="scrim"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      // Note: scrim click does NOT close (prevents accidental destructive dismissal)
    >
      <div style={{
        background: 'var(--color-bone)',
        borderRadius: 'var(--radius-modal)',
        padding: '24px',
        width: '100%',
        maxWidth: '340px',
        margin: '0 16px 16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      }}>
        <h2 id="confirm-title" style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 900,
          fontSize: '18px',
          marginBottom: '12px',
        }}>
          {title}
        </h2>
        <p style={{ fontSize: '14px', color: '#374151', marginBottom: '24px', lineHeight: 1.5 }}>
          {body}
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="btn btn-secondary"
            style={{ minHeight: '40px', fontSize: '13px' }}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            style={{ minHeight: '40px', fontSize: '13px' }}
            disabled={loading}
          >
            {loading ? 'Deleting...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
```
  </action>
  <verify>
```bash
# Brand system files exist
ls app/globals.css app/layout.tsx && echo "LAYOUT FILES OK"

# NavBar exports correct
grep -n 'export.*NavBar' app/components/NavBar.tsx && echo "NAVBAR EXPORT OK"

# All required nav routes present in NavBar
grep -n "href=\"/\"" app/components/NavBar.tsx && echo "DASHBOARD LINK OK"
grep -n "href=\"/cellar\"" app/components/NavBar.tsx && echo "CELLAR LINK OK"
grep -n "href=\"/locations\"" app/components/NavBar.tsx && echo "LOCATIONS LINK OK"
grep -n "href=\"/wines/new\"" app/components/NavBar.tsx && echo "ADD WINE LINK OK"

# ReadinessBadge exports
grep -n 'export function ReadinessBadge\|export function computeReadinessBadge' app/components/ReadinessBadge.tsx && echo "READINESS BADGE OK"

# ConfirmModal exports
grep -n 'export function ConfirmModal' app/components/ConfirmModal.tsx && echo "CONFIRM MODAL OK"

# No X-Frame-Options in next.config.mjs (inherited from wave 1)
! grep -n 'X-Frame-Options' next.config.mjs && echo "NO XFRAME HEADER OK"

# JetBrains Mono referenced in CSS
grep -n 'JetBrains Mono' app/globals.css && echo "MONO FONT OK"
grep -n '#FBCA5C\|--color-gold' app/globals.css && echo "GOLD TOKEN OK"
grep -n '#0A0A0A\|--color-black' app/globals.css && echo "BLACK TOKEN OK"
grep -n '#FAFAF7\|--color-bone' app/globals.css && echo "BONE TOKEN OK"
```
  </verify>
  <done>
- app/globals.css: all TechSur CSS custom properties defined (--color-gold #FBCA5C, --color-black #0A0A0A, --color-bone #FAFAF7); JetBrains Mono, Montserrat 900, Open Sans font stacks; .btn-primary (Gold bg Black text), .btn-danger (red), .btn-secondary; .badge pill; .field-error; input/textarea/select base styles; section-header mono style; bottom padding for mobile nav; toast container styles
- app/layout.tsx: Google Fonts loaded via next/font (Montserrat 900, Open Sans); NavBar rendered; metadata set
- app/components/NavBar.tsx: mobile bottom tab bar (56px, Black bg) + desktop top header (Black bg) with all 3 nav links (/→Dashboard, /cellar→Cellar, /locations→Locations) plus + Add Wine CTA (/wines/new); Gold active indicator; JetBrains Mono labels; mobile FAB (+) at bottom-right above tab bar; responsive via CSS media query ≥1024px
- app/components/ReadinessBadge.tsx: exports ReadinessBadge, computeReadinessBadge, CellarEmptyBadge; 5-state logic (Drink Now, Hold, Approaching Peak, Past Window, No Window Set) using current year — never cached
- app/components/ConfirmModal.tsx: exports ConfirmModal; focus-trapped (Tab cycles Cancel↔Confirm); ESC closes; scrim click does NOT close; danger=true renders red confirm button
  </done>

  <feature_dependencies>
  Implements: F0 (WineForm validation UI patterns, ConfirmModal for delete wine), F1 (ReadinessBadge, CellarEmptyBadge), F2 (ConfirmModal for delete location)
  Depends on: next.config.mjs (wave 1, no frame-blocking headers)
  Enables: All subsequent components use NavBar, brand tokens, and ReadinessBadge/ConfirmModal
  </feature_dependencies>
</task>

<task type="auto">
  <name>Task 2: WineForm (create/edit), wine detail page, QuantityControls, RemoveBottleModal, and /locations page</name>
  <files>
    app/components/QuantityControls.tsx
    app/components/RemoveBottleModal.tsx
    app/wines/new/page.tsx
    app/wines/[id]/page.tsx
    app/wines/[id]/edit/page.tsx
    app/locations/page.tsx
  </files>
  <action>
Build the core interactive pages and components: WineForm (embedded inline in the page files for server→client boundary clarity), wine detail, QuantityControls, RemoveBottleModal, and LocationsManager.

---

**Design constraints for all components:**
- All inputs: height 44px (--touch-target), 2px radius, border #E5E7EB
- All primary buttons: Gold bg (#FBCA5C), Black text, uppercase, 2px radius
- Error text: #EF4444, 12px, "⚠ [message]"
- Required labels: JetBrains Mono uppercase 11px, with " *" suffix
- Mobile-first: no horizontal overflow at 375px
- Section dividers: .section-header class (mono uppercase)

---

**app/components/QuantityControls.tsx** — Client component for [−]/[+] buttons. PATCH delta:1 for increment (no modal). [−] opens RemoveBottleModal. Cellar Empty badge when qty=0. Disabled states at limits.

```tsx
'use client';

import { useState } from 'react';
import { CellarEmptyBadge } from './ReadinessBadge';
import { RemoveBottleModal } from './RemoveBottleModal';
import { useRouter } from 'next/navigation';

interface QuantityControlsProps {
  wineId: number;
  initialQuantity: number;
  wineName: string;
}

export function QuantityControls({ wineId, initialQuantity, wineName }: QuantityControlsProps) {
  const [quantity, setQuantity] = useState(initialQuantity);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleIncrement = async () => {
    if (quantity >= 9999 || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/wines/${wineId}/quantity`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta: 1 }),
      });
      if (res.ok) {
        const data = await res.json();
        setQuantity(data.quantity);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {quantity === 0 && <CellarEmptyBadge />}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: quantity === 0 ? '8px' : '0' }}>
        <button
          onClick={() => quantity > 0 && setShowModal(true)}
          disabled={quantity === 0 || loading}
          aria-disabled={quantity === 0}
          aria-label="Remove a bottle"
          style={{
            width: '44px', height: '44px',
            borderRadius: 'var(--radius-sm)',
            background: quantity === 0 ? 'var(--color-muted)' : 'var(--color-black)',
            color: '#ffffff',
            fontSize: '20px',
            border: 'none',
            cursor: quantity === 0 ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          −
        </button>
        <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '18px', minWidth: '24px', textAlign: 'center' }}>
          {quantity}
        </span>
        <button
          onClick={handleIncrement}
          disabled={quantity >= 9999 || loading}
          aria-disabled={quantity >= 9999}
          aria-label="Add a bottle"
          style={{
            width: '44px', height: '44px',
            borderRadius: 'var(--radius-sm)',
            background: quantity >= 9999 ? 'var(--color-muted)' : 'var(--color-black)',
            color: '#ffffff',
            fontSize: '20px',
            border: 'none',
            cursor: quantity >= 9999 ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          +
        </button>
      </div>
      {showModal && (
        <RemoveBottleModal
          wineId={wineId}
          wineName={wineName}
          onClose={() => setShowModal(false)}
          onSuccess={(newQty) => {
            setQuantity(newQty);
            setShowModal(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
```

---

**app/components/RemoveBottleModal.tsx** — Bottom sheet modal for bottle removal. Event type selection required before Confirm is enabled. 500-char notes. Post-Consumed/Gifted shows tasting note prompt inline.

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type EventType = 'Consumed' | 'Gifted' | 'Opened';

interface RemoveBottleModalProps {
  wineId: number;
  wineName: string;
  onClose: () => void;
  onSuccess: (newQty: number) => void;
}

export function RemoveBottleModal({ wineId, wineName, onClose, onSuccess }: RemoveBottleModalProps) {
  const [selectedType, setSelectedType] = useState<EventType | null>(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showNotePrompt, setShowNotePrompt] = useState(false);
  const router = useRouter();

  const handleConfirm = async () => {
    if (!selectedType || loading) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/wines/${wineId}/quantity`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta: -1, event_type: selectedType, note: note || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Could not remove bottle. Please try again.');
        return;
      }
      onSuccess(data.quantity);
      if (selectedType === 'Consumed' || selectedType === 'Gifted') {
        setShowNotePrompt(true);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (showNotePrompt) {
    return (
      <div className="scrim" role="dialog" aria-modal="true" aria-label="Add tasting note prompt">
        <div style={{
          background: 'var(--color-bone)',
          borderRadius: 'var(--radius-modal) var(--radius-modal) 0 0',
          padding: '24px',
          width: '100%',
          maxWidth: '480px',
        }}>
          <p style={{ fontSize: '16px', marginBottom: '8px' }}>
            🍷 Bottle marked as {selectedType?.toLowerCase()}!
          </p>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '16px', marginBottom: '16px' }}>
            {wineName}
          </p>
          <p style={{ fontSize: '14px', marginBottom: '20px', color: '#374151' }}>
            Would you like to add a tasting note?
          </p>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <a
              href={`/wines/${wineId}/notes/new`}
              className="btn btn-primary"
              style={{ fontSize: '14px', minHeight: '44px' }}
            >
              Add a Note
            </a>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: '14px', padding: '8px' }}
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    );
  }

  const EVENT_TYPES: EventType[] = ['Consumed', 'Gifted', 'Opened'];

  return (
    <div
      className="scrim"
      role="dialog"
      aria-modal="true"
      aria-label="Remove a bottle"
    >
      <div style={{
        background: 'var(--color-bone)',
        borderRadius: 'var(--radius-modal) var(--radius-modal) 0 0',
        padding: '24px',
        width: '100%',
        maxWidth: '480px',
      }}>
        {/* Drag handle */}
        <div style={{ width: '40px', height: '4px', background: '#D1D5DB', borderRadius: '2px', margin: '0 auto 20px' }} />

        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '18px', marginBottom: '4px' }}>
          Remove a Bottle
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--color-muted)', marginBottom: '20px' }}>{wineName}</p>

        <p style={{ fontSize: '14px', marginBottom: '12px', fontWeight: 600 }}>
          What happened to this bottle?
        </p>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {EVENT_TYPES.map(type => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              style={{
                flex: 1,
                height: '44px',
                borderRadius: 'var(--radius-sm)',
                border: '2px solid',
                borderColor: selectedType === type ? 'var(--color-gold)' : 'var(--color-border)',
                background: selectedType === type ? 'var(--color-gold)' : 'transparent',
                color: 'var(--color-black)',
                fontFamily: 'var(--font-body)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
              }}
            >
              {type}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label className="label-mono" style={{ display: 'block', marginBottom: '6px' }}>
            Notes (optional)
          </label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value.slice(0, 500))}
            placeholder="Any notes about this bottle..."
            rows={3}
            style={{ resize: 'none' }}
          />
          <div style={{ textAlign: 'right', fontSize: '11px', color: note.length > 450 ? 'var(--color-error)' : 'var(--color-muted)', marginTop: '4px' }}>
            {note.length}/500
          </div>
        </div>

        {error && <p className="field-error" style={{ marginBottom: '12px' }}>⚠ {error}</p>}

        <button
          onClick={handleConfirm}
          disabled={!selectedType || loading}
          className="btn"
          style={{
            width: '100%',
            background: !selectedType ? 'var(--color-muted)' : 'var(--color-gold)',
            color: 'var(--color-black)',
            marginBottom: '12px',
          }}
        >
          {loading ? 'Removing...' : 'Confirm Removal'}
        </button>

        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: '14px', display: 'block', margin: '0 auto', padding: '8px' }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
```

---

**app/wines/new/page.tsx** — Server component that renders WineForm for new wine creation. Fetches locations for dropdown. WineForm is inlined as a client component. Required fields top section; optional fields behind expand toggle on mobile, always visible on desktop.

```tsx
import Link from 'next/link';

// Inline WineForm client component
// (Keeping it co-located avoids a separate file for this wave; wave 3b can extract if needed)
import { WineFormClient } from './WineFormClient';

export default async function NewWinePage() {
  // Fetch locations for the dropdown (server-side)
  let locations: { id: number; name: string }[] = [];
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${base}/api/locations`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      locations = data.locations || [];
    }
  } catch {
    // locations stays empty; form shows no-locations guidance
  }

  return (
    <div className="page-content">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '24px' }}>Add Wine</h1>
        <Link href="/" style={{ color: '#6B7280', fontSize: '14px', textDecoration: 'none' }}>← Cancel</Link>
      </div>
      <WineFormClient locations={locations} mode="create" />
    </div>
  );
}
```

Create **app/wines/new/WineFormClient.tsx** — `'use client'` WineForm component used by both /wines/new and /wines/[id]/edit:

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ReadinessBadge } from '../../components/ReadinessBadge';

const WINE_TYPES = ['Red', 'White', 'Rosé', 'Sparkling', 'Dessert', 'Fortified', 'Orange', 'Other'] as const;
const BOTTLE_SIZES = ['375ml', '750ml', 'Magnum 1.5L', 'Double Magnum 3L', 'Jeroboam 4.5L'];
const CURRENT_YEAR = new Date().getFullYear();

interface LocationOption { id: number; name: string }

interface WineFormData {
  name: string; producer: string; vintage: string; wine_type: string;
  quantity: string; location_id: string;
  grape: string; country: string; region: string; bottle_size: string;
  purchase_date: string; purchase_source: string; purchase_price: string;
  drinking_window_start: string; drinking_window_end: string; notes: string;
}

interface WineFormClientProps {
  locations: LocationOption[];
  mode: 'create' | 'edit';
  initialData?: Partial<WineFormData>;
  wineId?: number;
  wineName?: string;
}

export function WineFormClient({ locations, mode, initialData, wineId, wineName }: WineFormClientProps) {
  const router = useRouter();
  const [data, setData] = useState<WineFormData>({
    name: '', producer: '', vintage: '', wine_type: '', quantity: '1', location_id: '',
    grape: '', country: '', region: '', bottle_size: '750ml',
    purchase_date: '', purchase_source: '', purchase_price: '',
    drinking_window_start: '', drinking_window_end: '', notes: '',
    ...initialData,
  });
  const [errors, setErrors] = useState<Partial<WineFormData>>({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showOptional, setShowOptional] = useState(
    mode === 'edit' && Boolean(
      initialData?.grape || initialData?.country || initialData?.region ||
      initialData?.purchase_date || initialData?.purchase_source ||
      initialData?.purchase_price || initialData?.drinking_window_start ||
      initialData?.drinking_window_end || initialData?.notes
    )
  );

  const set = (field: keyof WineFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setData(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = (): boolean => {
    const errs: Partial<WineFormData> = {};
    if (!data.name.trim()) errs.name = 'Wine Name is required.';
    if (!data.producer.trim()) errs.producer = 'Producer is required.';
    const v = Number(data.vintage);
    if (!data.vintage) errs.vintage = 'Vintage Year is required.';
    else if (!Number.isInteger(v) || v < 1900 || v > CURRENT_YEAR + 1)
      errs.vintage = `Vintage must be between 1900 and ${CURRENT_YEAR + 1}.`;
    if (!data.wine_type) errs.wine_type = 'Wine type is required.';
    const q = Number(data.quantity);
    if (!data.quantity) errs.quantity = 'Quantity is required.';
    else if (!Number.isInteger(q) || q < 1 || q > 9999) errs.quantity = 'Quantity must be between 1 and 9999.';
    if (!data.location_id) errs.location_id = 'Storage location is required.';
    if (data.drinking_window_start && data.drinking_window_end) {
      const s = Number(data.drinking_window_start);
      const e = Number(data.drinking_window_end);
      if (e < s) errs.drinking_window_end = 'Drinking window end year must be ≥ start year.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setServerError('');
    try {
      const payload = {
        name: data.name.trim(), producer: data.producer.trim(),
        vintage: Number(data.vintage), wine_type: data.wine_type,
        quantity: Number(data.quantity), location_id: Number(data.location_id),
        grape: data.grape.trim() || null, country: data.country.trim() || null,
        region: data.region.trim() || null, bottle_size: data.bottle_size || null,
        purchase_date: data.purchase_date || null, purchase_source: data.purchase_source.trim() || null,
        purchase_price: data.purchase_price ? Number(data.purchase_price) : null,
        drinking_window_start: data.drinking_window_start ? Number(data.drinking_window_start) : null,
        drinking_window_end: data.drinking_window_end ? Number(data.drinking_window_end) : null,
        notes: data.notes.trim() || null,
      };
      const url = mode === 'edit' ? `/api/wines/${wineId}` : '/api/wines';
      const method = mode === 'edit' ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) {
        if (result.fields) setErrors(result.fields);
        setServerError(result.message || 'Could not save wine. Please try again.');
        return;
      }
      router.push(`/wines/${result.id || (mode === 'edit' ? wineId : result.id)}`);
      router.refresh();
    } catch {
      setServerError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const locationUnknown = mode === 'edit' && initialData?.location_id === '' && Boolean(wineName);

  const fieldStyle = (err?: string) => ({
    borderColor: err ? 'var(--color-error)' : 'var(--color-border)',
    borderWidth: err ? '2px' : '1px',
  } as React.CSSProperties);

  const windowStart = data.drinking_window_start ? Number(data.drinking_window_start) : null;
  const windowEnd = data.drinking_window_end ? Number(data.drinking_window_end) : null;

  return (
    <form onSubmit={handleSubmit} noValidate>
      {serverError && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-sm)', padding: '12px', marginBottom: '16px', fontSize: '14px', color: 'var(--color-error)' }}>
          ⚠ {serverError}
        </div>
      )}

      <div className="section-header">Required Fields</div>

      {/* Wine Name */}
      <div style={{ marginBottom: '16px' }}>
        <label className="label-mono" htmlFor="wine-name" style={{ display: 'block', marginBottom: '6px' }}>Wine Name *</label>
        <input id="wine-name" type="text" value={data.name} onChange={set('name')} placeholder="e.g. Château Margaux" style={fieldStyle(errors.name)} maxLength={255} />
        {errors.name && <p className="field-error">⚠ {errors.name}</p>}
      </div>

      {/* Producer */}
      <div style={{ marginBottom: '16px' }}>
        <label className="label-mono" htmlFor="producer" style={{ display: 'block', marginBottom: '6px' }}>Producer *</label>
        <input id="producer" type="text" value={data.producer} onChange={set('producer')} placeholder="e.g. Château Margaux" style={fieldStyle(errors.producer)} maxLength={255} />
        {errors.producer && <p className="field-error">⚠ {errors.producer}</p>}
      </div>

      {/* Vintage */}
      <div style={{ marginBottom: '16px' }}>
        <label className="label-mono" htmlFor="vintage" style={{ display: 'block', marginBottom: '6px' }}>Vintage Year * (1900–{CURRENT_YEAR + 1})</label>
        <input id="vintage" type="number" value={data.vintage} onChange={set('vintage')} placeholder={`e.g. ${CURRENT_YEAR - 2}`} min={1900} max={CURRENT_YEAR + 1} style={fieldStyle(errors.vintage)} inputMode="numeric" />
        {errors.vintage && <p className="field-error">⚠ {errors.vintage}</p>}
      </div>

      {/* Wine Type */}
      <div style={{ marginBottom: '16px' }}>
        <label className="label-mono" htmlFor="wine-type" style={{ display: 'block', marginBottom: '6px' }}>Wine Type *</label>
        <select id="wine-type" value={data.wine_type} onChange={set('wine_type')} style={fieldStyle(errors.wine_type)}>
          <option value="">Select wine type...</option>
          {WINE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {errors.wine_type && <p className="field-error">⚠ {errors.wine_type}</p>}
      </div>

      {/* Quantity */}
      <div style={{ marginBottom: '16px' }}>
        <label className="label-mono" htmlFor="quantity" style={{ display: 'block', marginBottom: '6px' }}>Quantity * (1–9999)</label>
        <input id="quantity" type="number" value={data.quantity} onChange={set('quantity')} min={1} max={9999} style={fieldStyle(errors.quantity)} inputMode="numeric" />
        {errors.quantity && <p className="field-error">⚠ {errors.quantity}</p>}
      </div>

      {/* Storage Location */}
      <div style={{ marginBottom: '16px' }}>
        <label className="label-mono" htmlFor="location" style={{ display: 'block', marginBottom: '6px' }}>Storage Location *</label>
        {locations.length === 0 ? (
          <div style={{ padding: '12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', background: '#FFFBEB', fontSize: '13px' }}>
            ℹ You have no storage locations yet.{' '}
            <Link href="/locations" style={{ color: 'var(--color-gold)' }}>Add your first storage location →</Link>
          </div>
        ) : (
          <select
            id="location"
            value={data.location_id}
            onChange={set('location_id')}
            style={{
              ...fieldStyle(errors.location_id || (locationUnknown ? 'error' : '')),
              borderColor: locationUnknown ? 'var(--color-error)' : (errors.location_id ? 'var(--color-error)' : 'var(--color-border)'),
            }}
          >
            {locationUnknown && <option value="">⚠ Location Unknown — please select a new location</option>}
            {!locationUnknown && <option value="">Select a storage location...</option>}
            {locations.map(l => <option key={l.id} value={String(l.id)}>{l.name}</option>)}
          </select>
        )}
        {locationUnknown && <p className="field-error">⚠ Location Unknown — please select a new location.</p>}
        {errors.location_id && !locationUnknown && <p className="field-error">⚠ {errors.location_id}</p>}
        <p style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '6px' }}>
          Each wine record tracks one storage location. To split a case across two locations, create separate records with the appropriate quantities for each.
        </p>
      </div>

      {/* Optional fields toggle (mobile) */}
      <div style={{ marginBottom: '8px' }}>
        <button
          type="button"
          onClick={() => setShowOptional(p => !p)}
          style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: '14px', padding: '8px 0', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          {showOptional ? '▾' : '▸'} {showOptional ? 'Hide' : 'Show'} optional fields
        </button>
      </div>

      {showOptional && (
        <div>
          <div className="section-header">Optional Details</div>

          {/* Grape */}
          <div style={{ marginBottom: '16px' }}>
            <label className="label-mono" htmlFor="grape" style={{ display: 'block', marginBottom: '6px' }}>Grape Variety</label>
            <input id="grape" type="text" value={data.grape} onChange={set('grape')} placeholder="e.g. Cabernet Sauvignon" maxLength={255} />
          </div>

          {/* Country + Region side by side on desktop */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label className="label-mono" htmlFor="country" style={{ display: 'block', marginBottom: '6px' }}>Country</label>
              <input id="country" type="text" value={data.country} onChange={set('country')} placeholder="e.g. France" maxLength={100} />
            </div>
            <div>
              <label className="label-mono" htmlFor="region" style={{ display: 'block', marginBottom: '6px' }}>Region</label>
              <input id="region" type="text" value={data.region} onChange={set('region')} placeholder="e.g. Bordeaux" maxLength={100} />
            </div>
          </div>

          {/* Bottle Size */}
          <div style={{ marginBottom: '16px' }}>
            <label className="label-mono" htmlFor="bottle-size" style={{ display: 'block', marginBottom: '6px' }}>Bottle Size</label>
            <input id="bottle-size" type="text" list="bottle-size-options" value={data.bottle_size} onChange={set('bottle_size')} placeholder="e.g. 750ml" maxLength={50} />
            <datalist id="bottle-size-options">
              {BOTTLE_SIZES.map(s => <option key={s} value={s} />)}
            </datalist>
          </div>

          {/* Purchase fields */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label className="label-mono" htmlFor="purchase-date" style={{ display: 'block', marginBottom: '6px' }}>Purchase Date</label>
              <input id="purchase-date" type="date" value={data.purchase_date} onChange={set('purchase_date')} max={new Date().toISOString().split('T')[0]} />
            </div>
            <div>
              <label className="label-mono" htmlFor="purchase-price" style={{ display: 'block', marginBottom: '6px' }}>Purchase Price ($)</label>
              <input id="purchase-price" type="number" value={data.purchase_price} onChange={set('purchase_price')} placeholder="0.00" min={0} step={0.01} max={99999.99} inputMode="decimal" />
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label className="label-mono" htmlFor="purchase-source" style={{ display: 'block', marginBottom: '6px' }}>Purchase Source</label>
            <input id="purchase-source" type="text" value={data.purchase_source} onChange={set('purchase_source')} placeholder="e.g. Wine.com" maxLength={255} />
          </div>

          {/* Drinking Window */}
          <div style={{ marginBottom: '16px' }}>
            <label className="label-mono" style={{ display: 'block', marginBottom: '6px' }}>Drinking Window</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label className="label-mono" htmlFor="dw-start" style={{ display: 'block', marginBottom: '4px', fontSize: '10px' }}>Drink From (Year)</label>
                <input id="dw-start" type="number" value={data.drinking_window_start} onChange={set('drinking_window_start')} placeholder="e.g. 2025" min={1900} max={2100} inputMode="numeric" />
              </div>
              <div>
                <label className="label-mono" htmlFor="dw-end" style={{ display: 'block', marginBottom: '4px', fontSize: '10px' }}>Drink Until (Year)</label>
                <input id="dw-end" type="number" value={data.drinking_window_end} onChange={set('drinking_window_end')} placeholder="e.g. 2045" min={1900} max={2100} inputMode="numeric" />
                {errors.drinking_window_end && <p className="field-error">⚠ {errors.drinking_window_end}</p>}
              </div>
            </div>
            {/* Live readiness badge preview */}
            {(windowStart || windowEnd) && (
              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>Preview:</span>
                <ReadinessBadge start={windowStart} end={windowEnd} />
              </div>
            )}
          </div>

          {/* General Notes */}
          <div style={{ marginBottom: '16px' }}>
            <label className="label-mono" htmlFor="notes" style={{ display: 'block', marginBottom: '6px' }}>General Notes</label>
            <textarea id="notes" value={data.notes} onChange={set('notes')} rows={4} placeholder="Any notes about this wine..." />
            <div style={{ textAlign: 'right', fontSize: '11px', color: 'var(--color-muted)', marginTop: '4px' }}>{data.notes.length}/2000</div>
          </div>
        </div>
      )}

      <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button type="submit" disabled={submitting} className="btn btn-primary" style={{ width: '100%' }}>
          {submitting ? 'Saving...' : mode === 'create' ? 'Save Wine' : 'Save Changes'}
        </button>
        <Link href={mode === 'edit' && wineId ? `/wines/${wineId}` : '/'} style={{ textAlign: 'center', fontSize: '14px', color: '#6B7280', textDecoration: 'none', padding: '8px' }}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
```

---

**app/wines/[id]/page.tsx** — Server component. Fetches GET /api/wines/[id], renders full wine detail with all sections. 404 on missing wine. Renders QuantityControls (client component) and tasting/event history sections.

```tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ReadinessBadge } from '../../components/ReadinessBadge';
import { QuantityControls } from '../../components/QuantityControls';
import { WineDeleteButton } from './WineDeleteButton';

interface Wine {
  id: number; name: string; producer: string; vintage: number; wine_type: string;
  grape?: string; country?: string; region?: string; bottle_size?: string;
  quantity: number; location_id?: number; location_name?: string;
  purchase_date?: string; purchase_source?: string; purchase_price?: string;
  drinking_window_start?: number; drinking_window_end?: number; notes?: string;
  most_recent_rating?: number; created_at: string; updated_at: string;
}

interface TastingNote {
  id: number; tasted_on: string; appearance?: string; aroma?: string;
  flavor?: string; finish?: string; rating?: number; would_buy_again?: string;
  occasion?: string; guest_feedback?: string; created_at: string;
}

interface BottleEvent {
  id: number; event_type: 'Consumed' | 'Gifted' | 'Opened';
  event_date: string; note?: string; created_at: string;
}

const EVENT_COLORS: Record<string, string> = {
  Consumed: '#EF4444', Gifted: '#8B5CF6', Opened: '#F97316',
};

function formatRating(rating: number, scale = 'five_star') {
  if (scale === 'hundred_point') return `${rating}/100`;
  const stars = Math.round(rating / 20);
  return '★'.repeat(stars) + '☆'.repeat(5 - stars);
}

export default async function WineDetailPage({ params }: { params: { id: string } }) {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  let wine: Wine | null = null;
  let tastingNotes: TastingNote[] = [];
  let bottleEvents: BottleEvent[] = [];

  try {
    const res = await fetch(`${base}/api/wines/${params.id}`, { cache: 'no-store' });
    if (res.status === 404) notFound();
    if (!res.ok) throw new Error('Failed to fetch wine');
    const data = await res.json();
    wine = data.wine;
    tastingNotes = data.tasting_notes || [];
    bottleEvents = data.bottle_events || [];
  } catch {
    notFound();
  }

  if (!wine) notFound();

  return (
    <div className="page-content">
      {/* Sub-header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <Link href="/cellar" style={{ fontSize: '14px', color: '#6B7280', textDecoration: 'none' }}>← Back to Cellar</Link>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href={`/wines/${wine.id}/edit`} className="btn btn-secondary" style={{ minHeight: '36px', fontSize: '13px', padding: '0 12px' }}>Edit</Link>
        </div>
      </div>

      {/* Hero section */}
      <div className="card" style={{ marginBottom: '24px', borderLeft: '4px solid var(--color-gold)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
          {wine.quantity === 0
            ? <span className="badge" style={{ background: '#D1D5DB', color: 'var(--color-black)' }}>CELLAR EMPTY</span>
            : <ReadinessBadge start={wine.drinking_window_start} end={wine.drinking_window_end} />
          }
          {wine.most_recent_rating && (
            <span style={{ fontSize: '14px', color: 'var(--color-gold)' }}>
              {formatRating(wine.most_recent_rating)}
            </span>
          )}
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '24px', marginBottom: '4px' }}>
          {wine.name} {wine.vintage}
        </h1>
        <p style={{ fontSize: '15px', color: '#6B7280', marginBottom: '8px' }}>{wine.producer}</p>

        <p style={{ fontSize: '14px', color: '#374151', marginBottom: '4px' }}>
          {[wine.wine_type, wine.region, wine.country].filter(Boolean).join(' · ')}
        </p>
        {wine.grape && <p style={{ fontSize: '14px', color: '#374151', marginBottom: '4px' }}>{wine.grape}</p>}
        {wine.bottle_size && <p style={{ fontSize: '13px', color: 'var(--color-muted)' }}>{wine.bottle_size}</p>}

        <div style={{ marginTop: '12px', marginBottom: '12px' }}>
          {wine.location_name ? (
            <p style={{ fontSize: '14px', fontWeight: 700 }}>📍 {wine.location_name}</p>
          ) : (
            <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-error)' }}>
              📍 Location Unknown —{' '}
              <Link href={`/wines/${wine.id}/edit`} style={{ color: 'var(--color-error)' }}>edit wine to assign a location</Link>
            </p>
          )}
        </div>

        <div>
          <span className="label-mono" style={{ display: 'block', marginBottom: '8px' }}>Quantity</span>
          <QuantityControls wineId={wine.id} initialQuantity={wine.quantity} wineName={`${wine.name} ${wine.vintage}`} />
        </div>
      </div>

      {/* Drinking Window */}
      <div style={{ marginBottom: '24px' }}>
        <div className="section-header">Drinking Window</div>
        {wine.drinking_window_start || wine.drinking_window_end ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '15px', fontWeight: 600 }}>
              {wine.drinking_window_start || '?'} — {wine.drinking_window_end || '?'}
            </span>
            <ReadinessBadge start={wine.drinking_window_start} end={wine.drinking_window_end} />
          </div>
        ) : (
          <p style={{ fontSize: '14px', color: '#6B7280' }}>
            No drinking window set.{' '}
            <Link href={`/wines/${wine.id}/edit`} style={{ color: 'var(--color-gold)' }}>Edit wine to add one →</Link>
          </p>
        )}
      </div>

      {/* Purchase Details */}
      {(wine.purchase_date || wine.purchase_source || wine.purchase_price) && (
        <div style={{ marginBottom: '24px' }}>
          <div className="section-header">Purchase Details</div>
          {wine.purchase_date && <p style={{ fontSize: '14px', marginBottom: '4px' }}>Purchased: {wine.purchase_date}</p>}
          {wine.purchase_source && <p style={{ fontSize: '14px', marginBottom: '4px' }}>From: {wine.purchase_source}</p>}
          {wine.purchase_price && <p style={{ fontSize: '14px' }}>Price: ${wine.purchase_price} / bottle</p>}
        </div>
      )}

      {/* General Notes */}
      {wine.notes && (
        <div style={{ marginBottom: '24px' }}>
          <div className="section-header">General Notes</div>
          <p style={{ fontSize: '14px', lineHeight: 1.6 }}>{wine.notes}</p>
        </div>
      )}

      {/* Tasting Notes */}
      <div style={{ marginBottom: '24px' }}>
        <div className="section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Tasting Notes</span>
          <Link href={`/wines/${wine.id}/notes/new`} style={{ fontSize: '12px', color: 'var(--color-gold)', textDecoration: 'none', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
            + ADD TASTING NOTE
          </Link>
        </div>
        {tastingNotes.length === 0 ? (
          <p style={{ fontSize: '14px', color: '#6B7280' }}>
            No tasting notes yet.{' '}
            <Link href={`/wines/${wine.id}/notes/new`} style={{ color: 'var(--color-gold)' }}>Add a Tasting Note →</Link>
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {tastingNotes.map(note => (
              <div key={note.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700 }}>{new Date(note.tasted_on).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  {note.rating && <span style={{ fontSize: '14px', color: 'var(--color-gold)' }}>{formatRating(note.rating)}</span>}
                </div>
                {note.occasion && (
                  <span className="badge" style={{ background: '#E5E7EB', color: 'var(--color-black)', marginBottom: '8px', marginRight: '8px' }}>
                    {note.occasion.toUpperCase()}
                  </span>
                )}
                {note.would_buy_again && (
                  <span className="badge" style={{
                    background: note.would_buy_again === 'yes' ? '#D1FAE5' : note.would_buy_again === 'no' ? '#FEE2E2' : '#FEF3C7',
                    color: 'var(--color-black)', marginBottom: '8px',
                  }}>
                    {note.would_buy_again === 'yes' ? '✓ Would Buy Again' : note.would_buy_again === 'no' ? '✗ Would Not Buy Again' : '? Maybe'}
                  </span>
                )}
                {note.appearance && (
                  <div style={{ marginBottom: '8px' }}>
                    <span className="label-mono" style={{ display: 'block', marginBottom: '2px' }}>Appearance</span>
                    <p style={{ fontSize: '13px' }}>{note.appearance}</p>
                  </div>
                )}
                {note.aroma && (
                  <div style={{ marginBottom: '8px' }}>
                    <span className="label-mono" style={{ display: 'block', marginBottom: '2px' }}>Aroma</span>
                    <p style={{ fontSize: '13px' }}>{note.aroma}</p>
                  </div>
                )}
                {note.flavor && (
                  <div style={{ marginBottom: '8px' }}>
                    <span className="label-mono" style={{ display: 'block', marginBottom: '2px' }}>Flavor</span>
                    <p style={{ fontSize: '13px' }}>{note.flavor}</p>
                  </div>
                )}
                {note.finish && (
                  <div style={{ marginBottom: '8px' }}>
                    <span className="label-mono" style={{ display: 'block', marginBottom: '2px' }}>Finish</span>
                    <p style={{ fontSize: '13px' }}>{note.finish}</p>
                  </div>
                )}
                {note.guest_feedback && (
                  <div>
                    <span className="label-mono" style={{ display: 'block', marginBottom: '2px' }}>Guest Feedback</span>
                    <p style={{ fontSize: '13px' }}>{note.guest_feedback}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottle History */}
      {bottleEvents.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div className="section-header">Bottle History</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {bottleEvents.map(event => (
              <div key={event.id} className="card" style={{ padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '13px', color: '#6B7280', minWidth: '100px' }}>
                    {new Date(event.event_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                  <span className="badge" style={{ background: EVENT_COLORS[event.event_type] || '#9CA3AF', color: '#ffffff' }}>
                    {event.event_type.toUpperCase()}
                  </span>
                </div>
                {event.note && <p style={{ fontSize: '13px', color: '#374151', marginTop: '6px' }}>{event.note}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Danger Zone — Delete */}
      <div style={{ marginTop: '40px', paddingTop: '24px', borderTop: '1px solid var(--color-border)' }}>
        <WineDeleteButton wineId={wine.id} wineName={`${wine.name} ${wine.vintage}`} />
      </div>
    </div>
  );
}
```

Create **app/wines/[id]/WineDeleteButton.tsx** — `'use client'` component for the delete action with ConfirmModal:

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ConfirmModal } from '../../components/ConfirmModal';

export function WineDeleteButton({ wineId, wineName }: { wineId: number; wineName: string }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/wines/${wineId}`, { method: 'DELETE' });
      if (res.ok || res.status === 204) {
        router.push('/cellar');
        router.refresh();
      }
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        style={{ background: 'none', border: 'none', color: 'var(--color-error)', cursor: 'pointer', fontSize: '14px', padding: '8px 0' }}
      >
        Delete Wine
      </button>
      {showConfirm && (
        <ConfirmModal
          title={`Delete ${wineName}?`}
          body="This cannot be undone. All tasting notes and bottle events will also be deleted."
          confirmLabel="Delete Permanently"
          onConfirm={handleDelete}
          onCancel={() => setShowConfirm(false)}
          danger={true}
          loading={loading}
        />
      )}
    </>
  );
}
```

---

**app/wines/[id]/edit/page.tsx** — Server component. Fetches current wine data, passes to WineFormClient in edit mode:

```tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { WineFormClient } from '../../new/WineFormClient';

export default async function EditWinePage({ params }: { params: { id: string } }) {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  let wine: Record<string, unknown> | null = null;
  let locations: { id: number; name: string }[] = [];

  try {
    const [wineRes, locsRes] = await Promise.all([
      fetch(`${base}/api/wines/${params.id}`, { cache: 'no-store' }),
      fetch(`${base}/api/locations`, { cache: 'no-store' }),
    ]);
    if (wineRes.status === 404) notFound();
    if (!wineRes.ok) throw new Error('Failed to fetch wine');
    const wineData = await wineRes.json();
    wine = wineData.wine;
    if (locsRes.ok) {
      const locsData = await locsRes.json();
      locations = locsData.locations || [];
    }
  } catch {
    notFound();
  }

  if (!wine) notFound();

  // Check if location_id references a deleted location
  const currentLocationId = wine.location_id as number | null;
  const locationExists = currentLocationId
    ? locations.some(l => l.id === currentLocationId)
    : false;
  const locationUnknown = currentLocationId !== null && !locationExists;

  const initialData = {
    name: String(wine.name || ''),
    producer: String(wine.producer || ''),
    vintage: String(wine.vintage || ''),
    wine_type: String(wine.wine_type || ''),
    quantity: String(wine.quantity ?? ''),
    location_id: locationUnknown ? '' : String(wine.location_id || ''),
    grape: String(wine.grape || ''),
    country: String(wine.country || ''),
    region: String(wine.region || ''),
    bottle_size: String(wine.bottle_size || '750ml'),
    purchase_date: wine.purchase_date ? String(wine.purchase_date).split('T')[0] : '',
    purchase_source: String(wine.purchase_source || ''),
    purchase_price: wine.purchase_price ? String(wine.purchase_price) : '',
    drinking_window_start: wine.drinking_window_start ? String(wine.drinking_window_start) : '',
    drinking_window_end: wine.drinking_window_end ? String(wine.drinking_window_end) : '',
    notes: String(wine.notes || ''),
  };

  return (
    <div className="page-content">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '24px' }}>Edit Wine</h1>
        <Link href={`/wines/${wine.id}`} style={{ color: '#6B7280', fontSize: '14px', textDecoration: 'none' }}>← Cancel</Link>
      </div>
      <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>{String(wine.name)} {String(wine.vintage)}</p>
      <WineFormClient
        locations={locations}
        mode="edit"
        initialData={initialData}
        wineId={Number(wine.id)}
        wineName={`${wine.name} ${wine.vintage}`}
      />
    </div>
  );
}
```

---

**app/locations/page.tsx** — `'use client'` page. LocationsManager with add form (POST), alphabetical list, inline rename (PUT), delete modal (DELETE). Location name/wine count link to `/cellar?location=[name]`.

```tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ConfirmModal } from '../components/ConfirmModal';

interface Location { id: number; name: string; wine_count: number }

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [addName, setAddName] = useState('');
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [renameId, setRenameId] = useState<number | null>(null);
  const [renameName, setRenameName] = useState('');
  const [renameError, setRenameError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Location | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadLocations = useCallback(async () => {
    try {
      const res = await fetch('/api/locations');
      if (res.ok) {
        const data = await res.json();
        setLocations(data.locations || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadLocations(); }, [loadLocations]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim()) { setAddError('Location name is required.'); return; }
    setAddLoading(true);
    setAddError('');
    try {
      const res = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: addName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddError(data.message || 'Could not add location.');
        return;
      }
      setAddName('');
      await loadLocations();
      showToast('Location added!');
    } finally {
      setAddLoading(false);
    }
  };

  const handleRenameStart = (loc: Location) => {
    setRenameId(loc.id);
    setRenameName(loc.name);
    setRenameError('');
  };

  const handleRenameSave = async (id: number) => {
    if (!renameName.trim()) { setRenameError('Location name is required.'); return; }
    try {
      const res = await fetch(`/api/locations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: renameName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRenameError(data.message || 'Could not rename location.');
        return;
      }
      setRenameId(null);
      await loadLocations();
      showToast('Location renamed!');
    } catch {
      setRenameError('Network error. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/locations/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok || res.status === 204) {
        setDeleteTarget(null);
        await loadLocations();
        showToast('Location deleted.');
      } else {
        showToast('Could not delete location.', 'error');
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="page-content">
      {/* Toast */}
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>{toast.message}</div>
        </div>
      )}

      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '24px', marginBottom: '24px' }}>
        Storage Locations
      </h1>

      {/* Add Location Form */}
      <div style={{ marginBottom: '32px' }}>
        <div className="section-header">Add Location</div>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              value={addName}
              onChange={e => { setAddName(e.target.value); setAddError(''); }}
              placeholder="Location name..."
              maxLength={100}
              style={{ borderColor: addError ? 'var(--color-error)' : 'var(--color-border)' }}
              onKeyDown={e => e.key === 'Enter' && handleAdd(e as unknown as React.FormEvent)}
            />
            {addError && <p className="field-error">⚠ {addError}</p>}
          </div>
          <button
            type="submit"
            disabled={addLoading}
            className="btn btn-primary"
            style={{ minHeight: '44px', fontSize: '13px', padding: '0 16px', whiteSpace: 'nowrap' }}
          >
            {addLoading ? 'Adding...' : 'Add'}
          </button>
        </form>
      </div>

      {/* Location List */}
      <div className="section-header">Your Locations</div>

      {loading ? (
        <p style={{ fontSize: '14px', color: '#6B7280' }}>Loading...</p>
      ) : locations.length === 0 ? (
        <p style={{ fontSize: '14px', color: '#6B7280' }}>
          No storage locations yet. Add your first location above.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {locations.map(loc => (
            <div key={loc.id} className="card" style={{ borderRadius: 0, borderBottom: 'none', padding: '14px 12px' }}
              // Restore border for last item + round first/last corners
            >
              {renameId === loc.id ? (
                // Inline rename state
                <div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <input
                      type="text"
                      value={renameName}
                      onChange={e => { setRenameName(e.target.value); setRenameError(''); }}
                      maxLength={100}
                      autoFocus
                      style={{ flex: 1, borderColor: renameError ? 'var(--color-error)' : 'var(--color-border)' }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleRenameSave(loc.id);
                        if (e.key === 'Escape') setRenameId(null);
                      }}
                    />
                    <button
                      onClick={() => handleRenameSave(loc.id)}
                      className="btn btn-primary"
                      style={{ minHeight: '36px', fontSize: '12px', padding: '0 12px' }}
                    >Save</button>
                    <button
                      onClick={() => setRenameId(null)}
                      style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: '13px', padding: '8px' }}
                    >Cancel</button>
                  </div>
                  {renameError && <p className="field-error">⚠ {renameError}</p>}
                </div>
              ) : (
                // Normal display state
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: '15px', marginBottom: '2px' }}>{loc.name}</p>
                    {loc.wine_count > 0 ? (
                      <Link
                        href={`/cellar?location=${encodeURIComponent(loc.name)}`}
                        style={{ fontSize: '13px', color: '#6B7280', textDecoration: 'none' }}
                      >
                        {loc.wine_count} {loc.wine_count === 1 ? 'wine' : 'wines'} →
                      </Link>
                    ) : (
                      <span style={{ fontSize: '13px', color: 'var(--color-muted)' }}>0 wines</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <button
                      onClick={() => handleRenameStart(loc)}
                      className="btn btn-secondary"
                      style={{ minHeight: '36px', fontSize: '12px', padding: '0 12px' }}
                    >
                      Rename
                    </button>
                    <button
                      onClick={() => setDeleteTarget(loc)}
                      style={{ background: 'none', border: 'none', color: 'var(--color-error)', cursor: 'pointer', fontSize: '13px', padding: '8px', fontWeight: 600 }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <ConfirmModal
          title={`Delete "${deleteTarget.name}"?`}
          body={
            deleteTarget.wine_count > 0
              ? `${deleteTarget.wine_count} wine(s) will be marked "Location Unknown". This cannot be undone.`
              : 'This cannot be undone.'
          }
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          danger={true}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}
```

Also create **app/wines/[id]/not-found.tsx** for the 404 state:

```tsx
import Link from 'next/link';

export default function WineNotFound() {
  return (
    <div className="page-content" style={{ textAlign: 'center', padding: '48px 16px' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '24px', marginBottom: '12px' }}>
        Wine not found.
      </h1>
      <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>
        The wine you're looking for doesn't exist or has been deleted.
      </p>
      <Link href="/cellar" className="btn btn-primary">View My Cellar</Link>
    </div>
  );
}
```

Also create a minimal **app/cellar/page.tsx** placeholder (wave 3b will implement the full page) to prevent dead nav link (NFR-010):

```tsx
import Link from 'next/link';

export default function CellarPage() {
  return (
    <div className="page-content">
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '24px', marginBottom: '16px' }}>My Cellar</h1>
      <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>Full search and filter coming soon. Add wines using the + button.</p>
      <Link href="/wines/new" className="btn btn-primary">+ Add Wine</Link>
    </div>
  );
}
```

Also create a minimal **app/page.tsx** placeholder (wave 3b will implement the full dashboard):

```tsx
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="page-content">
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '24px', marginBottom: '16px' }}>
        SimpleWineApp
      </h1>
      <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>
        Full dashboard with drink-now shelf and stats coming soon.
      </p>
      <Link href="/cellar" style={{ display: 'inline-block', marginRight: '12px' }} className="btn btn-primary">View Cellar</Link>
      <Link href="/wines/new" className="btn btn-secondary">+ Add Wine</Link>
    </div>
  );
}
```
  </action>
  <verify>
```bash
# QuantityControls exists and exports
grep -n 'export.*QuantityControls' app/components/QuantityControls.tsx && echo "QUANTITY CONTROLS OK"
grep -n 'use client' app/components/QuantityControls.tsx && echo "QUANTITY CONTROLS CLIENT OK"

# RemoveBottleModal exists and exports
grep -n 'export.*RemoveBottleModal' app/components/RemoveBottleModal.tsx && echo "REMOVE BOTTLE MODAL OK"

# Wine pages exist
ls app/wines/new/page.tsx app/wines/new/WineFormClient.tsx && echo "WINE FORM FILES OK"
ls app/wines/\[id\]/page.tsx app/wines/\[id\]/WineDeleteButton.tsx && echo "WINE DETAIL FILES OK"
ls app/wines/\[id\]/edit/page.tsx && echo "WINE EDIT PAGE OK"

# Locations page exists and has use client
ls app/locations/page.tsx && echo "LOCATIONS PAGE OK"
grep -n 'use client' app/locations/page.tsx && echo "LOCATIONS CLIENT OK"

# Not-found page exists
ls app/wines/\[id\]/not-found.tsx && echo "NOT FOUND PAGE OK"

# Placeholder routes exist (no dead nav links - NFR-010)
ls app/cellar/page.tsx && echo "CELLAR PLACEHOLDER OK"
ls app/page.tsx && echo "DASHBOARD PLACEHOLDER OK"

# Locations page links to /cellar
grep -n '/cellar' app/locations/page.tsx && echo "LOCATIONS DRILL THROUGH OK"

# QuantityControls calls PATCH /api/wines/[id]/quantity
grep -n 'quantity' app/components/QuantityControls.tsx && echo "QUANTITY API CALL OK"

# RemoveBottleModal has event type buttons and note textarea
grep -n 'Consumed\|Gifted\|Opened' app/components/RemoveBottleModal.tsx && echo "EVENT TYPES OK"
grep -n '500' app/components/RemoveBottleModal.tsx && echo "NOTE CHAR LIMIT OK"

# WineFormClient has location unknown state
grep -n 'Location Unknown' app/wines/new/WineFormClient.tsx && echo "LOCATION UNKNOWN STATE OK"

# Live badge preview in WineFormClient
grep -n 'ReadinessBadge' app/wines/new/WineFormClient.tsx && echo "LIVE BADGE PREVIEW OK"

# Wine detail has all required sections
grep -n 'Bottle History\|Tasting Notes\|Drinking Window\|Delete' app/wines/\[id\]/page.tsx && echo "WINE DETAIL SECTIONS OK"

# Delete confirmation shows correct text
grep -n 'cannot be undone\|tasting notes and bottle events' app/wines/\[id\]/WineDeleteButton.tsx && echo "DELETE MODAL TEXT OK"
```
  </verify>
  <done>
- app/components/QuantityControls.tsx: 'use client'; renders [−] [count] [+]; [+] calls PATCH delta:1; [−] opens RemoveBottleModal; Cellar Empty badge when qty=0; [−] aria-disabled at qty=0; [+] aria-disabled at qty=9999; 44px touch targets; optimistic quantity update
- app/components/RemoveBottleModal.tsx: 'use client'; bottom sheet with drag handle; 3 event type buttons (Consumed/Gifted/Opened); Gold bg on selected; Confirm disabled until type selected; 500-char notes textarea with counter; after Consumed/Gifted shows inline tasting note prompt with "Add a Note" (links to /wines/[id]/notes/new) and "Skip"; after Opened no prompt
- app/wines/new/WineFormClient.tsx: 'use client'; 6 required fields with inline validation; optional fields behind expand toggle (auto-expanded on edit if values exist); location dropdown from /api/locations; no-locations guidance with link to /locations; Location Unknown state (red border + warning on edit); live ReadinessBadge preview below drinking window fields; POST/PUT on submit; redirect to /wines/[id] on success
- app/wines/new/page.tsx: server component; fetches /api/locations; renders WineFormClient in create mode
- app/wines/[id]/page.tsx: server component; fetches GET /api/wines/[id]; renders hero (badge, rating, name, producer, type, region, country, grape, bottle_size, location, QuantityControls); drinking window section; purchase details; general notes; tasting notes list (reverse-chronological with all fields); bottle history (reverse-chronological, color-coded event type badges); WineDeleteButton; notFound() on 404
- app/wines/[id]/WineDeleteButton.tsx: 'use client'; "Delete Wine" text link opens ConfirmModal with correct copy; DELETE /api/wines/[id] on confirm; redirect to /cellar on success
- app/wines/[id]/not-found.tsx: "Wine not found." with "View My Cellar" link
- app/wines/[id]/edit/page.tsx: server component; fetches wine + locations; detects Location Unknown state; passes initialData to WineFormClient in edit mode
- app/locations/page.tsx: 'use client'; loads GET /api/locations on mount; alphabetical list with wine count links to /cellar?location=[name]; add form at top (POST); inline rename (PUT with Enter/ESC support); ConfirmModal for delete (shows wine count if any); DELETE /api/locations/[id] on confirm; success/error toasts
- app/cellar/page.tsx: minimal placeholder (wave 3b implements full page) — no dead nav link
- app/page.tsx: minimal placeholder (wave 3b implements full dashboard) — no dead nav link
- All routes functional with no horizontal overflow at 375px
- TechSur brand applied throughout (Gold CTAs, Black nav, Bone canvas, JetBrains Mono labels)
  </done>

  <feature_dependencies>
  Implements: F0: WineForm (create/edit pages), wine detail page (/wines/[id]) with all fields + delete flow, 404 state
              F1: QuantityControls (+ and -), RemoveBottleModal (event type selection, 500-char notes, tasting note prompt for Consumed/Gifted)
              F2: /locations page with add/rename/delete + ConfirmModal; wine count drill-through to /cellar; Location Unknown state on edit form
  Depends on: app/components/NavBar.tsx, ReadinessBadge, ConfirmModal (Task 1); API routes from wave 2a
  Enables: F3 (WineCellarList wave 3b uses QuantityControls), F4 (TastingNoteForm wave 3b uses established patterns), F5 (ReadinessBadge live preview on WineForm), F6 (Dashboard wave 3b uses NavBar + all routes)
  </feature_dependencies>
</task>

</tasks>

<verification>
```bash
# 1. All required route pages exist (NFR-010)
ls app/page.tsx \
   app/cellar/page.tsx \
   app/wines/new/page.tsx \
   app/wines/\[id\]/page.tsx \
   app/wines/\[id\]/edit/page.tsx \
   app/locations/page.tsx && echo "ALL REQUIRED ROUTES EXIST"

# 2. NavBar has all required links
grep -c "href=\"/\"\|href=\"/cellar\"\|href=\"/locations\"\|href=\"/wines/new\"" app/components/NavBar.tsx
# Expected: ≥4 (some appear twice for mobile + desktop nav)

# 3. No X-Frame-Options anywhere
! grep -rn 'X-Frame-Options' next.config.mjs app/ && echo "NO XFRAME OPTIONS"

# 4. Brand tokens present
grep -n '#FBCA5C\|--color-gold' app/globals.css && echo "GOLD TOKEN DEFINED"
grep -n 'Montserrat\|montserrat' app/layout.tsx && echo "MONTSERRAT FONT LOADED"
grep -n 'JetBrains\|label-mono' app/globals.css && echo "JETBRAINS MONO DEFINED"

# 5. Key wave 2a contracts consumed
grep -n 'api/wines' app/wines/\[id\]/page.tsx && echo "WINE DETAIL API CONNECTED"
grep -n 'api/locations' app/locations/page.tsx && echo "LOCATIONS API CONNECTED"
grep -n 'api/wines.*quantity\|quantity.*api' app/components/QuantityControls.tsx && echo "QUANTITY API CONNECTED"

# 6. ReadinessBadge is pure function (no server round-trip)
grep -n 'computeReadinessBadge' app/components/ReadinessBadge.tsx && echo "BADGE COMPUTED CLIENT-SIDE"
! grep -n 'fetch\|await' app/components/ReadinessBadge.tsx && echo "BADGE NO ASYNC CALLS"

# 7. Location delete is non-destructive (confirmed in API wave 2a, surfaced in UI)
grep -n 'Location Unknown' app/locations/page.tsx && echo "LOCATION UNKNOWN IN DELETE MODAL"

# 8. Mobile padding for bottom nav
grep -n 'padding-bottom.*72\|pb-\[72' app/globals.css && echo "MOBILE NAV PADDING OK"

# 9. WineForm has all 6 required fields
grep -n 'Wine Name\|Producer\|Vintage\|Wine Type\|Quantity\|Storage Location' app/wines/new/WineFormClient.tsx | wc -l
# Expected: ≥6

# 10. Post-consume tasting note prompt links correctly
grep -n 'notes/new' app/components/RemoveBottleModal.tsx && echo "TASTING NOTE PROMPT LINK OK"
```
</verification>

<success_criteria>
- All 7 required routes resolve (/, /cellar, /wines/new, /wines/[id], /wines/[id]/edit, /wines/[id]/notes/new placeholder, /locations) — no dead nav links (NFR-010)
- NavBar: mobile bottom tab bar (56px, Black bg) + desktop top header; active route Gold highlight; JetBrains Mono uppercase labels; FAB (+) above tab bar on mobile
- TechSur brand: Gold #FBCA5C CTAs, Black #0A0A0A nav/buttons, Bone #FAFAF7 canvas, Montserrat 900 headings, Open Sans body, JetBrains Mono labels on all pages (NFR-008)
- No X-Frame-Options or frame-ancestors headers (NFR-005)
- Mobile-first at 375px with no horizontal scroll (NFR-001)
- WineForm: 6 required fields + optional section (collapsed on mobile, expanded on edit if values exist); inline validation; Location Unknown red state on edit; live ReadinessBadge preview; POST/PUT on submit; redirects to /wines/[id]
- Wine detail: hero with badge, rating, name, producer, type, location (red if Unknown), QuantityControls; all sections present (drinking window, purchase, notes, tasting notes reverse-chron, bottle history reverse-chron, delete button)
- QuantityControls: [+] PATCH delta:1; [−] opens RemoveBottleModal; Cellar Empty badge at qty=0; disabled states at limits (WCAG aria-disabled)
- RemoveBottleModal: 3 event type buttons; Confirm disabled until type selected; 500-char notes; tasting note prompt (inline, not modal) after Consumed/Gifted only
- ConfirmModal: focus-trapped; ESC closes; scrim click does NOT close; danger=true renders red confirm
- /locations page: alphabetical list with wine counts; add form (inline, not modal); inline rename (Enter submits, Escape cancels); ConfirmModal for delete (copy varies by wine count); drill-through links to /cellar?location=[name]
- ReadinessBadge computes from current year client-side — never cached, never fetches
</success_criteria>

<output>
After completion, create `.planning/express/implement-the-full-simplewineapp-system-/03a-SUMMARY.md` with:
- Files created/modified
- Key implementation decisions (e.g., WineFormClient co-location, server vs client component boundaries)
- All routes implemented and their status (full vs placeholder)
- Any deviations from UX spec (flag prominently)
- Integration contracts satisfied (list wave 2a contracts consumed)
</output>
