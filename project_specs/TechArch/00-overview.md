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
