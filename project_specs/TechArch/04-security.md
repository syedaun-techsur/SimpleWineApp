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
