---
phase: implement-the-full-simplewineapp-system
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - docker-compose.yml
  - Dockerfile
  - next.config.mjs
  - package.json
  - db/001_create_locations.sql
  - db/002_create_wines.sql
  - db/003_create_bottle_events.sql
  - db/004_create_tasting_notes.sql
  - db/005_create_user_settings.sql
  - scripts/migrate.js
autonomous: true

features:
  implements: ["F0", "F1", "F2", "F4", "F5"]
  depends_on: []
  enables: ["F0", "F1", "F2", "F3", "F4", "F5", "F6"]

must_haves:
  truths:
    - "docker compose up --build starts both db and app services without error"
    - "PostgreSQL 16 db service passes healthcheck (pg_isready -U postgres)"
    - "app service waits for db healthcheck before starting"
    - "npm run migrate runs all 5 SQL migrations in order (001–005)"
    - "All 5 tables exist after migrate: locations, wines, bottle_events, tasting_notes, user_settings"
    - "user_settings table has exactly one seeded row (id=1, rating_scale='five_star')"
    - "App is reachable at localhost:3000 after docker compose up"
    - "No X-Frame-Options or frame-ancestors CSP headers are emitted"
    - "next.config.mjs exists (not .ts) with correct header configuration"
    - "DATABASE_URL uses hostname 'db' not 'localhost'"
  artifacts:
    - path: "docker-compose.yml"
      provides: "Full docker-compose stack with db + app services, healthcheck, depends_on service_healthy"
    - path: "Dockerfile"
      provides: "Next.js app container with migrate-then-start entrypoint"
    - path: "next.config.mjs"
      provides: "Next.js 14 config with no frame-blocking headers; only nosniff + referrer-policy"
    - path: "db/001_create_locations.sql"
      provides: "locations table + shared update_updated_at_column trigger function"
    - path: "db/002_create_wines.sql"
      provides: "wines table with all 20 columns, 4 indexes, FK to locations ON DELETE SET NULL"
    - path: "db/003_create_bottle_events.sql"
      provides: "bottle_events table with 6 columns, 3 indexes, FK to wines ON DELETE CASCADE"
    - path: "db/004_create_tasting_notes.sql"
      provides: "tasting_notes table with 12 columns, 3 indexes, FK to wines ON DELETE CASCADE"
    - path: "db/005_create_user_settings.sql"
      provides: "user_settings table with single-row invariant, seeded row id=1"
    - path: "scripts/migrate.js"
      provides: "Migration runner: reads db/*.sql in lexicographic order, applies each via pg client"
  key_links:
    - from: "Dockerfile"
      to: "scripts/migrate.js"
      via: "CMD sh -c 'npm run migrate && npm start'"
      pattern: "npm run migrate"
    - from: "docker-compose.yml"
      to: "db service"
      via: "depends_on condition: service_healthy"
      pattern: "service_healthy"
    - from: "scripts/migrate.js"
      to: "db/*.sql"
      via: "fs.readdirSync + pg client query"
      pattern: "readdir.*db"
    - from: "app service"
      to: "PostgreSQL db"
      via: "DATABASE_URL=postgresql://postgres:postgres@db:5432/simplewineapp"
      pattern: "postgresql.*@db:"

