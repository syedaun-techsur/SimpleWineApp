# Technical Architecture Document — SimpleWineApp

**Project:** SimpleWineApp (SWA)
**Version:** 1.0
**Date:** 2026-06-05
**Status:** Draft
**Based on:** PRD-SimpleWineApp v1.0, FRD-SimpleWineApp v1.0

---

## 1. Architectural Overview

### 1.1 Architecture Pattern

SimpleWineApp uses a **Monolithic Full-Stack** architecture built on Next.js 14 App Router. This pattern is deliberately chosen over microservices or separate frontend/backend deployments because:

- The dataset is small (personal cellar; ≤500 wines) — no horizontal scaling needed.
- A single deployable unit (one Docker image) minimizes operational complexity.
- Next.js App Router provides a clean boundary between server components (data fetching) and client components (interactivity), giving the benefits of a dedicated API layer without the overhead of a separate service.
- Client-side search/filter operates on the full loaded wine list — no search server required at personal-cellar scale.

**Key Architectural Decisions:**

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Config file | `next.config.mjs` | Next.js 14 hard-errors on `.ts` config; `.mjs` is required |
| Server vs. Client components | Server for data fetch; Client for interactivity | App Router convention; avoids waterfall fetches |
| Search/Filter | Client-side (browser) | Sufficient for ≤500 wines; no search server complexity |
| Auth | None | Single-user MVP; auth adds scope with no MVP value |
| Frame headers | No `X-Frame-Options` / no `frame-ancestors` restriction | App must render in iframe preview environments |
| Deployment | Docker Compose (two services) | Zero-setup; single `docker compose up` brings full stack online |
| Database | PostgreSQL 16 via docker-compose | Relational data model with FK integrity; containerized for portability |
| Migrations | SQL files in `db/`, applied via `npm run migrate` at container start | Idempotent (`IF NOT EXISTS`); auto-applied; no manual steps |

---

### 1.2 System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│  Docker Compose Network (swa_network)                                  │
│                                                                        │
│  ┌─────────────────────────────────────────┐  ┌─────────────────────┐ │
│  │  app (Next.js 14 — port 3000)           │  │  db (postgres:16)   │ │
│  │                                         │  │  port 5432 internal │ │
│  │  ┌─────────────────────────────────┐    │  │                     │ │
│  │  │  Next.js App Router             │    │  │  ┌───────────────┐  │ │
│  │  │                                 │    │  │  │  locations    │  │ │
│  │  │  ┌─────────────┐  ┌──────────┐ │    │  │  │  wines        │  │ │
│  │  │  │ Server      │  │ Client   │ │    │  │  │  bottle_events│  │ │
│  │  │  │ Components  │  │ Comps    │ │    │  │  │  tasting_notes│  │ │
│  │  │  │ (data fetch)│  │ (React   │ │    │  │  │  user_settings│  │ │
│  │  │  └──────┬──────┘  │  interac)│ │    │  │  └───────────────┘  │ │
│  │  │         │         └──────────┘ │    │  │                     │ │
│  │  │  ┌──────▼──────────────────┐   │    │  │  Named Volume:      │ │
│  │  │  │  Route Handlers (API)  │   │    │  │  swa_pgdata          │ │
│  │  │  │  /api/*                │   │    │  └──────────────────────┘ │
│  │  │  └──────────────┬─────────┘   │    │           ▲               │
│  │  │                 │ pg client   │    │           │ DATABASE_URL  │ │
│  │  └─────────────────│─────────────┘    │───────────┘               │ │
│  │                    └────────────────────────────────────────────→  │ │
│  │  Startup: migrate → next start         │                           │ │
│  └─────────────────────────────────────────┘                          │
│                                                                        │
│  Host: localhost:3000 ←── port mapping 3000:3000                      │
└────────────────────────────────────────────────────────────────────────┘

Browser
  │  HTTP  (GET pages, fetch /api/*)
  ▼
app:3000  (Next.js)
  │  SQL   (postgresql://postgres:postgres@db:5432/simplewineapp)
  ▼
db:5432  (PostgreSQL 16)
```

---

### 1.3 Deployment Topology

| Item | Detail |
|------|--------|
| Deployment model | Local / Docker Compose single-machine |
| Compose services | `db` (postgres:16) + `app` (Next.js, repo-root Dockerfile) |
| `db` healthcheck | `pg_isready -U postgres` |
| `app` depends_on | `db` with `condition: service_healthy` |
| `app` startup | `npm run migrate && npm start` (entrypoint) |
| Port mapping | `3000:3000` (host:container) |
| `DATABASE_URL` | `postgresql://postgres:postgres@db:5432/simplewineapp` — hostname `db` (not `localhost`) |
| Persistence | Named volume `swa_pgdata` mounted to `/var/lib/postgresql/data` in `db` |
| Environment | `NODE_ENV=production`, `DATABASE_URL` passed to `app` via compose `environment` |

**docker-compose.yml services summary:**

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: simplewineapp
    volumes:
      - swa_pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 10

  app:
    build: .                          # repo-root Dockerfile
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/simplewineapp
      NODE_ENV: production
    depends_on:
      db:
        condition: service_healthy

volumes:
  swa_pgdata:
```

**Dockerfile entrypoint pattern:**

```dockerfile
# Entrypoint: run migrations then start Next.js
CMD ["sh", "-c", "npm run migrate && npm start"]
```

---

### 1.4 Request Flow

```
Browser Request
    │
    ▼
Next.js App Router (app/)
    ├── Page Route (app/page.tsx, app/cellar/page.tsx, …)
    │       └── Server Component → Direct DB query OR fetch /api/*
    │               └── Returns rendered HTML to browser
    │
    └── Route Handler (app/api/**/route.ts)
            └── Parses request → Validates → Queries PostgreSQL → Returns JSON
```

**Server components** handle initial page renders and data fetching (no client-side loading states for initial view). **Client components** handle interactivity: search/filter state, quantity controls, modals, form validation feedback, session storage reads/writes.

---
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
---

## 3. Data Model

### 3.1 Entity Relationship Diagram

```
┌──────────────────┐
│   locations      │
│──────────────────│
│ id (PK, SERIAL)  │
│ name (VARCHAR)   │◄─────────────────────┐
│ created_at       │                      │ ON DELETE SET NULL
│ updated_at       │                      │ (wines.location_id → NULL)
└──────────────────┘                      │
                                          │
