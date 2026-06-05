---

## Y0: Database Schema (PostgreSQL 16)

Full DDL for all SimpleWineApp entities. All migrations live in the `db/` folder and are applied via `npm run migrate` on container start. All DDL uses `IF NOT EXISTS` for idempotency.

**Connection:** `DATABASE_URL=postgresql://postgres:postgres@db:5432/simplewineapp`
(hostname `db` = docker-compose service name; never `localhost`)

---

### §locations

```sql
CREATE TABLE IF NOT EXISTS locations (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT  locations_name_unique UNIQUE (LOWER(name))
);

-- Trigger: auto-update updated_at on any UPDATE
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER locations_updated_at
  BEFORE UPDATE ON locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Notes:**
- `UNIQUE (LOWER(name))` enforces case-insensitive uniqueness.
- `updated_at` trigger is defined once and reused across tables.

---

### §wines

```sql
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
  purchase_price          NUMERIC(8,2) CHECK (purchase_price >= 0),
  drinking_window_start   INTEGER CHECK (drinking_window_start >= 1900),
  drinking_window_end     INTEGER CHECK (drinking_window_end >= 1900),
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

CREATE TRIGGER wines_updated_at
  BEFORE UPDATE ON wines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Notes:**
- `location_id` uses `ON DELETE SET NULL` — deleting a location sets wines' location_id to NULL (not a cascade delete).
- `quantity` minimum is 0 (Cellar Empty state); it cannot go negative.
- The `wine_type` CHECK constraint is the source of truth for allowed enum values.
- `vintage` CHECK allows up to 2100 for flexibility; application layer validates against `current_year + 1`.

---

### §bottle_events

```sql
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

**Notes:**
- `ON DELETE CASCADE`: deleting a wine record cascades and deletes all its bottle events.
- No `updated_at` — bottle events are immutable once created (audit log semantics).
- `note` VARCHAR(500) matches the application-layer 500-char limit.

---

### §tasting_notes

```sql
CREATE TABLE IF NOT EXISTS tasting_notes (
  id              SERIAL PRIMARY KEY,
  wine_id         INTEGER NOT NULL REFERENCES wines(id) ON DELETE CASCADE,
  tasted_on       DATE NOT NULL DEFAULT CURRENT_DATE,
  appearance      VARCHAR(1000),
  aroma           VARCHAR(1000),
  flavor          VARCHAR(1000),
  finish          VARCHAR(1000),
  rating          INTEGER CHECK (rating >= 1 AND rating <= 100),
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

**Notes:**
- `rating` is stored normalized to 1–100 scale regardless of user's display preference.
- `ON DELETE CASCADE`: deleting a wine record cascades and deletes all its tasting notes.
- No `updated_at` — tasting notes are currently append-only (no edit flow in MVP).
- The `tasted_on DESC` index supports the "most recent rating" query pattern efficiently.

---

### §user_settings

```sql
CREATE TABLE IF NOT EXISTS user_settings (
  id            INTEGER PRIMARY KEY DEFAULT 1,
  rating_scale  VARCHAR(15) NOT NULL DEFAULT 'five_star'
                  CHECK (rating_scale IN ('five_star','hundred_point')),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_settings_single_row CHECK (id = 1)
);

-- Seed the single row on first migration
INSERT INTO user_settings (id, rating_scale)
VALUES (1, 'five_star')
ON CONFLICT (id) DO NOTHING;

CREATE TRIGGER user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Notes:**
- Single-user app; exactly one row with `id = 1` always exists (seeded on migration).
- `CHECK (id = 1)` enforces the single-row invariant at DB level.
- `rating_scale` affects all display; stored values in `tasting_notes.rating` are always 1–100.

---

### Entity Relationship Summary

```
locations
  └── wines (location_id → locations.id, ON DELETE SET NULL)
       ├── bottle_events (wine_id → wines.id, ON DELETE CASCADE)
       └── tasting_notes (wine_id → wines.id, ON DELETE CASCADE)

user_settings  (standalone; single row; id=1)
```

---

### Migration File Ordering (db/ folder)

| File | Content |
|------|---------|
| `db/001_create_locations.sql` | locations table + trigger |
| `db/002_create_wines.sql` | wines table + indexes + trigger |
| `db/003_create_bottle_events.sql` | bottle_events table + indexes |
| `db/004_create_tasting_notes.sql` | tasting_notes table + indexes |
| `db/005_create_user_settings.sql` | user_settings table + seed row |

All files are applied in numeric order by `npm run migrate`. The migration script must apply them idempotently (each file wrapped in a transaction or using `IF NOT EXISTS`).