integration_contracts:
  requires: []
  provides:
    - artifact: "docker-compose.yml"
      exports: ["db service (postgres:16, port 5432)", "app service (Next.js, port 3000)", "swa_pgdata volume"]
      shape: |
        services:
          db: { image: postgres:16, healthcheck: pg_isready -U postgres }
          app: { build: ., ports: 3000:3000, depends_on: db condition service_healthy }
        volumes:
          swa_pgdata:
      verify: "grep -n 'service_healthy' docker-compose.yml && grep -n 'postgres:16' docker-compose.yml && echo CONTRACT_OK"
    - artifact: "db/001_create_locations.sql"
      exports: ["locations table", "update_updated_at_column() trigger function"]
      shape: |
        CREATE TABLE IF NOT EXISTS locations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CONSTRAINT locations_name_unique UNIQUE (LOWER(name))
        );
      verify: "grep -n 'CREATE TABLE IF NOT EXISTS locations' db/001_create_locations.sql && echo CONTRACT_OK"
    - artifact: "db/002_create_wines.sql"
      exports: ["wines table", "idx_wines_location_id", "idx_wines_wine_type", "idx_wines_vintage", "idx_wines_created_at"]
      shape: |
        wines(id SERIAL PK, name VARCHAR(255) NOT NULL, producer VARCHAR(255) NOT NULL,
              vintage INTEGER NOT NULL CHECK(1900..2100), wine_type VARCHAR(20) NOT NULL CHECK(8 enum values),
              grape VARCHAR(255), country VARCHAR(100), region VARCHAR(100), bottle_size VARCHAR(50),
              quantity INTEGER NOT NULL DEFAULT 1 CHECK(0..9999),
              location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
              purchase_date DATE, purchase_source VARCHAR(255), purchase_price NUMERIC(8,2),
              drinking_window_start INTEGER CHECK(>=1900), drinking_window_end INTEGER CHECK(>=1900),
              notes TEXT, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ,
              CONSTRAINT wines_window_order CHECK(end>=start or either null))
      verify: "grep -n 'CREATE TABLE IF NOT EXISTS wines' db/002_create_wines.sql && grep -n 'location_id' db/002_create_wines.sql && echo CONTRACT_OK"
    - artifact: "db/003_create_bottle_events.sql"
      exports: ["bottle_events table", "idx_bottle_events_wine_id", "idx_bottle_events_event_date", "idx_bottle_events_event_type"]
      shape: |
        bottle_events(id SERIAL PK, wine_id INTEGER NOT NULL REFERENCES wines(id) ON DELETE CASCADE,
                      event_type VARCHAR(20) NOT NULL CHECK(Consumed|Gifted|Opened),
                      event_date DATE NOT NULL DEFAULT CURRENT_DATE,
                      note VARCHAR(500), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())
      verify: "grep -n 'CREATE TABLE IF NOT EXISTS bottle_events' db/003_create_bottle_events.sql && echo CONTRACT_OK"
    - artifact: "db/004_create_tasting_notes.sql"
      exports: ["tasting_notes table", "idx_tasting_notes_wine_id", "idx_tasting_notes_tasted_on", "idx_tasting_notes_rating"]
      shape: |
        tasting_notes(id SERIAL PK, wine_id INTEGER NOT NULL REFERENCES wines(id) ON DELETE CASCADE,
                      tasted_on DATE NOT NULL DEFAULT CURRENT_DATE,
                      appearance VARCHAR(1000), aroma VARCHAR(1000), flavor VARCHAR(1000), finish VARCHAR(1000),
                      rating INTEGER CHECK(1..100),
                      would_buy_again VARCHAR(5) CHECK(yes|no|maybe),
                      occasion VARCHAR(20) CHECK(7 enum values),
                      guest_feedback VARCHAR(2000), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())
      verify: "grep -n 'CREATE TABLE IF NOT EXISTS tasting_notes' db/004_create_tasting_notes.sql && echo CONTRACT_OK"
    - artifact: "db/005_create_user_settings.sql"
      exports: ["user_settings table", "seeded row id=1 rating_scale=five_star"]
      shape: |
        user_settings(id INTEGER PRIMARY KEY DEFAULT 1, rating_scale VARCHAR(15) NOT NULL DEFAULT 'five_star'
                      CHECK(five_star|hundred_point), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                      CONSTRAINT user_settings_single_row CHECK(id=1))
        -- Seeded: INSERT INTO user_settings (id,rating_scale) VALUES (1,'five_star') ON CONFLICT (id) DO NOTHING
      verify: "grep -n 'CREATE TABLE IF NOT EXISTS user_settings' db/005_create_user_settings.sql && grep -n 'ON CONFLICT' db/005_create_user_settings.sql && echo CONTRACT_OK"
    - artifact: "next.config.mjs"
      exports: ["No X-Frame-Options header", "No frame-ancestors CSP", "X-Content-Type-Options: nosniff", "Referrer-Policy: strict-origin-when-cross-origin"]
      shape: |
        export default { async headers() { return [{ source: '/(.*)', headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }
        ]}] } }
      verify: "grep -n 'X-Content-Type-Options' next.config.mjs && ! grep -n 'X-Frame-Options' next.config.mjs && echo CONTRACT_OK"
---

<objective>
Bootstrap the complete docker-compose infrastructure and apply all 5 SQL migrations that establish the full SimpleWineApp database schema.