┌──────────────────────────────────────────┼───────────────────────────┐
│   wines                                  │                           │
│──────────────────────────────────────────│                           │
│ id (PK, SERIAL)                          │                           │
│ name (VARCHAR 255, NOT NULL)             │                           │
│ producer (VARCHAR 255, NOT NULL)         │                           │
│ vintage (INTEGER, NOT NULL)              │                           │
│ wine_type (VARCHAR 20, NOT NULL, ENUM)   │                           │
│ grape (VARCHAR 255)                      │                           │
│ country (VARCHAR 100)                    │                           │
│ region (VARCHAR 100)                     │                           │
│ bottle_size (VARCHAR 50)                 │                           │
│ quantity (INTEGER, NOT NULL, DEFAULT 1)  │                           │
│ location_id (INTEGER, FK → locations.id)─┘                           │
│ purchase_date (DATE)                                                  │
│ purchase_source (VARCHAR 255)                                         │
│ purchase_price (NUMERIC 8,2)                                          │
│ drinking_window_start (INTEGER)                                       │
│ drinking_window_end (INTEGER)                                         │
│ notes (TEXT)                                                          │
│ created_at (TIMESTAMPTZ)                                              │
│ updated_at (TIMESTAMPTZ)                                              │
└───────────────────────────────────────────────────────────────────────┘
         │                                       │
         │ ON DELETE CASCADE                     │ ON DELETE CASCADE
         ▼                                       ▼
┌──────────────────────┐           ┌───────────────────────────┐
│   bottle_events      │           │   tasting_notes           │
│──────────────────────│           │───────────────────────────│
│ id (PK, SERIAL)      │           │ id (PK, SERIAL)           │
│ wine_id (FK→wines.id)│           │ wine_id (FK→wines.id)     │
│ event_type (VARCHAR) │           │ tasted_on (DATE)          │
│ event_date (DATE)    │           │ appearance (VARCHAR 1000)  │
│ note (VARCHAR 500)   │           │ aroma (VARCHAR 1000)      │
│ created_at (TIMESTAMPTZ)         │ flavor (VARCHAR 1000)     │
└──────────────────────┘           │ finish (VARCHAR 1000)     │
                                   │ rating (INTEGER 1–100)    │
                                   │ would_buy_again (VARCHAR) │
                                   │ occasion (VARCHAR)        │
                                   │ guest_feedback (VARCHAR)  │
                                   │ created_at (TIMESTAMPTZ)  │
                                   └───────────────────────────┘

