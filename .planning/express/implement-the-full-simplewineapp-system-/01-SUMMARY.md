---
phase: implement-the-full-simplewineapp-system
plan: "01"
subsystem: infrastructure/database
tags: [docker, postgres, nextjs, migrations, sql, ddl]
dependency_graph:
  requires: []
  provides:
    - docker-compose.yml (db + app services with healthcheck)
    - Dockerfile (Node 20 multi-stage, migrate-then-start entrypoint)
    - next.config.mjs (standalone output, no frame-blocking headers)
    - db/001-005 SQL migrations (full SimpleWineApp schema)
    - scripts/migrate.js (lexicographic migration runner)
  affects: []
tech_stack:
  added:
    - "Next.js 14.2.29 (standalone output mode)"
    - "PostgreSQL 16 (docker service)"
    - "Node 20 Alpine (docker base image)"
    - "pg ^8.0.0 (PostgreSQL client for migration runner)"
  patterns:
    - "Multi-stage Docker build (deps → builder → runner)"
    - "Migrate-then-start container entrypoint"
    - "IF NOT EXISTS + ON CONFLICT DO NOTHING idempotent migrations"
    - "Shared update_updated_at_column() trigger function (reused by all mutable tables)"
key_files:
  created:
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
  modified: []
decisions:
  - "X-Frame-Options explicitly omitted from next.config.mjs headers to allow iframe embedding per NFR-005; only nosniff + referrer-policy headers are set"
  - "next.config.mjs uses .mjs extension (not .ts) per NFR-006"
  - "DATABASE_URL uses hostname 'db' (not 'localhost') for Docker service networking per NFR-004"
  - "bottle_events and tasting_notes have no updated_at column (immutable audit records)"
  - "user_settings seeded with ON CONFLICT DO NOTHING for idempotent re-runs"
metrics:
  duration: "~10 minutes"
  completed_date: "2026-06-05"
  tasks_completed: 2
  files_created: 10
  files_modified: 0
---

# Phase implement-the-full-simplewineapp-system Plan 01: Infrastructure Bootstrap & Database Schema Summary

**One-liner:** Docker Compose + Postgres 16 stack with 5 SQL migrations creating the full SimpleWineApp schema (locations, wines, bottle_events, tasting_notes, user_settings) and migrate-then-start Next.js container entrypoint.

---

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create docker-compose.yml, Dockerfile, next.config.mjs, and package.json scaffold | a8367f7 | docker-compose.yml, Dockerfile, next.config.mjs, package.json |
| 2 | Create all 5 SQL migration files and migration runner script | a49150f | db/001-005 *.sql, scripts/migrate.js |

---

## Files Created

### Infrastructure Files

**docker-compose.yml**
- `db` service: postgres:16, healthcheck `pg_isready -U postgres` (interval:5s, timeout:5s, retries:10), volume `swa_pgdata`
- `app` service: builds from Dockerfile, port 3000:3000, `DATABASE_URL=postgresql://postgres:postgres@db:5432/simplewineapp`, `depends_on: db: condition: service_healthy`

**Dockerfile**
- Multi-stage: `deps` (production deps) → `builder` (full build + `npm run build`) → `runner` (minimal production image)
- Node 20 Alpine base, nextjs system user (uid:1001)
- Copies: standalone build, static assets, scripts/, db/, node_modules, package.json
- `CMD ["sh", "-c", "npm run migrate && npm start"]`

**next.config.mjs** (`.mjs` not `.ts` per NFR-006)
- `output: 'standalone'` for Docker compatibility
- Headers: only `X-Content-Type-Options: nosniff` and `Referrer-Policy: strict-origin-when-cross-origin`
- Explicitly omits `X-Frame-Options` and `frame-ancestors` CSP per NFR-005

**package.json**
- Next.js 14.2.29, React 18, pg ^8.0.0
- Scripts: `dev`, `build`, `start` (port 3000), `migrate`, `lint`

### SQL Migration Files

**db/001_create_locations.sql**
- `locations` table: `id SERIAL PK`, `name VARCHAR(100) NOT NULL`, `created_at/updated_at TIMESTAMPTZ`, `CONSTRAINT locations_name_unique UNIQUE (LOWER(name))`
- Shared `update_updated_at_column()` trigger function (reused by wines and user_settings)
- `locations_updated_at` trigger

**db/002_create_wines.sql**
- `wines` table: 20 columns including all FK and constraint columns
- Key columns: `vintage INTEGER CHECK(1900-2100)`, `wine_type VARCHAR(20) CHECK(8 enum)`, `quantity INTEGER DEFAULT 1 CHECK(0-9999)`, `location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL`, `drinking_window_start/end INTEGER CHECK(>=1900)`
- `CONSTRAINT wines_window_order CHECK(end>=start or either null)`
- 4 indexes: `idx_wines_location_id`, `idx_wines_wine_type`, `idx_wines_vintage`, `idx_wines_created_at DESC`
- `wines_updated_at` trigger

