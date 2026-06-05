---

## Y3: External Integration Points

SimpleWineApp MVP has **no external API integrations**. All data is internal (PostgreSQL). This section documents the system boundaries and any infrastructure-level integration contracts.

---

### PostgreSQL 16 (Primary Datastore)

| Property | Value |
|----------|-------|
| Technology | PostgreSQL 16 |
| Container service | `db` (docker-compose service name) |
| Image | `postgres:16` |
| Port | 5432 (internal only; not exposed to host) |
| Database name | `simplewineapp` |
| User | `postgres` |
| Password | `postgres` (local dev; override via env for production) |
| Connection string | `postgresql://postgres:postgres@db:5432/simplewineapp` |
| Connection env var | `DATABASE_URL` |

**Contract:**
- The `app` service must wait for `db` to be healthy before running migrations or accepting traffic. Implemented via `depends_on` with `condition: service_healthy` in `docker-compose.yml`.
- `db` service should have a `healthcheck` using `pg_isready -U postgres`.
- Application code must use `DATABASE_URL` environment variable (not hardcoded) for the connection string.

---

### Docker Compose Stack

| Service | Image | Ports | Depends On |
|---------|-------|-------|-----------|
| `db` | `postgres:16` | 5432 (internal) | — |
| `app` | Dockerfile (Next.js 14) | 3000 → 3000 | `db` (healthy) |

**`app` service startup sequence:**
1. Wait for `db` healthy.
2. Run `npm run migrate` (applies all SQL files in `db/` in order).
3. Run `npm start` (serves Next.js production build).

**Environment variables passed to `app` service:**
```
DATABASE_URL=postgresql://postgres:postgres@db:5432/simplewineapp
NODE_ENV=production
```

---

### Browser APIs (Client-Side)

| API | Usage | Feature |
|-----|-------|---------|
| `sessionStorage` | Persist search/filter/sort state on `/cellar` | F03 |
| `Date` / `getFullYear()` | Compute readiness badge client-side | F05 |

No localStorage, cookies, IndexedDB, service workers, or push notifications in MVP.

---

### Out-of-Scope Integrations (Explicitly Excluded from MVP)

| Integration | Reason Excluded |
|------------|----------------|
| Wine API (e.g., Vivino, Wine-Searcher) | No external APIs in MVP per PRD |
| AI/ML recommendations | Explicitly excluded per PRD |
| OAuth / SSO / Auth providers | No authentication in MVP |
| Email / push notifications | No real-time features in MVP |
| Payment / e-commerce | No marketplace features |
| Analytics (e.g., Google Analytics) | Not specified; deferred |
| CDN / object storage | No image upload in MVP |

---

### Security Boundary Notes

- **No `X-Frame-Options: DENY`:** App must render in an iframe preview. This header must not be set in `next.config.mjs` or any middleware.
- **No `frame-ancestors: 'none'` or `'self'` in CSP:** Same reason. If a CSP header is set, `frame-ancestors` must either be omitted or set to `*`.
- **No authentication middleware:** All routes are publicly accessible (single-user local app).
- **`next.config.mjs`:** The config file extension must be `.mjs`, never `.ts`. Next.js 14 will hard-error with a `.ts` config file.

---

*End of Y3: Integrations*