Purpose: Every subsequent wave (backend APIs, frontend UI) depends on these tables existing with exact column names, types, constraints, and indexes. This wave also creates the Next.js config and container entrypoint so `docker compose up --build` produces a running app at localhost:3000 from a cold start.

Output:
- docker-compose.yml: db (postgres:16) + app (Next.js) services with healthcheck and depends_on service_healthy
- Dockerfile: Node 20 multi-stage build with `npm run migrate && npm start` entrypoint
- next.config.mjs: No frame-blocking headers; only safe headers (NFR-005, NFR-006)
- db/001–005 SQL migration files: exact DDL from TechArch §3.2
- scripts/migrate.js: applies migrations in lexicographic order via pg client
- package.json scripts: `migrate` and `start` entries
</objective>

<feature_dependencies>
Implements: F0: wines table schema (name, producer, vintage, wine_type, quantity, location_id, drinking_window_start/end, etc.)
            F1: bottle_events table (wine_id FK, event_type Consumed/Gifted/Opened, event_date, note)
            F2: locations table (name VARCHAR(100), UNIQUE(LOWER(name)), wine FK ON DELETE SET NULL)
            F4: tasting_notes table (structured sensory fields, rating 1-100, would_buy_again, occasion) + user_settings table (rating_scale)
            F5: wines.drinking_window_start, wines.drinking_window_end columns + wines_window_order CHECK constraint
Depends on: None
Enables: F0, F1, F2, F3, F4, F5, F6 (all features read/write these tables)
</feature_dependencies>

<execution_context>
@/root/.config/opencode/pivota_spec-framework/workflows/execute-plan.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/express/implement-the-full-simplewineapp-system-/WAVE-SCHEDULE.md
@project_specs/TechArch-SimpleWineApp.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create docker-compose.yml, Dockerfile, next.config.mjs, and package.json scaffold</name>
  <files>
    docker-compose.yml
    Dockerfile
    next.config.mjs
    package.json
  </files>
  <action>
**docker-compose.yml** — copy EXACTLY from TechArch §1.3 with no omissions:

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
    build: .
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

**Dockerfile** — Node 20 LTS, multi-stage build for Next.js 14 production:

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/db ./db
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs
EXPOSE 3000

# Entrypoint: run migrations then start Next.js (from TechArch §1.3)
CMD ["sh", "-c", "npm run migrate && npm start"]
```

**next.config.mjs** — MUST be `.mjs` not `.ts` (NFR-006, TechArch §1.1). No X-Frame-Options, no frame-ancestors CSP (NFR-005, TechArch §5.2):

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Explicitly omit X-Frame-Options and frame-ancestors CSP
          // to allow iframe embedding in preview environments. (NFR-005)
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
```

**package.json** — create or update to ensure these scripts exist. If package.json already exists, merge scripts only; do not remove existing fields. Required scripts:

```json
{
  "name": "simplewineapp",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start -p 3000",
    "migrate": "node scripts/migrate.js",
    "lint": "next lint"
  }
}
```

If package.json does NOT exist yet, create a minimal one. If it already exists, only add/update the `migrate` and `start` script entries — preserve all existing dependencies and other scripts.
  </action>
  <verify>
```bash
# Validate docker-compose config
docker compose config --quiet && echo "COMPOSE CONFIG VALID"

# Confirm db hostname in compose env
grep -n 'DATABASE_URL.*@db:' docker-compose.yml && echo "DB HOSTNAME CORRECT"

# Confirm service_healthy condition
grep -n 'service_healthy' docker-compose.yml && echo "HEALTHCHECK DEPENDS_ON OK"

# Confirm next.config.mjs exists (not .ts)
ls next.config.mjs && echo "CONFIG FILE CORRECT"

# Confirm no frame-blocking headers
! grep -n 'X-Frame-Options' next.config.mjs && echo "NO XFRAME OPTIONS"
! grep -n 'frame-ancestors' next.config.mjs && echo "NO FRAME-ANCESTORS"

# Confirm migrate script entry
grep -n '"migrate"' package.json && echo "MIGRATE SCRIPT EXISTS"
```
  </verify>
  <done>