┌──────────────────────┐
│   user_settings      │  (standalone; always exactly one row with id=1)
│──────────────────────│
│ id (INTEGER PK=1)    │
│ rating_scale (VARCHAR│
│ updated_at (TIMESTAMPTZ)
└──────────────────────┘
```

---

### 3.2 Complete Database DDL (PostgreSQL 16)

**Connection string:** `postgresql://postgres:postgres@db:5432/simplewineapp`
(hostname `db` = docker-compose service name — never `localhost`)

All migrations live in `db/` folder and are applied via `npm run migrate`. All DDL uses `IF NOT EXISTS` for idempotency.

---

#### Migration 001 — `db/001_create_locations.sql`

```sql
-- ============================================================
-- 001_create_locations.sql
-- Storage locations managed by the user.
-- ============================================================

CREATE TABLE IF NOT EXISTS locations (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT  locations_name_unique UNIQUE (LOWER(name))
);

-- Shared trigger function for updated_at (created once; reused by all tables)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER locations_updated_at
  BEFORE UPDATE ON locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Column notes:**
- `UNIQUE (LOWER(name))` — case-insensitive uniqueness enforced at DB level.
- `updated_at` trigger auto-maintains the timestamp on every UPDATE.

---

#### Migration 002 — `db/002_create_wines.sql`

```sql
-- ============================================================
-- 002_create_wines.sql
-- Core wine records — one row per wine SKU in the collection.
-- ============================================================

CREATE TABLE IF NOT EXISTS wines (
  id                      SERIAL PRIMARY KEY,
  name                    VARCHAR(255) NOT NULL,
  producer                VARCHAR(255) NOT NULL,
  vintage                 INTEGER NOT NULL
                            CHECK (vintage >= 1900 AND vintage <= 2100),
  wine_type               VARCHAR(20) NOT NULL
                            CHECK (wine_type IN (
                              'Red','White','Rosé','Sparkling',
                              'Dessert','Fortified','Orange','Other'
                            )),
  grape                   VARCHAR(255),
  country                 VARCHAR(100),
  region                  VARCHAR(100),
  bottle_size             VARCHAR(50),
  quantity                INTEGER NOT NULL DEFAULT 1
                            CHECK (quantity >= 0 AND quantity <= 9999),
  location_id             INTEGER REFERENCES locations(id) ON DELETE SET NULL,
  purchase_date           DATE,
  purchase_source         VARCHAR(255),
  purchase_price          NUMERIC(8,2)
                            CHECK (purchase_price >= 0),
  drinking_window_start   INTEGER
                            CHECK (drinking_window_start >= 1900),
  drinking_window_end     INTEGER
                            CHECK (drinking_window_end >= 1900),
  notes                   TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT wines_window_order
    CHECK (
      drinking_window_end IS NULL OR
      drinking_window_start IS NULL OR
      drinking_window_end >= drinking_window_start
    )
);

CREATE INDEX IF NOT EXISTS idx_wines_location_id ON wines(location_id);
CREATE INDEX IF NOT EXISTS idx_wines_wine_type    ON wines(wine_type);
CREATE INDEX IF NOT EXISTS idx_wines_vintage      ON wines(vintage);
CREATE INDEX IF NOT EXISTS idx_wines_created_at   ON wines(created_at DESC);

CREATE OR REPLACE TRIGGER wines_updated_at
  BEFORE UPDATE ON wines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Column notes:**
- `location_id` — `ON DELETE SET NULL`: deleting a location sets this to `NULL` ("Location Unknown" state). Wine records are never cascade-deleted.
- `quantity` — min 0 (Cellar Empty state); max 9999. Cannot go negative (DB enforces `>= 0`).
- `wine_type` — CHECK constraint is source-of-truth enum; application layer must match.
- `vintage` — DB CHECK allows up to 2100; application validates against `current_year + 1` for tighter range.
- `wines_window_order` — DB-level constraint ensures `end >= start` when both are set.

---

#### Migration 003 — `db/003_create_bottle_events.sql`

```sql
-- ============================================================
-- 003_create_bottle_events.sql
-- Immutable audit log of bottle removal events per wine.
-- ============================================================

CREATE TABLE IF NOT EXISTS bottle_events (
  id          SERIAL PRIMARY KEY,
  wine_id     INTEGER NOT NULL REFERENCES wines(id) ON DELETE CASCADE,
  event_type  VARCHAR(20) NOT NULL
                CHECK (event_type IN ('Consumed','Gifted','Opened')),
  event_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  note        VARCHAR(500),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bottle_events_wine_id    ON bottle_events(wine_id);
CREATE INDEX IF NOT EXISTS idx_bottle_events_event_date ON bottle_events(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_bottle_events_event_type ON bottle_events(event_type);
```

**Column notes:**
- `ON DELETE CASCADE` — deleting a wine record cascades and deletes all its bottle events.
- No `updated_at` — bottle events are **immutable** (append-only audit log; no edit flow).
- `note` — VARCHAR(500) matches the 500-char application-layer limit.
- `event_date` — stored as DATE (YYYY-MM-DD); defaults to today. Separate from `created_at` (TIMESTAMPTZ) to allow backdating if needed.

---

#### Migration 004 — `db/004_create_tasting_notes.sql`

```sql
-- ============================================================
-- 004_create_tasting_notes.sql
-- Structured tasting records per wine; ratings normalized 1–100.
-- ============================================================

CREATE TABLE IF NOT EXISTS tasting_notes (
  id              SERIAL PRIMARY KEY,
  wine_id         INTEGER NOT NULL REFERENCES wines(id) ON DELETE CASCADE,
  tasted_on       DATE NOT NULL DEFAULT CURRENT_DATE,
  appearance      VARCHAR(1000),
  aroma           VARCHAR(1000),
  flavor          VARCHAR(1000),
  finish          VARCHAR(1000),
  rating          INTEGER
                    CHECK (rating >= 1 AND rating <= 100),
  would_buy_again VARCHAR(5)
                    CHECK (would_buy_again IN ('yes','no','maybe')),
  occasion        VARCHAR(20)
                    CHECK (occasion IN (
                      'dinner','gift','casual','celebration',
                      'restaurant','tasting','other'
                    )),
  guest_feedback  VARCHAR(2000),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasting_notes_wine_id   ON tasting_notes(wine_id);
CREATE INDEX IF NOT EXISTS idx_tasting_notes_tasted_on ON tasting_notes(tasted_on DESC);
CREATE INDEX IF NOT EXISTS idx_tasting_notes_rating    ON tasting_notes(rating DESC);
```

**Column notes:**
- `rating` — stored as normalized 1–100 regardless of user's display scale. 5-star input is multiplied by 20 before storage (e.g., 4★ → 80).
- `ON DELETE CASCADE` — deleting a wine cascades to all its tasting notes.
- No `updated_at` — notes are **append-only** in MVP (no edit flow).
- `tasted_on DESC` index optimizes the "most recent rating" query pattern for collection list cards.

---

#### Migration 005 — `db/005_create_user_settings.sql`

```sql
-- ============================================================
-- 005_create_user_settings.sql
-- Single-row user preferences for the single-user MVP.
-- ============================================================

CREATE TABLE IF NOT EXISTS user_settings (
  id            INTEGER PRIMARY KEY DEFAULT 1,
  rating_scale  VARCHAR(15) NOT NULL DEFAULT 'five_star'
                  CHECK (rating_scale IN ('five_star','hundred_point')),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_settings_single_row CHECK (id = 1)
);

-- Seed the single row on first migration (idempotent)
INSERT INTO user_settings (id, rating_scale)
VALUES (1, 'five_star')
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE TRIGGER user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Column notes:**
- Exactly **one row** with `id = 1` always exists; seeded on migration.
- `CHECK (id = 1)` — DB-level single-row invariant.
- `rating_scale` — affects display everywhere; stored `tasting_notes.rating` values are always 1–100.

---

### 3.3 Migration File Order Summary

| File | Tables Created | Run Order |
|------|----------------|-----------|
| `db/001_create_locations.sql` | `locations` + shared trigger function | 1st |
| `db/002_create_wines.sql` | `wines` + indexes + trigger | 2nd |
| `db/003_create_bottle_events.sql` | `bottle_events` + indexes | 3rd |
| `db/004_create_tasting_notes.sql` | `tasting_notes` + indexes | 4th |
| `db/005_create_user_settings.sql` | `user_settings` + seed row | 5th |

`npm run migrate` applies files in lexicographic order (001 → 005). Each file is idempotent (`IF NOT EXISTS`, `ON CONFLICT DO NOTHING`).

---

### 3.4 Index Strategy

| Index | Table | Column(s) | Purpose |
|-------|-------|-----------|---------|
| `idx_wines_location_id` | `wines` | `location_id` | FK join (location selector, orphan update) |
| `idx_wines_wine_type` | `wines` | `wine_type` | Dashboard type breakdown; filter |
| `idx_wines_vintage` | `wines` | `vintage` | Decade breakdown; sort by vintage |
| `idx_wines_created_at` | `wines` | `created_at DESC` | Recently added query |
| `idx_bottle_events_wine_id` | `bottle_events` | `wine_id` | Fetch events per wine |
| `idx_bottle_events_event_date` | `bottle_events` | `event_date DESC` | Recently consumed query |
| `idx_bottle_events_event_type` | `bottle_events` | `event_type` | Filter by Consumed/Gifted |
| `idx_tasting_notes_wine_id` | `tasting_notes` | `wine_id` | Fetch notes per wine |
| `idx_tasting_notes_tasted_on` | `tasting_notes` | `tasted_on DESC` | Most recent rating per wine |
| `idx_tasting_notes_rating` | `tasting_notes` | `rating DESC` | Highest rated query |

---
---

## 4. API Design

### 4.1 API Conventions

- **Base URL:** `http://localhost:3000/api` (Docker / local dev)
- **Framework:** Next.js 14 App Router Route Handlers (`app/api/**/route.ts`)
- **Content-Type:** `application/json` for all requests and responses
- **Authentication:** None (single-user MVP)
- **IDs:** Integers (SERIAL from PostgreSQL)
- **Dates:** ISO 8601 `YYYY-MM-DD` strings
- **Timestamps:** ISO 8601 with timezone `YYYY-MM-DDTHH:mm:ssZ`

**Standard error response shape:**
```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable description.",
  "fields": { "field_name": "field-level error detail" }
}
```
`fields` is only present on `422 Unprocessable Entity` responses.

---

### 4.2 TypeScript Interfaces

```typescript
// ─────────────────────────────────────────────
// Domain Enums
// ─────────────────────────────────────────────

type WineType =
  | 'Red' | 'White' | 'Rosé' | 'Sparkling'
  | 'Dessert' | 'Fortified' | 'Orange' | 'Other';

type EventType = 'Consumed' | 'Gifted' | 'Opened';

type ReadinessBadge =
  | 'Drink Now' | 'Hold' | 'Approaching Peak'
  | 'Past Window' | 'No Window Set';

type WouldBuyAgain = 'yes' | 'no' | 'maybe';

type Occasion =
  | 'dinner' | 'gift' | 'casual' | 'celebration'
  | 'restaurant' | 'tasting' | 'other';

type RatingScale = 'five_star' | 'hundred_point';

// ─────────────────────────────────────────────
// Location
// ─────────────────────────────────────────────

interface Location {
  id: number;
  name: string;
  created_at: string;    // ISO 8601 timestamp
  updated_at: string;
}

interface LocationWithCount extends Location {
  wine_count: number;
}

// ─────────────────────────────────────────────
// Wine
// ─────────────────────────────────────────────

interface Wine {
  id: number;
  name: string;
  producer: string;
  vintage: number;
  wine_type: WineType;
  grape: string | null;
  country: string | null;
  region: string | null;
  bottle_size: string | null;
  quantity: number;
  location_id: number | null;
  location_name: string | null;    // JOIN-resolved; null = Location Unknown
  purchase_date: string | null;    // YYYY-MM-DD
  purchase_source: string | null;
  purchase_price: string | null;   // NUMERIC returned as string by pg driver
  drinking_window_start: number | null;
  drinking_window_end: number | null;
  notes: string | null;
  most_recent_rating: number | null;  // normalized 1–100; null if no notes
  created_at: string;
  updated_at: string;
}

// Wine with computed readiness badge (client-side augmented)
interface WineWithBadge extends Wine {
  readiness_badge: ReadinessBadge;
}

interface CreateWineBody {
  name: string;
  producer: string;
  vintage: number;
  wine_type: WineType;
  grape?: string;
  country?: string;
  region?: string;
  bottle_size?: string;
  quantity: number;
  location_id: number;
  purchase_date?: string;        // YYYY-MM-DD
  purchase_source?: string;
  purchase_price?: number;
  drinking_window_start?: number;
  drinking_window_end?: number;
  notes?: string;
}

type UpdateWineBody = CreateWineBody;  // PUT replaces all fields

// ─────────────────────────────────────────────
// Bottle Events
// ─────────────────────────────────────────────

interface BottleEvent {
  id: number;
  wine_id: number;
  event_type: EventType;
  event_date: string;      // YYYY-MM-DD
  note: string | null;
  created_at: string;
}

interface PatchQuantityBody {
  delta: 1 | -1;
  event_type?: EventType;  // required when delta === -1
  note?: string;           // optional; max 500 chars
}

interface PatchQuantityResponse {
  quantity: number;
  event_id: number | null;  // null on increment
}

// ─────────────────────────────────────────────
// Tasting Notes
// ─────────────────────────────────────────────

interface TastingNote {
  id: number;
  wine_id: number;
  tasted_on: string;          // YYYY-MM-DD
  appearance: string | null;
  aroma: string | null;
  flavor: string | null;
  finish: string | null;
  rating: number | null;      // stored 1–100 normalized; null if not provided
  would_buy_again: WouldBuyAgain | null;
  occasion: Occasion | null;
  guest_feedback: string | null;
  created_at: string;
}

interface CreateNoteBody {
  tasted_on: string;           // YYYY-MM-DD; defaults to today
  appearance?: string;
  aroma?: string;
  flavor?: string;
  finish?: string;
  rating?: number;             // in user's current scale (1–5 or 1–100)
  would_buy_again?: WouldBuyAgain;
  occasion?: Occasion;
  guest_feedback?: string;
}

// ─────────────────────────────────────────────
// User Settings
// ─────────────────────────────────────────────

interface UserSettings {
  rating_scale: RatingScale;
  updated_at: string;
}

interface PatchSettingsBody {
  rating_scale: RatingScale;
}

// ─────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────

interface DashboardStats {
  total_bottles: number;
  unique_wines: number;
  drink_now_count: number;
  approaching_peak_count: number;
}

interface TypeBreakdownItem {
  wine_type: WineType;
  wine_count: number;
  bottle_count: number;
}

interface CountryBreakdownItem {
  country: string;   // 'Unknown' when null
  wine_count: number;
}

interface DecadeBreakdownItem {
  decade: number;    // e.g., 2010 = 2010–2019
  wine_count: number;
}

interface RecentlyConsumedItem {
  event_id: number;
  event_type: EventType;
  event_date: string;
  wine_id: number;
  wine_name: string;
  producer: string;
  vintage: number;
}

interface HighestRatedItem {
  wine_id: number;
  wine_name: string;
  producer: string;
  vintage: number;
  rating: number;    // normalized 1–100
  tasted_on: string;
}

interface DashboardResponse {
  stats: DashboardStats;
  drink_now_wines: Wine[];
  type_breakdown: TypeBreakdownItem[];
  country_breakdown: CountryBreakdownItem[];
  decade_breakdown: DecadeBreakdownItem[];
  recently_added: Wine[];
  recently_consumed: RecentlyConsumedItem[];
  highest_rated: HighestRatedItem[];
}

// ─────────────────────────────────────────────
// API Error
// ─────────────────────────────────────────────

interface ApiError {
  error: string;          // ERROR_CODE
  message: string;
  fields?: Record<string, string>;  // only on 422
}
```

---

### 4.3 Endpoint Reference

#### Wines

| Method | Path | Request Body | Success | Error Codes |
|--------|------|-------------|---------|-------------|
| `GET` | `/api/wines` | — | `200` `{ wines: Wine[] }` | `500 DB_READ_ERROR` |
| `POST` | `/api/wines` | `CreateWineBody` | `201` `Wine` | `422 VALIDATION_ERROR`, `422 VINTAGE_OUT_OF_RANGE`, `422 INVALID_WINE_TYPE`, `422 QUANTITY_OUT_OF_RANGE`, `422 LOCATION_NOT_FOUND`, `422 WINDOW_INVALID_RANGE`, `500 DB_WRITE_ERROR` |
| `GET` | `/api/wines/[id]` | — | `200` `{ wine: Wine, tasting_notes: TastingNote[], bottle_events: BottleEvent[] }` | `404 WINE_NOT_FOUND` |
| `PUT` | `/api/wines/[id]` | `UpdateWineBody` | `200` `Wine` | `404 WINE_NOT_FOUND`, `422 VALIDATION_ERROR`, `500 DB_WRITE_ERROR` |
| `DELETE` | `/api/wines/[id]` | — | `204` (empty) | `404 WINE_NOT_FOUND`, `500 DB_WRITE_ERROR` |

**GET /api/wines** notes:
- Returns full wine list for client-side search/filter on `/cellar`. No query params (full list always returned).
- `location_name` is JOIN-resolved from `locations.name`; `null` when location deleted.
- `most_recent_rating` is `DISTINCT ON (wine_id)` from `tasting_notes` ordered by `tasted_on DESC`.

**DELETE /api/wines/[id]** notes:
- Cascades to delete all `tasting_notes` and `bottle_events` for the wine (DB-level ON DELETE CASCADE).

---

#### Quantity & Bottle Events

| Method | Path | Request Body | Success | Error Codes |
|--------|------|-------------|---------|-------------|
| `PATCH` | `/api/wines/[id]/quantity` | `PatchQuantityBody` | `200` `PatchQuantityResponse` | `400 INVALID_DELTA`, `404 WINE_NOT_FOUND`, `409 QUANTITY_ALREADY_ZERO`, `409 QUANTITY_AT_MAX`, `422 MISSING_EVENT_TYPE`, `422 INVALID_EVENT_TYPE` |
| `GET` | `/api/wines/[id]/events` | — | `200` `{ events: BottleEvent[] }` | `404 WINE_NOT_FOUND` |

**PATCH /api/wines/[id]/quantity** notes:
- `delta: 1` → increment; no event created. `event_id: null` in response.
- `delta: -1` → decrement; `event_type` required; creates `bottle_events` row; `event_id` returned.
- Server enforces min 0 / max 9999; returns 409 at boundaries (UI also prevents via disabled buttons).

---

#### Tasting Notes

| Method | Path | Request Body | Success | Error Codes |
|--------|------|-------------|---------|-------------|
| `POST` | `/api/wines/[id]/notes` | `CreateNoteBody` | `201` `TastingNote` | `404 WINE_NOT_FOUND`, `422 TASTED_ON_FUTURE`, `422 RATING_OUT_OF_RANGE`, `422 INVALID_WOULD_BUY_AGAIN`, `422 INVALID_OCCASION`, `500 DB_WRITE_ERROR` |
| `GET` | `/api/wines/[id]/notes` | — | `200` `{ notes: TastingNote[] }` | `404 WINE_NOT_FOUND` |

**POST /api/wines/[id]/notes** notes:
- Server reads `user_settings.rating_scale` to normalize incoming `rating` to 1–100 scale before storing.
- Response `rating` is always the stored normalized value (1–100).

---

#### Settings

| Method | Path | Request Body | Success | Error Codes |
|--------|------|-------------|---------|-------------|
| `GET` | `/api/settings` | — | `200` `UserSettings` | `500 DB_READ_ERROR` |
| `PATCH` | `/api/settings` | `PatchSettingsBody` | `200` `UserSettings` | `422 INVALID_RATING_SCALE` |

**PATCH /api/settings** notes:
- Upserts the single `user_settings` row (`id = 1`). Always exactly one row exists after migration.

---

#### Locations

| Method | Path | Request Body | Success | Error Codes |
|--------|------|-------------|---------|-------------|
| `GET` | `/api/locations` | — | `200` `{ locations: LocationWithCount[] }` | `500 DB_READ_ERROR` |
| `POST` | `/api/locations` | `{ name: string }` | `201` `LocationWithCount` | `422 VALIDATION_ERROR`, `409 LOCATION_NAME_CONFLICT`, `500 DB_WRITE_ERROR` |
| `PUT` | `/api/locations/[id]` | `{ name: string }` | `200` `Location` | `404 LOCATION_NOT_FOUND`, `409 LOCATION_NAME_CONFLICT`, `422 VALIDATION_ERROR`, `500 DB_WRITE_ERROR` |
| `DELETE` | `/api/locations/[id]` | — | `204` (empty) | `404 LOCATION_NOT_FOUND`, `500 DB_WRITE_ERROR` |

**GET /api/locations** notes:
- Returns `wine_count` per location (COUNT of wines with that `location_id`).
- Sorted `ORDER BY LOWER(name) ASC`.

**DELETE /api/locations/[id]** notes:
- Server first runs `UPDATE wines SET location_id = NULL WHERE location_id = $1`, then deletes the location row. Wrapped in a transaction.

---

#### Dashboard

| Method | Path | Request Body | Success | Error Codes |
|--------|------|-------------|---------|-------------|
| `GET` | `/api/dashboard` | — | `200` `DashboardResponse` | `500 DB_READ_ERROR` |

**GET /api/dashboard** notes:
- Executes multiple SQL queries (stat tiles, Drink Now shelf, breakdowns, recently added, recently consumed, highest rated) and returns them in a single response.
- Uses current year `EXTRACT(YEAR FROM NOW())` server-side for all readiness calculations.
- Highest rated uses `DISTINCT ON (wine_id)` ordered by `tasted_on DESC` to get the most recent note per wine, then outer-sorted by `rating DESC LIMIT 5`.

---

### 4.4 Readiness Badge Computation

The readiness badge is **never cached** — computed fresh on every render/request using current year.

**Server-side SQL (used in dashboard queries):**
```sql
-- CY = EXTRACT(YEAR FROM NOW())::int
CASE
  WHEN w.drinking_window_start IS NULL AND w.drinking_window_end IS NULL
    THEN 'No Window Set'
  WHEN w.drinking_window_start IS NOT NULL
    AND w.drinking_window_end IS NOT NULL
    AND CY >= w.drinking_window_start
    AND CY <= w.drinking_window_end
    THEN 'Drink Now'
  WHEN w.drinking_window_start IS NOT NULL
    AND w.drinking_window_end IS NULL
    AND CY >= w.drinking_window_start
    THEN 'Drink Now'
  WHEN w.drinking_window_end IS NOT NULL
    AND w.drinking_window_start IS NULL
    AND CY <= w.drinking_window_end
    THEN 'Drink Now'
  WHEN w.drinking_window_start IS NOT NULL
    AND CY >= (w.drinking_window_start - 2)
    AND CY < w.drinking_window_start
    THEN 'Approaching Peak'
  WHEN w.drinking_window_end IS NOT NULL
    AND CY > w.drinking_window_end
    THEN 'Past Window'
  ELSE 'Hold'
END AS readiness_badge
```

**Client-side TypeScript (used in cellar filter component):**
```typescript
function computeReadinessBadge(
  start: number | null,
  end: number | null,
  currentYear: number = new Date().getFullYear()
): ReadinessBadge {
  if (start === null && end === null) return 'No Window Set';
  if (start !== null && end !== null) {
    if (currentYear >= start && currentYear <= end) return 'Drink Now';
    if (currentYear >= start - 2 && currentYear < start) return 'Approaching Peak';
    if (currentYear < start - 2) return 'Hold';
    if (currentYear > end) return 'Past Window';
  }
  if (start !== null && end === null) {
    if (currentYear >= start) return 'Drink Now';
    if (currentYear >= start - 2) return 'Approaching Peak';
    return 'Hold';
  }
  if (end !== null && start === null) {
    if (currentYear <= end) return 'Drink Now';
    return 'Past Window';
  }
  return 'No Window Set';
}
```

---

### 4.5 Rating Scale Conversion

| User Input | Scale | Stored (normalized 1–100) |
|------------|-------|--------------------------|
| 1 star | `five_star` | 20 |
| 2 stars | `five_star` | 40 |
| 3 stars | `five_star` | 60 |
| 4 stars | `five_star` | 80 |
| 5 stars | `five_star` | 100 |
| N (1–100) | `hundred_point` | N |

**Display conversion:** stored value ÷ 20 = star rating (round to nearest 0.5 for display).

```typescript
// Normalize to stored value (server-side on POST /api/wines/[id]/notes)
function normalizeRating(value: number, scale: RatingScale): number {
  return scale === 'five_star' ? value * 20 : value;
}

// Display conversion (client-side)
function displayRating(stored: number, scale: RatingScale): number | string {
  if (scale === 'five_star') return Math.round((stored / 20) * 2) / 2; // 0.5 increments
  return stored;
}
```

---
---

## 5. Security Architecture

### 5.1 Authentication & Authorization

SimpleWineApp MVP has **no authentication or authorization**. This is an explicit, deliberate design decision documented in both the PRD and PROJECT.md.

| Concern | Status | Rationale |
|---------|--------|-----------|
| User authentication | **None** | Single-user personal app; no login adds complexity with no MVP value |
| Session management | **None** | No sessions, no tokens, no cookies |
| Authorization (RBAC/ABAC) | **None** | Single-user; no multi-tenant data isolation needed |
| API key protection | **None** | App runs locally or in a Docker preview environment |

All routes (`/` through `/wines/[id]/notes/new`) are publicly accessible with no authentication gates.

---

### 5.2 HTTP Security Headers

The following headers are **explicitly NOT set** due to iframe preview requirements:

| Header | Status | Reason |
|--------|--------|--------|
| `X-Frame-Options: DENY` | **Must NOT be set** | App must render in iframe preview environments |
| `X-Frame-Options: SAMEORIGIN` | **Must NOT be set** | Same reason |
| `Content-Security-Policy: frame-ancestors 'none'` | **Must NOT be set** | Same reason |
| `Content-Security-Policy: frame-ancestors 'self'` | **Must NOT be set** | Same reason |

**`next.config.mjs` header configuration:**

```javascript
// next.config.mjs
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Explicitly omit X-Frame-Options and frame-ancestors CSP
          // to allow iframe embedding in preview environments.
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
```

**Headers that ARE safe to set** (do not block iframes):

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Content-Type-Options` | `nosniff` | Prevents MIME-type sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Controls referrer information |

---

### 5.3 Input Validation & Injection Prevention

Although the app is single-user and local, defense-in-depth validation is applied at both client and server layers.

**Validation layers:**

| Layer | Where | What |
|-------|-------|------|
| Client-side | React forms (`WineForm`, `TastingNoteForm`) | Inline validation feedback before submit; prevents obviously invalid submissions |
| Server-side | Route Handler validation functions (`lib/validators/`) | Re-validates all inputs regardless of client state; source of truth for error responses |
| Database | PostgreSQL CHECK constraints | Final guard against invalid data reaching storage |

**SQL injection prevention:**
- All database queries use **parameterized statements** (no string concatenation for user input).
- Using `pg` (node-postgres) library: all values passed as `$1, $2, ...` parameters.

```typescript
// Correct (parameterized)
const result = await db.query(
  'SELECT * FROM wines WHERE id = $1',
  [wineId]
);

// Never do this (string interpolation)
// const result = await db.query(`SELECT * FROM wines WHERE id = ${wineId}`);
```

---

### 5.4 Data Protection

| Concern | Approach |
|---------|----------|
| Data at rest | PostgreSQL data stored in Docker named volume `swa_pgdata`; no encryption at rest in MVP (local dev only) |
| Data in transit | HTTP only in local dev; HTTPS would be handled by a reverse proxy (nginx/Caddy) if deployed externally |
| Sensitive data | No PII beyond user-entered wine data; no passwords, no payment data, no personal identifiers |
| Database credentials | `postgres`/`postgres` for local dev; override via environment variables for any non-local deployment |
| Secret management | `DATABASE_URL` passed as docker-compose `environment` variable; not hardcoded in application source |

---

### 5.5 Database Connection Security

```
DATABASE_URL=postgresql://postgres:postgres@db:5432/simplewineapp
```

- Hostname is `db` (docker-compose service name) — never `localhost`.
- Port 5432 is **not** exposed to the host machine (no `ports` mapping on the `db` service) — accessible only within the compose network.
- Application code reads `DATABASE_URL` from environment; never hardcodes connection strings.

---

### 5.6 WCAG 2.1 AA Compliance

Accessibility is a security-adjacent concern for the TechSur brand system:

| Requirement | Implementation |
|------------|----------------|
| Color contrast | Gold `#FBCA5C` used ONLY on Black `#0A0A0A` backgrounds (contrast ratio 9.1:1 — AA pass) |
| Focus management | All interactive elements have visible focus rings; modals trap focus; `useEffect` focuses first input on modal open |
| Semantic HTML | `<nav>`, `<main>`, `<section>`, `<h1>`–`<h3>` hierarchy; form labels associated via `for`/`id` |
| ARIA | `aria-label` on icon-only buttons; `aria-live` on quantity/filter result count updates; `role="dialog"` on modals |
| Keyboard navigation | All actions (quantity controls, filter chips, modals) operable via keyboard |
| Mobile touch targets | Minimum 44×44px touch targets on all interactive elements |

**Brand color contrast audit:**

| Foreground | Background | Ratio | WCAG AA |
|-----------|------------|-------|---------|
| `#FBCA5C` (Gold) | `#0A0A0A` (Black) | 9.1:1 | ✓ Pass |
| `#0A0A0A` (Black) | `#FAFAF7` (Bone) | 19.5:1 | ✓ Pass |
| `#0A0A0A` (Black) | `#FBCA5C` (Gold) | 9.1:1 | ✓ Pass |
| White `#FFFFFF` | `#0A0A0A` (Black) | 21:1 | ✓ Pass |
| `#FAFAF7` (Bone) | `#0A0A0A` (Black) | 19.5:1 | ✓ Pass |

**Note:** Gold `#FBCA5C` must NEVER be used as text on `#FAFAF7` (Bone) backgrounds — that combination fails AA. Gold is used for accents/decorative only on dark (`#0A0A0A`) surfaces, and accent usage is capped at ≤10% of any screen surface area.

---
---

## 6. Technology Stack

### 6.1 Full Stack Table

| Layer | Technology | Version | Purpose | Constraints |
|-------|-----------|---------|---------|-------------|
| **Framework** | Next.js | 14.x (App Router) | Full-stack React framework; page routing; API route handlers | Config MUST be `next.config.mjs` — `.ts` causes hard error |
| **Language** | TypeScript | 5.x | Type-safe development | All source files `.ts` / `.tsx` |
| **Runtime** | Node.js | 20.x (LTS) | Server runtime for Next.js in Docker | |
| **Database** | PostgreSQL | 16 | Primary relational data store | Hostname `db` in Docker network; never `localhost` |
| **DB Driver** | `pg` (node-postgres) | 8.x | PostgreSQL client for Node.js | Parameterized queries only |
| **Containerization** | Docker + Docker Compose | Docker 24+, Compose v2 | Full-stack local deployment | Two services: `db` + `app` |
| **UI Framework** | USWDS (U.S. Web Design System) | 3.x | Base design token system; accessible components | Applied via CSS; tokens overridden with TechSur brand |
| **Styling** | CSS Modules + USWDS tokens | — | Scoped component styles; no CSS-in-JS overhead | |
| **Fonts** | Montserrat 900 (display) | via Google Fonts | Display headings per TechSur brand | |
| | Open Sans (body) | via Google Fonts | Body copy per TechSur brand | |
| | JetBrains Mono (labels) | via Google Fonts | Uppercase monospace labels per TechSur brand | |
| **Package manager** | npm | 10.x | Dependency management | `package-lock.json` committed |
| **Linting** | ESLint | 8.x | Code quality; Next.js config | |
| **Type checking** | TypeScript compiler (`tsc`) | 5.x | Type safety checks | |

### 6.2 Key Dependencies (package.json)

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "pg": "^8.11.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "@types/pg": "^8.11.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "^14.0.0"
  }
}
```

### 6.3 npm Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `next dev` | Local development server with hot-reload |
| `build` | `next build` | Production build |
| `start` | `next start` | Serve production build |
| `migrate` | `node scripts/migrate.js` | Apply SQL migrations from `db/` folder in order |
| `lint` | `eslint .` | Run ESLint |
| `type-check` | `tsc --noEmit` | TypeScript type checking without emitting |

### 6.4 Migration Script Pattern

```javascript
// scripts/migrate.js
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrate() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const migrationsDir = path.join(__dirname, '..', 'db');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();  // lexicographic: 001, 002, 003, 004, 005

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    console.log(`Applying migration: ${file}`);
    await client.query(sql);
  }

  await client.end();
  console.log('Migrations complete.');
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
```

### 6.5 File Structure

```
SimpleWineApp/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # / — Dashboard
│   ├── layout.tsx                # Root layout (NavBar, fonts)
│   ├── cellar/
│   │   └── page.tsx              # /cellar — Collection list
│   ├── wines/
│   │   ├── new/
│   │   │   └── page.tsx          # /wines/new — Add wine form
│   │   └── [id]/
│   │       ├── page.tsx          # /wines/[id] — Wine detail
│   │       ├── edit/
│   │       │   └── page.tsx      # /wines/[id]/edit — Edit form
│   │       └── notes/
│   │           └── new/
│   │               └── page.tsx  # /wines/[id]/notes/new — Tasting note form
│   ├── locations/
│   │   └── page.tsx              # /locations — Storage locations
│   └── api/
│       ├── wines/
│       │   ├── route.ts          # GET /api/wines, POST /api/wines
│       │   └── [id]/
│       │       ├── route.ts      # GET/PUT/DELETE /api/wines/[id]
│       │       ├── quantity/
│       │       │   └── route.ts  # PATCH /api/wines/[id]/quantity
│       │       ├── events/
│       │       │   └── route.ts  # GET /api/wines/[id]/events
│       │       └── notes/
│       │           └── route.ts  # GET/POST /api/wines/[id]/notes
│       ├── settings/
│       │   └── route.ts          # GET/PATCH /api/settings
│       ├── locations/
│       │   ├── route.ts          # GET/POST /api/locations
│       │   └── [id]/
│       │       └── route.ts      # PUT/DELETE /api/locations/[id]
│       └── dashboard/
│           └── route.ts          # GET /api/dashboard
├── components/                   # Reusable UI components
│   ├── NavBar.tsx
│   ├── WineCellarList.tsx        # "use client"
│   ├── WineCard.tsx
│   ├── QuantityControls.tsx      # "use client"
│   ├── RemoveBottleModal.tsx     # "use client"
│   ├── WineForm.tsx              # "use client"
│   ├── TastingNoteForm.tsx       # "use client"
│   ├── ReadinessBadge.tsx
│   ├── FilterPanel.tsx           # "use client"
│   ├── LocationsManager.tsx      # "use client"
│   ├── DashboardShelf.tsx
│   ├── ConfirmModal.tsx          # "use client"
│   └── RatingWidget.tsx          # "use client"
├── lib/
│   ├── db.ts                     # PostgreSQL connection pool
│   ├── readiness.ts              # computeReadinessBadge()
│   ├── rating.ts                 # normalizeRating(), displayRating()
│   ├── errors.ts                 # API error response helpers
│   └── validators/
│       ├── wine.ts
│       ├── location.ts
│       └── note.ts
├── db/                           # SQL migration files
│   ├── 001_create_locations.sql
│   ├── 002_create_wines.sql
│   ├── 003_create_bottle_events.sql
│   ├── 004_create_tasting_notes.sql
│   └── 005_create_user_settings.sql
├── scripts/
│   └── migrate.js                # Migration runner
├── public/                       # Static assets
├── styles/                       # Global CSS
│   └── globals.css
├── next.config.mjs               # Next.js config (MUST be .mjs, never .ts)
├── tsconfig.json
├── package.json
├── package-lock.json
├── Dockerfile                    # Multi-stage build
├── docker-compose.yml            # Two services: db + app
└── .env.local                    # Local dev env (DATABASE_URL with localhost for local dev)
```

### 6.6 Dockerfile Pattern

```dockerfile
# Dockerfile
FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/db ./db
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 3000
# Entrypoint: run migrations then start
CMD ["sh", "-c", "node scripts/migrate.js && node server.js"]
```

---
---

## 7. Integration Points

### 7.1 External Integrations

SimpleWineApp MVP has **zero external API integrations**. All data is internal (PostgreSQL). This is an explicit design decision per PRD ("no AI", "no wine marketplace", "no external APIs").

### 7.2 Infrastructure Integrations

#### PostgreSQL 16 (Primary Datastore)

| Property | Value |
|----------|-------|
| Technology | PostgreSQL 16 |
| Docker service name | `db` |
| Docker image | `postgres:16` |
| Internal port | 5432 (not exposed to host) |
| Database name | `simplewineapp` |
| User | `postgres` |
| Password | `postgres` (local dev; override via env for any external deployment) |
| Connection string | `postgresql://postgres:postgres@db:5432/simplewineapp` |
| Connection env var | `DATABASE_URL` |
| Data persistence | Named volume `swa_pgdata` → `/var/lib/postgresql/data` |
| Health check | `pg_isready -U postgres` (interval 5s, retries 10) |
| App startup dependency | `app` depends_on `db` with `condition: service_healthy` |

