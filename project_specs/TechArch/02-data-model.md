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