- docker-compose.yml validates cleanly with `docker compose config`
- DATABASE_URL in compose uses `@db:5432` (not localhost)
- db service has healthcheck `pg_isready -U postgres` with interval:5s timeout:5s retries:10
- app service has `depends_on: db: condition: service_healthy`
- next.config.mjs exists (not .ts) with output:'standalone' and no X-Frame-Options or frame-ancestors headers
- package.json has `"migrate": "node scripts/migrate.js"` and `"start": "next start -p 3000"`
- Dockerfile CMD is `sh -c 'npm run migrate && npm start'`
  </done>
</task>

<task type="auto">
  <name>Task 2: Create all 5 SQL migration files and migration runner script</name>
  <files>
    db/001_create_locations.sql
    db/002_create_wines.sql
    db/003_create_bottle_events.sql
    db/004_create_tasting_notes.sql
    db/005_create_user_settings.sql
    scripts/migrate.js
  </files>
  <action>
Create the `db/` directory and all 5 migration files with EXACT DDL from TechArch §3.2 — copy verbatim, do NOT abstract, rename, or reorder columns.

---

**db/001_create_locations.sql** (TechArch §3.2 Migration 001):

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

---

**db/002_create_wines.sql** (TechArch §3.2 Migration 002):

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

---

**db/003_create_bottle_events.sql** (TechArch §3.2 Migration 003):

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

---

**db/004_create_tasting_notes.sql** (TechArch §3.2 Migration 004):

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

---

**db/005_create_user_settings.sql** (TechArch §3.2 Migration 005):

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

---

**scripts/migrate.js** — Node.js migration runner using `pg` library. Reads all `.sql` files from `db/` in lexicographic order and applies each one. Uses `DATABASE_URL` from environment (set by docker-compose to `postgresql://postgres:postgres@db:5432/simplewineapp`):

```javascript
#!/usr/bin/env node
'use strict';

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrate() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('ERROR: DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();
    console.log('Connected to database');

    const dbDir = path.join(__dirname, '..', 'db');
    const files = fs.readdirSync(dbDir)
      .filter(f => f.endsWith('.sql'))
      .sort(); // lexicographic order: 001 → 005

    console.log(`Found ${files.length} migration file(s): ${files.join(', ')}`);

    for (const file of files) {
      const filePath = path.join(dbDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      console.log(`Applying migration: ${file}`);
      await client.query(sql);
      console.log(`  ✓ ${file} applied`);
    }

    console.log('All migrations applied successfully');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
```

Note: `pg` must be in package.json dependencies. Add it if not already present:
- In package.json dependencies: `"pg": "^8.0.0"`
- This is required for `scripts/migrate.js` AND for the Next.js API routes (lib/db.ts) in wave 2.
  </action>
  <verify>
```bash
# Verify all 5 migration files exist
ls db/001_create_locations.sql db/002_create_wines.sql db/003_create_bottle_events.sql db/004_create_tasting_notes.sql db/005_create_user_settings.sql && echo "ALL 5 MIGRATION FILES EXIST"

# Verify migration runner exists
ls scripts/migrate.js && echo "MIGRATE SCRIPT EXISTS"

# Spot-check key DDL in each file
grep -n 'CREATE TABLE IF NOT EXISTS locations' db/001_create_locations.sql && echo "LOCATIONS TABLE OK"
grep -n 'update_updated_at_column' db/001_create_locations.sql && echo "TRIGGER FUNCTION OK"
grep -n 'CREATE TABLE IF NOT EXISTS wines' db/002_create_wines.sql && echo "WINES TABLE OK"
grep -n 'drinking_window_start' db/002_create_wines.sql && echo "DRINKING WINDOW COLS OK"
grep -n 'ON DELETE SET NULL' db/002_create_wines.sql && echo "FK SET NULL OK"
grep -n 'wines_window_order' db/002_create_wines.sql && echo "WINDOW ORDER CONSTRAINT OK"
grep -n "event_type IN ('Consumed','Gifted','Opened')" db/003_create_bottle_events.sql && echo "BOTTLE EVENTS ENUM OK"
grep -n 'ON DELETE CASCADE' db/003_create_bottle_events.sql && echo "BOTTLE EVENTS CASCADE OK"
grep -n "rating.*CHECK.*rating >= 1 AND rating <= 100" db/004_create_tasting_notes.sql && echo "RATING CHECK OK"
grep -n 'ON CONFLICT (id) DO NOTHING' db/005_create_user_settings.sql && echo "SETTINGS SEED OK"
grep -n 'user_settings_single_row' db/005_create_user_settings.sql && echo "SINGLE ROW CONSTRAINT OK"

# Verify pg is in package.json
grep -n '"pg"' package.json && echo "PG DEPENDENCY OK"

# Full docker build + compose validation
docker build -t simplewineapp-build-check . 2>&1 | tail -5 && echo "BUILD OK"
docker compose config --quiet && echo "COMPOSE CONFIG VALID"
docker compose up -d && sleep 15 && docker compose ps && echo "SERVICES UP" && docker compose down
```
  </verify>
  <done>
