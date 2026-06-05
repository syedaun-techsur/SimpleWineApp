---

## 2. Component Architecture

### 2.1 Page Routes (Next.js App Router)

All pages live under `app/`. Each route has a `page.tsx` that is a **Server Component** responsible for data fetching and rendering. Interactive sub-components are marked `"use client"` and imported into pages.

| Route | File | Component Type | Responsibility |
|-------|------|----------------|----------------|
| `/` | `app/page.tsx` | Server | Dashboard: fetch aggregate data, render stat tiles + shelves |
| `/cellar` | `app/cellar/page.tsx` | Server (shell) + Client (list) | Fetch all wines + locations; hand off to client filter/search component |
| `/wines/new` | `app/wines/new/page.tsx` | Server (shell) + Client (form) | Fetch locations list; render wine creation form |
| `/wines/[id]` | `app/wines/[id]/page.tsx` | Server | Fetch wine + notes + events; render detail view + quantity controls |
| `/wines/[id]/edit` | `app/wines/[id]/edit/page.tsx` | Server (shell) + Client (form) | Fetch wine + locations; render pre-populated edit form |
| `/wines/[id]/notes/new` | `app/wines/[id]/notes/new/page.tsx` | Server (shell) + Client (form) | Fetch wine + user settings; render tasting note form |
| `/locations` | `app/locations/page.tsx` | Server (shell) + Client (CRUD) | Fetch locations with counts; render locations management UI |

### 2.2 API Route Handlers

All route handlers live under `app/api/`. Each is a **Next.js Route Handler** (`.ts` file exporting named HTTP method functions). They interact with PostgreSQL via a shared database client.

| Handler File | Methods | Feature |
|-------------|---------|---------|
| `app/api/wines/route.ts` | `GET`, `POST` | Wine list + create (F00) |
| `app/api/wines/[id]/route.ts` | `GET`, `PUT`, `DELETE` | Wine detail, update, delete (F00) |
| `app/api/wines/[id]/quantity/route.ts` | `PATCH` | Increment/decrement quantity + log bottle event (F01) |
| `app/api/wines/[id]/events/route.ts` | `GET` | Bottle event log for a wine (F01) |
| `app/api/wines/[id]/notes/route.ts` | `GET`, `POST` | Tasting notes list + create (F04) |
| `app/api/settings/route.ts` | `GET`, `PATCH` | User settings: rating scale (F04) |
| `app/api/locations/route.ts` | `GET`, `POST` | Locations list + create (F02) |
| `app/api/locations/[id]/route.ts` | `PUT`, `DELETE` | Rename + delete location (F02) |
| `app/api/dashboard/route.ts` | `GET` | Aggregate dashboard data (F06) |

### 2.3 Shared Library Modules (`lib/`)

| Module | Path | Responsibility |
|--------|------|----------------|
| Database client | `lib/db.ts` | Exports a PostgreSQL pool/client using `pg` or `postgres` library; reads `DATABASE_URL` |
| Wine validators | `lib/validators/wine.ts` | Server-side field validation functions for wine create/edit |
| Location validators | `lib/validators/location.ts` | Server-side validation for location name |
| Note validators | `lib/validators/note.ts` | Server-side validation for tasting note fields |
| Readiness badge | `lib/readiness.ts` | Pure function: `computeReadinessBadge(start, end, currentYear)` → badge enum |
| Rating conversion | `lib/rating.ts` | Normalize rating to 1–100; convert back for display |
| Error helpers | `lib/errors.ts` | Standard API error response constructors |

### 2.4 Client Components (`components/`)

| Component | Responsibility | Used On |
|-----------|----------------|---------|
| `WineCellarList` | Client-side search/filter/sort engine; renders wine cards; reads/writes sessionStorage | `/cellar` |
| `WineCard` | Wine summary card with readiness badge, quantity controls, rating | `/cellar`, `/` |
| `QuantityControls` | `+`/`−` buttons; triggers "Remove Bottle" modal on decrement | `/wines/[id]`, `/cellar` |
| `RemoveBottleModal` | Event type selection (Consumed/Gifted/Opened), optional note, tasting note prompt | `/wines/[id]`, `/cellar` |
| `WineForm` | Create/edit wine form with client-side validation, location selector | `/wines/new`, `/wines/[id]/edit` |
| `TastingNoteForm` | Tasting note creation form; rating widget (5-star or 100-pt) | `/wines/[id]/notes/new` |
| `ReadinessBadge` | Color-coded badge pill based on readiness enum value | `/cellar`, `/wines/[id]`, `/` |
| `FilterPanel` | Multi-dimension filter sidebar; dismissible chips; sort selector | `/cellar` |
| `LocationsManager` | Inline CRUD for storage locations with rename/delete | `/locations` |
| `DashboardShelf` | Horizontally scrollable wine card row | `/` |
| `ConfirmModal` | Reusable confirmation dialog (delete wine, delete location) | `/wines/[id]`, `/locations` |
| `RatingWidget` | 5-star or 100-point rating input based on user setting | `/wines/[id]/notes/new` |
| `NavBar` | Mobile-first top navigation with links to all primary routes | All pages |

### 2.5 Navigation Structure

All primary nav items link to real, implemented routes. No dead links are permitted.

```
NavBar
  ├── / ──────────────── Dashboard (home icon)
  ├── /cellar ─────────── My Cellar (collection icon)
  ├── /locations ──────── Storage (location icon)
  └── /wines/new ──────── Add Wine (+ button, floating action button on mobile)
```

Detail routes (`/wines/[id]`, `/wines/[id]/edit`, `/wines/[id]/notes/new`) are accessed via in-page links, not primary nav.

---
