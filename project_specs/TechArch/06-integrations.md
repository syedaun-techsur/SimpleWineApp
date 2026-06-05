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