**db/003_create_bottle_events.sql**
- `bottle_events` table: 6 columns, NO `updated_at` (immutable audit log)
- `wine_id INTEGER NOT NULL REFERENCES wines(id) ON DELETE CASCADE`
- `event_type VARCHAR(20) CHECK(IN('Consumed','Gifted','Opened'))`
- 3 indexes: `idx_bottle_events_wine_id`, `idx_bottle_events_event_date DESC`, `idx_bottle_events_event_type`

**db/004_create_tasting_notes.sql**
- `tasting_notes` table: 12 columns, NO `updated_at` (immutable)
- `wine_id INTEGER NOT NULL REFERENCES wines(id) ON DELETE CASCADE`
- `rating INTEGER CHECK(1-100)`, `would_buy_again VARCHAR(5) CHECK(yes|no|maybe)`
- `occasion VARCHAR(20) CHECK(dinner|gift|casual|celebration|restaurant|tasting|other)`
- 3 indexes: `idx_tasting_notes_wine_id`, `idx_tasting_notes_tasted_on DESC`, `idx_tasting_notes_rating DESC`

**db/005_create_user_settings.sql**
- `user_settings` table: `id INTEGER PRIMARY KEY DEFAULT 1`, `rating_scale VARCHAR(15) NOT NULL DEFAULT 'five_star' CHECK(five_star|hundred_point)`, `updated_at TIMESTAMPTZ`
- `CONSTRAINT user_settings_single_row CHECK (id = 1)`
- Seeded: `INSERT INTO user_settings (id, rating_scale) VALUES (1, 'five_star') ON CONFLICT (id) DO NOTHING`
- `user_settings_updated_at` trigger

**scripts/migrate.js**
- Reads `DATABASE_URL` env var (exits with error if unset)
- `fs.readdirSync(dbDir).filter(.sql).sort()` — lexicographic order ensures 001→005
- Applies each SQL file via `pg` Client `client.query(sql)`
- Full error handling with `process.exit(1)` on failure

---

## Artifacts Produced

| Artifact | Type | Key Details |
|----------|------|-------------|
| Docker Compose stack | Infrastructure | db (postgres:16, port 5432) + app (Next.js, port 3000), swa_pgdata volume |
| locations table | Database | SERIAL PK, UNIQUE(LOWER(name)), updated_at trigger |
| wines table | Database | 20 columns, 4 indexes, FK→locations ON DELETE SET NULL |
| bottle_events table | Database | 6 columns, 3 indexes, FK→wines ON DELETE CASCADE, immutable |
| tasting_notes table | Database | 12 columns, 3 indexes, FK→wines ON DELETE CASCADE, immutable |
| user_settings table | Database | Single-row (id=1), seeded, rating_scale enum |
| Migration runner | Script | Lexicographic order, idempotent, pg client |

---

## Key Decisions Made

1. **X-Frame-Options omitted** — next.config.mjs headers intentionally exclude `X-Frame-Options` and `frame-ancestors` CSP to support iframe embedding in preview/development environments per NFR-005
2. **`.mjs` extension** — `next.config.mjs` uses `.mjs` (not `.ts`) per NFR-006 requirement
3. **`db` hostname** — `DATABASE_URL` uses Docker service hostname `db` not `localhost` to work within Docker Compose networking per NFR-004
4. **Immutable tables** — `bottle_events` and `tasting_notes` have no `updated_at` column; records are append-only per audit log pattern
5. **Idempotent migrations** — All DDL uses `IF NOT EXISTS`; seed uses `ON CONFLICT DO NOTHING`; migrations can be re-run safely

---

## Deviations from Plan

### Environment Constraint (Non-blocking)

**Docker unavailable in execution environment**
- **Found during:** Task 1 & 2 verification
- **Issue:** Docker CLI not present in the agent execution environment (`docker: command not found`)
- **Impact:** Could not run `docker compose config --quiet` or `docker compose up --build` validation during execution
- **Mitigation:** All files verified structurally (content checks, grep assertions) — DDL matches TechArch §3.2 verbatim, compose configuration matches spec exactly
- **Runtime validation:** Must be performed by verifier phase with actual Docker environment

---

## Self-Check

### Files Exist
- [x] docker-compose.yml ✓
- [x] Dockerfile ✓
- [x] next.config.mjs ✓
- [x] package.json ✓
- [x] db/001_create_locations.sql ✓
- [x] db/002_create_wines.sql ✓
- [x] db/003_create_bottle_events.sql ✓
- [x] db/004_create_tasting_notes.sql ✓
- [x] db/005_create_user_settings.sql ✓
- [x] scripts/migrate.js ✓

### Commits Exist
- [x] a8367f7 — Task 1 (docker-compose, Dockerfile, next.config.mjs, package.json)
- [x] a49150f — Task 2 (5 SQL migrations + migrate.js)

## Self-Check: PASSED