#### Browser APIs (Client-Side)

| API | Usage | Feature |
|-----|-------|---------|
| `sessionStorage` | Persist search/filter/sort state on `/cellar` across in-tab navigation | F03 |
| `Date.prototype.getFullYear()` | Compute readiness badge client-side in filter component | F05 |

**sessionStorage keys:**

| Key | Type | Content |
|-----|------|---------|
| `swa_cellar_search` | `string` | Current search query text |
| `swa_cellar_filters` | `JSON string` | Active filter state object |
| `swa_cellar_sort` | `string` | Current sort option key |

**Graceful degradation:** If `sessionStorage` is unavailable (e.g., private browsing), filters/search still work in-memory for the current page session. The try/catch wraps all `sessionStorage` reads/writes.

---

### 7.3 Font Delivery

Fonts are loaded via Google Fonts (Next.js `next/font` integration, which downloads and self-hosts at build time — no runtime external request):

| Font | Weight/Style | Usage |
|------|-------------|-------|
| Montserrat | 900 (Black) | Display headings (`<h1>`, `<h2>`, hero text) |
| Open Sans | 400, 600 | Body text, form labels, nav items |
| JetBrains Mono | 400 | Uppercase monospace labels (location names, badge labels, button text) |

```typescript
// app/layout.tsx
import { Montserrat, Open_Sans, JetBrains_Mono } from 'next/font/google';

const montserrat = Montserrat({ subsets: ['latin'], weight: ['900'] });
const openSans = Open_Sans({ subsets: ['latin'], weight: ['400', '600'] });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], weight: ['400'] });
```