- All 5 SQL files exist in db/ with exact DDL from TechArch §3.2 (column names, types, constraints, indexes match verbatim)
- locations table: SERIAL PK, VARCHAR(100) name, UNIQUE(LOWER(name)), timestamps, update_updated_at_column trigger
- wines table: 20 columns including drinking_window_start/end, FK location_id ON DELETE SET NULL, wines_window_order CHECK constraint, 4 indexes
- bottle_events table: wine_id FK ON DELETE CASCADE, event_type CHECK(Consumed|Gifted|Opened), 3 indexes; NO updated_at (immutable)
- tasting_notes table: wine_id FK ON DELETE CASCADE, rating CHECK(1-100), would_buy_again CHECK(yes|no|maybe), occasion CHECK(7 values), 3 indexes; NO updated_at (immutable)
- user_settings table: id=1 single-row invariant, seeded with INSERT ON CONFLICT DO NOTHING, update trigger
- scripts/migrate.js reads db/*.sql in lexicographic sort order and applies via pg client
- package.json includes `"pg": "^8.0.0"` in dependencies
- `docker compose up --build` completes and app reaches localhost:3000
- `docker compose down` cleans up successfully
  </done>
</task>

</tasks>

<verification>
```bash
# 1. Confirm no next.config.ts exists
! ls next.config.ts 2>/dev/null && echo "NO .TS CONFIG"

# 2. Confirm next.config.mjs exists
ls next.config.mjs && echo "MJS CONFIG EXISTS"

# 3. Confirm no frame-blocking headers
! grep -rn 'X-Frame-Options' next.config.mjs && echo "NO XFRAME HEADER"
! grep -rn 'frame-ancestors' next.config.mjs && echo "NO FRAME-ANCESTORS"

# 4. Confirm DATABASE_URL uses hostname 'db'
grep -n 'DATABASE_URL.*@db:' docker-compose.yml && echo "DB HOSTNAME OK"

# 5. Confirm all 5 migration files exist
ls db/00{1,2,3,4,5}_*.sql | wc -l | grep -q '5' && echo "5 MIGRATIONS OK"

# 6. Full stack cold-start validation
docker compose up -d --build
sleep 20
docker compose ps | grep 'Up' | wc -l | grep -q '2' && echo "BOTH SERVICES UP"
curl -sf http://localhost:3000 > /dev/null && echo "APP REACHABLE"
docker compose down

# 7. Confirm curl response does NOT include X-Frame-Options
docker compose up -d
sleep 15
curl -sI http://localhost:3000 | grep -v 'X-Frame-Options' && echo "NO XFRAME IN RESPONSE"
docker compose down
```
</verification>

<success_criteria>
- `docker compose up --build` cold-start succeeds; both `db` and `app` services reach Up state
- App is reachable at localhost:3000 after cold start
- HTTP response headers do NOT include X-Frame-Options or frame-ancestors CSP
- `next.config.mjs` exists (never `next.config.ts`)
- All 5 tables exist in the PostgreSQL database after migration: locations, wines, bottle_events, tasting_notes, user_settings
- user_settings has exactly one row: id=1, rating_scale='five_star'
- wines.location_id FK references locations with ON DELETE SET NULL (non-destructive location delete — NFR-009)
- bottle_events.wine_id and tasting_notes.wine_id FKs reference wines with ON DELETE CASCADE
- DATABASE_URL uses hostname `db` not `localhost` (NFR-004)
- `npm run migrate` is idempotent (re-running produces no errors — IF NOT EXISTS + ON CONFLICT DO NOTHING)
</success_criteria>

<output>
After completion, create `.planning/express/implement-the-full-simplewineapp-system-/01-SUMMARY.md` with:
- Files created/modified
- Key decisions made
- Artifacts produced (table names, docker service names, ports)
- Any conflicts or deviations from spec (flag prominently)
</output>
