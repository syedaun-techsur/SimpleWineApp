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