---

### 7.4 Explicitly Excluded Integrations

| Integration | Reason Excluded |
|------------|----------------|
| Wine APIs (Vivino, Wine-Searcher, CellarTracker) | No external APIs in MVP per PRD |
| AI / ML recommendations | Explicitly excluded per PRD ("no AI") |
| OAuth / SSO / Auth providers (Auth0, Supabase Auth) | No authentication in MVP |
| Email / push notifications | No real-time features in MVP |
| Payment / e-commerce | No marketplace features |
| Analytics (Google Analytics, Plausible) | Not specified; deferred |
| CDN / object storage (S3, Cloudflare Images) | No image upload in MVP |
| Search engines (Elasticsearch, Typesense, Meilisearch) | Client-side search sufficient at personal cellar scale |
| Redis / caching layer | No caching needed at single-user personal scale |

---

### 7.5 Performance Targets & Non-Functional Requirements

| Requirement | Target | Implementation |
|------------|--------|----------------|
| Mobile-first breakpoint | Fully functional at 375px | CSS media queries; USWDS responsive grid |
| Accessibility | WCAG 2.1 AA | Semantic HTML; ARIA attributes; color contrast per §5.6 |
| Deployment | `docker compose up --build` → live in ≤60s cold start | Multi-stage Dockerfile; pg healthcheck with 10 retries |
| Collection list render | ≤1s for 500 wine records (warm container) | All wines returned in single `GET /api/wines`; client-side filter runs in <200ms |
| Search/filter response | ≤200ms client-side for 200-wine dataset | In-browser JS string matching; no server round-trip |
| Config file | `next.config.mjs` only | `.ts` extension must never exist — causes Next 14 hard error |
| Frame compatibility | App renders in iframe | No `X-Frame-Options` header; no `frame-ancestors` CSP restriction |
| Navigation | All primary nav routes resolve to real pages | Seven routes implemented per §2.1; no dead links |
| Data integrity | Delete location → wines set to Location Unknown | `ON DELETE SET NULL` on `wines.location_id`; confirmed via transaction in DELETE handler |

---

*End of TechArch-SimpleWineApp v1.0*
*Related documents: PRD-SimpleWineApp.md, FRD-SimpleWineApp.md*
*Last updated: 2026-06-05*
