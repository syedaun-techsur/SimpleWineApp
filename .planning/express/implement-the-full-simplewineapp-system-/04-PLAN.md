---
phase: implement-the-full-simplewineapp-system
plan: 04
type: execute
wave: 4
depends_on: [1, 2a, 2b, 3a, 3b]
files_modified:
  - e2e/integration.spec.ts
autonomous: true

features:
  implements: ["F0", "F1", "F2", "F3", "F4", "F5", "F6"]
  depends_on: ["F0", "F1", "F2", "F3", "F4", "F5", "F6"]
  enables: []

must_haves:
  truths:
    - "docker compose up --build cold-start completes; both db and app reach Up state; app is reachable at localhost:3000 within 60 seconds"
    - "HTTP response headers from localhost:3000 do NOT include X-Frame-Options or frame-ancestors CSP directive"
    - "All primary nav routes resolve (200, not 404): /, /cellar, /wines/new, /locations"
    - "next.config.mjs exists; next.config.ts does NOT exist"
    - "End-to-end CRUD flow: create location → create wine in that location → wine appears in /cellar list → wine detail page shows ReadinessBadge + QuantityControls"
    - "Consume flow: decrement quantity on wine detail triggers RemoveBottleModal → select Consumed → quantity decrements → bottle event log entry created → dashboard stats reflect updated counts"
    - "Tasting note flow: post-consume prompt navigates to /wines/[id]/notes/new → form submits → note visible on wine detail reverse-chronological"
    - "Dashboard stats (total_bottles, unique_wines, drink_now_count, approaching_peak_count) reflect live DB state — not stale cache"
    - "ReadinessBadge on /cellar and /wines/[id] shows correct state computed from current year"
    - "TechSur brand applied: Gold #FBCA5C CTAs visible, Black #0A0A0A nav background, Bone #FAFAF7 page canvas, Montserrat 900 headings present in rendered HTML"
    - "app serves at 375px with no horizontal scroll on /, /cellar, /wines/new, /locations"
  artifacts:
    - path: "e2e/integration.spec.ts"
      provides: "Playwright integration test suite covering all NFRs and cross-feature flows"
      exports: ["docker cold-start test", "route smoke tests", "iframe compat test", "E2E CRUD flow", "consume→event→dashboard flow", "brand audit"]
  key_links:
    - from: "docker compose up"
      to: "app service (localhost:3000)"
      via: "depends_on: db condition service_healthy → npm run migrate && npm start"
      pattern: "service_healthy"
    - from: "consume bottle event (PATCH /api/wines/[id]/quantity delta:-1)"
      to: "bottle_events table INSERT"
      via: "app/api/wines/[id]/quantity/route.ts transaction"
      pattern: "INSERT INTO bottle_events"
    - from: "GET /api/dashboard"
      to: "stats { drink_now_count, total_bottles }"
      via: "server-side SQL aggregate queries at request time"
      pattern: "total_bottles"
    - from: "ReadinessBadge on /cellar"
      to: "lib/readiness.ts computeReadinessBadge"
      via: "WineCellarList calls computeReadinessBadge per wine on each render"
      pattern: "computeReadinessBadge"

integration_contracts:
  requires:
    - from_plan: "01"
      artifact: "docker-compose.yml"
      exports: ["db service (postgres:16, port 5432)", "app service (Next.js, port 3000)", "swa_pgdata volume"]
      verify: "grep -n 'service_healthy' docker-compose.yml && grep -n 'postgres:16' docker-compose.yml && echo CONTRACT_OK"
    - from_plan: "01"
      artifact: "next.config.mjs"
      exports: ["No X-Frame-Options header", "No frame-ancestors CSP", "X-Content-Type-Options: nosniff"]
      verify: "grep -n 'X-Content-Type-Options' next.config.mjs && ! grep -n 'X-Frame-Options' next.config.mjs && echo CONTRACT_OK"
    - from_plan: "01"
      artifact: "db/001_create_locations.sql"
      exports: ["locations table"]
      verify: "grep -n 'CREATE TABLE IF NOT EXISTS locations' db/001_create_locations.sql && echo CONTRACT_OK"
    - from_plan: "01"
      artifact: "db/002_create_wines.sql"
      exports: ["wines table", "drinking_window_start", "drinking_window_end"]
      verify: "grep -n 'CREATE TABLE IF NOT EXISTS wines' db/002_create_wines.sql && grep -n 'drinking_window_start' db/002_create_wines.sql && echo CONTRACT_OK"
    - from_plan: "01"
      artifact: "db/003_create_bottle_events.sql"
      exports: ["bottle_events table"]
      verify: "grep -n 'CREATE TABLE IF NOT EXISTS bottle_events' db/003_create_bottle_events.sql && echo CONTRACT_OK"
    - from_plan: "2a"
      artifact: "app/api/wines/route.ts"
      exports: ["GET /api/wines → { wines: Wine[] }", "POST /api/wines → Wine (201)"]
      verify: "grep -n 'export.*GET\\|export.*POST' app/api/wines/route.ts && echo CONTRACT_OK"
    - from_plan: "2a"
      artifact: "app/api/wines/[id]/quantity/route.ts"
      exports: ["PATCH /api/wines/[id]/quantity → { quantity, event_id }"]
      verify: "grep -n 'export.*PATCH' app/api/wines/\\[id\\]/quantity/route.ts && echo CONTRACT_OK"
    - from_plan: "2a"
      artifact: "app/api/locations/route.ts"
      exports: ["GET /api/locations → { locations: LocationWithCount[] }", "POST /api/locations → LocationWithCount (201)"]
      verify: "grep -n 'export.*GET\\|export.*POST' app/api/locations/route.ts && echo CONTRACT_OK"
    - from_plan: "2b"
      artifact: "app/api/dashboard/route.ts"
      exports: ["GET /api/dashboard → DashboardResponse"]
      verify: "grep -n 'export.*GET' app/api/dashboard/route.ts && grep -n 'drink_now' app/api/dashboard/route.ts && echo CONTRACT_OK"
    - from_plan: "2b"
      artifact: "lib/readiness.ts"
      exports: ["computeReadinessBadge", "ReadinessBadge"]
      verify: "grep -n 'export function computeReadinessBadge' lib/readiness.ts && echo CONTRACT_OK"
    - from_plan: "3a"
      artifact: "app/components/NavBar.tsx"
      exports: ["NavBar — routes: /, /cellar, /locations, /wines/new"]
      verify: "grep -n '/locations\\|/cellar' app/components/NavBar.tsx && echo CONTRACT_OK"
    - from_plan: "3a"
      artifact: "app/components/QuantityControls.tsx"
      exports: ["QuantityControls"]
      verify: "grep -n 'export.*QuantityControls\\|export default' app/components/QuantityControls.tsx && echo CONTRACT_OK"
    - from_plan: "3b"
      artifact: "app/page.tsx"
      exports: ["default page (Dashboard Server Component)"]
      verify: "grep -n 'DashboardShelf\\|drink_now\\|stat' app/page.tsx && echo CONTRACT_OK"
    - from_plan: "3b"
      artifact: "components/ReadinessBadge.tsx"
      exports: ["ReadinessBadge"]
      verify: "grep -n 'export function ReadinessBadge\\|export default.*ReadinessBadge' components/ReadinessBadge.tsx && echo CONTRACT_OK"
  provides:
    - artifact: "e2e/integration.spec.ts"
      exports: ["verified application stack — all NFRs signed off"]
      shape: |
        Playwright test suite covering:
        - docker cold-start validation (docker compose up --build; curl localhost:3000)
        - Route smoke tests (/, /cellar, /wines/new, /locations all return 200)
        - iframe compat (no X-Frame-Options in response headers)
        - E2E CRUD: create location → create wine → verify in /cellar → wine detail
        - Consume flow: decrement → Consumed event → bottle_events entry → dashboard stats updated
        - Tasting note flow: post-consume prompt → /wines/[id]/notes/new → save → note on detail
        - ReadinessBadge correctness check
        - Brand presence: Gold #FBCA5C, Black nav, Bone canvas, Montserrat 900 heading
        - 375px mobile no horizontal scroll
      verify: "ls e2e/integration.spec.ts && echo CONTRACT_OK"
---

<objective>
Run end-to-end validation of the complete SimpleWineApp system: verify the docker-compose cold-start, all primary routes resolve, iframe compatibility, cross-feature flows (wine CRUD → consume → event log → tasting note → dashboard), ReadinessBadge correctness, and TechSur brand fidelity. Sign off all NFR-001 through NFR-010.

Purpose: Wave 4 is the final quality gate. It does not implement new features; it proves every prior wave's work integrates correctly as a running system. The docker stack, the full API surface, and all UI pages must function end-to-end against a real PostgreSQL database.

Output:
- e2e/integration.spec.ts: Playwright suite covering all integration checks and NFR sign-off
- A passing test run demonstrating all checks pass against the live docker stack
</objective>

<feature_dependencies>
Implements: F0: Wine CRUD end-to-end (create → view → edit → delete verified against real DB)
            F1: Quantity & consume flow (decrement → event log entry → Cellar Empty badge)
            F2: Storage location CRUD + Location Unknown state verified
            F3: /cellar search and filter UI smoke test + URL query param drill-through
            F4: Tasting note form → submit → note on detail page
            F5: ReadinessBadge computation verified from current year (no stale state)
            F6: Dashboard stat tiles reflect live DB state; Drink Now shelf renders correctly
Depends on: F0, F1, F2, F3, F4, F5, F6 — all fully implemented by waves 1–3b
Enables: None (wave 4 is the final wave)
</feature_dependencies>

<execution_context>
@/root/.config/opencode/pivota_spec-framework/workflows/execute-plan.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/express/implement-the-full-simplewineapp-system-/WAVE-SCHEDULE.md
@project_specs/PRD-SimpleWineApp.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Docker stack validation + route smoke tests + NFR audit (NFR-003–006, NFR-010)</name>
  <files>
    e2e/integration.spec.ts
  </files>
  <action>
Create `e2e/integration.spec.ts` as a Playwright test file. It must run against the live docker-compose stack (app on localhost:3000). The test file covers all NFRs and integration checks in a single suite.

**Prerequisites before writing tests:**
1. Ensure Playwright is installed: `npm list @playwright/test 2>/dev/null || npm install --save-dev @playwright/test`
2. Ensure `playwright.config.ts` exists with `baseURL: 'http://localhost:3000'`; if not, create a minimal one
3. The docker stack must be running before tests execute (use `docker compose up -d --build` in the test setup or as a separate step before running)

**playwright.config.ts** (create if missing):
```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:3000',
    viewport: { width: 375, height: 812 }, // default mobile-first
    headless: true,
  },
  retries: 1,
});
```

**e2e/integration.spec.ts** — Write the following tests. Each `test` block must be independently executable. Use `test.describe` groupings for clarity.

```typescript
import { test, expect } from '@playwright/test';

// ──────────────────────────────────────────────────────────────────────────────
// NFR Audit Helper
// ──────────────────────────────────────────────────────────────────────────────
// All tests run against the live docker stack at localhost:3000.
// Run: docker compose up -d --build && npx playwright test e2e/integration.spec.ts

test.describe('NFR-006: next.config.mjs (not .ts)', () => {
  test('next.config.mjs exists and next.config.ts does NOT exist', async () => {
    const { existsSync } = await import('fs');
    expect(existsSync('next.config.mjs')).toBe(true);
    expect(existsSync('next.config.ts')).toBe(false);
  });
});

test.describe('NFR-005 + NFR-010: Frame compatibility and route smoke tests', () => {
  // Route smoke: all primary nav routes must return 200
  for (const route of ['/', '/cellar', '/wines/new', '/locations']) {
    test(`route ${route} returns 200 (no dead link)`, async ({ page }) => {
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
    });
  }

  test('NFR-005: response headers do NOT include X-Frame-Options', async ({ request }) => {
    const response = await request.get('/');
    const xFrameOptions = response.headers()['x-frame-options'];
    // Must be absent or not set to DENY/SAMEORIGIN
    expect(xFrameOptions ?? '').not.toMatch(/DENY|SAMEORIGIN/i);
  });

  test('NFR-005: no frame-ancestors CSP blocking iframe embedding', async ({ request }) => {
    const response = await request.get('/');
    const csp = response.headers()['content-security-policy'] ?? '';
    // frame-ancestors 'none' or 'self' must NOT be present
    expect(csp).not.toMatch(/frame-ancestors\s+['"]?(none|'self')/i);
  });
});

test.describe('NFR-001: Mobile-first at 375px (no horizontal scroll)', () => {
  const mobileViewport = { width: 375, height: 812 };

  for (const route of ['/', '/cellar', '/wines/new', '/locations']) {
    test(`${route} has no horizontal scroll at 375px`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: mobileViewport });
      const page = await context.newPage();
      await page.goto(route);
      // scrollWidth must not exceed clientWidth (no horizontal overflow)
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasHorizontalScroll).toBe(false);
      await context.close();
    });
  }
});

test.describe('NFR-008: TechSur brand fidelity', () => {
  test('Gold #FBCA5C is present in the page (CTA buttons or accents)', async ({ page }) => {
    await page.goto('/');
    // Check that the Gold brand color appears somewhere in inline styles or CSS
    const html = await page.content();
    // Accept either hex or rgb equivalent: #FBCA5C = rgb(251, 202, 92)
    expect(html.toLowerCase()).toMatch(/#fbca5c|rgb\(251,\s*202,\s*92\)/i);
  });

  test('Black #0A0A0A nav background is present', async ({ page }) => {
    await page.goto('/');
    const html = await page.content();
    expect(html.toLowerCase()).toMatch(/#0a0a0a|rgb\(10,\s*10,\s*10\)/i);
  });

  test('Bone #FAFAF7 canvas color is present', async ({ page }) => {
    await page.goto('/');
    const html = await page.content();
    expect(html.toLowerCase()).toMatch(/#fafaf7|rgb\(250,\s*250,\s*247\)/i);
  });

  test('Montserrat 900 display font referenced in layout or CSS', async ({ page }) => {
    await page.goto('/');
    // Check font-family reference in HTML (Google Fonts link or CSS var)
    const html = await page.content();
    expect(html).toMatch(/montserrat/i);
  });
});

test.describe('E2E Cross-Feature Flow: F0 + F2 — Create location then wine', () => {
  let locationName: string;
  let wineId: string;

  test.beforeAll(async ({ request }) => {
    // Create a test location via API
    locationName = `Test Rack ${Date.now()}`;
    const locRes = await request.post('/api/locations', {
      data: { name: locationName },
    });
    expect(locRes.status()).toBe(201);
  });

  test('POST /api/locations creates location and it appears in GET /api/locations', async ({ request }) => {
    const res = await request.get('/api/locations');
    expect(res.status()).toBe(200);
    const data = await res.json();
    const found = data.locations.find((l: { name: string }) => l.name === locationName);
    expect(found).toBeDefined();
    expect(found.wine_count).toBe(0);
  });

  test('POST /api/wines creates wine assigned to the test location', async ({ request }) => {
    // First get the location id
    const locRes = await request.get('/api/locations');
    const locations = (await locRes.json()).locations;
    const loc = locations.find((l: { name: string }) => l.name === locationName);
    expect(loc).toBeDefined();

    const wineRes = await request.post('/api/wines', {
      data: {
        name: 'Château Test Integration',
        producer: 'Integration Producer',
        vintage: 2020,
        wine_type: 'Red',
        quantity: 3,
        location_id: loc.id,
        drinking_window_start: new Date().getFullYear(), // Drink Now
        drinking_window_end: new Date().getFullYear() + 2,
      },
    });
    expect(wineRes.status()).toBe(201);
    const wine = await wineRes.json();
    wineId = String(wine.id);
    expect(wine.name).toBe('Château Test Integration');
    expect(wine.quantity).toBe(3);
  });

  test('wine appears in GET /api/wines list with location_name resolved', async ({ request }) => {
    const res = await request.get('/api/wines');
    expect(res.status()).toBe(200);
    const { wines } = await res.json();
    const found = wines.find((w: { name: string }) => w.name === 'Château Test Integration');
    expect(found).toBeDefined();
    expect(found.location_name).toBe(locationName);
  });

  test('/cellar page renders and search finds the integration wine', async ({ page }) => {
    await page.goto('/cellar');
    expect(await page.title()).toBeTruthy();
    // Page should contain the wine name
    const content = await page.content();
    expect(content).toContain('Château Test Integration');
  });

  test('GET /api/wines/[id] returns wine with tasting_notes and bottle_events arrays', async ({ request }) => {
    expect(wineId).toBeDefined();
    const res = await request.get(`/api/wines/${wineId}`);
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.wine).toBeDefined();
    expect(Array.isArray(data.tasting_notes)).toBe(true);
    expect(Array.isArray(data.bottle_events)).toBe(true);
  });

  test('/wines/[id] detail page renders (200, not 404)', async ({ page }) => {
    expect(wineId).toBeDefined();
    const response = await page.goto(`/wines/${wineId}`);
    expect(response?.status()).toBe(200);
    const content = await page.content();
    expect(content).toContain('Château Test Integration');
  });
});

test.describe('E2E Cross-Feature Flow: F1 — Consume bottle → event log entry created', () => {
  let wineId: string;
  let initialQty: number;

  test.beforeAll(async ({ request }) => {
    // Create a location and wine for this flow
    const locRes = await request.post('/api/locations', {
      data: { name: `Consume Test Rack ${Date.now()}` },
    });
    const loc = await locRes.json();

    const wineRes = await request.post('/api/wines', {
      data: {
        name: 'Consume Flow Wine',
        producer: 'E2E Producer',
        vintage: 2019,
        wine_type: 'White',
        quantity: 2,
        location_id: loc.id,
      },
    });
    const wine = await wineRes.json();
    wineId = String(wine.id);
    initialQty = wine.quantity;
  });

  test('PATCH /api/wines/[id]/quantity delta:-1 with Consumed event decrements quantity and creates bottle_events row', async ({ request }) => {
    const res = await request.patch(`/api/wines/${wineId}/quantity`, {
      data: { delta: -1, event_type: 'Consumed', note: 'E2E test consume' },
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.quantity).toBe(initialQty - 1);
    expect(data.event_id).not.toBeNull();
  });

  test('GET /api/wines/[id]/events shows Consumed event in event log', async ({ request }) => {
    const res = await request.get(`/api/wines/${wineId}/events`);
    expect(res.status()).toBe(200);
    const { events } = await res.json();
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].event_type).toBe('Consumed');
    expect(events[0].note).toBe('E2E test consume');
  });

  test('quantity in GET /api/wines reflects decrement (not stale)', async ({ request }) => {
    const res = await request.get(`/api/wines/${wineId}`);
    expect(res.status()).toBe(200);
    const { wine } = await res.json();
    expect(wine.quantity).toBe(initialQty - 1);
  });

  test('GET /api/dashboard stats reflect the wine in total_bottles count', async ({ request }) => {
    const res = await request.get('/api/dashboard');
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.stats).toBeDefined();
    expect(typeof data.stats.total_bottles).toBe('number');
    expect(typeof data.stats.unique_wines).toBe('number');
    // Stats must be positive integers (DB has test wines now)
    expect(data.stats.total_bottles).toBeGreaterThan(0);
    expect(data.stats.unique_wines).toBeGreaterThan(0);
    // recently_consumed should include our Consumed event
    const recentlyConsumed = data.recently_consumed as Array<{ wine_id: number; event_type: string }>;
    const ourEvent = recentlyConsumed.find(e => String(e.wine_id) === wineId && e.event_type === 'Consumed');
    expect(ourEvent).toBeDefined();
  });
});

test.describe('E2E Cross-Feature Flow: F4 — Tasting note creation', () => {
  let wineId: string;

  test.beforeAll(async ({ request }) => {
    const locRes = await request.post('/api/locations', {
      data: { name: `Note Test Rack ${Date.now()}` },
    });
    const loc = await locRes.json();
    const wineRes = await request.post('/api/wines', {
      data: {
        name: 'Tasting Note Flow Wine',
        producer: 'Note Producer',
        vintage: 2018,
        wine_type: 'Red',
        quantity: 1,
        location_id: loc.id,
      },
    });
    const wine = await wineRes.json();
    wineId = String(wine.id);
  });

  test('POST /api/wines/[id]/notes creates a tasting note (201)', async ({ request }) => {
    const today = new Date().toISOString().split('T')[0];
    const res = await request.post(`/api/wines/${wineId}/notes`, {
      data: {
        tasted_on: today,
        rating: 4, // five_star mode: 4 stars → stored as 80
        appearance: 'Deep ruby',
        aroma: 'Dark fruits, oak',
        flavor: 'Rich and full-bodied',
        finish: 'Long and tannic',
        would_buy_again: 'yes',
        occasion: 'dinner',
      },
    });
    expect(res.status()).toBe(201);
    const note = await res.json();
    expect(note.wine_id).toBe(parseInt(wineId, 10));
    // rating stored as normalized 1-100 (4 stars × 20 = 80)
    expect(note.rating).toBe(80);
    expect(note.appearance).toBe('Deep ruby');
  });

  test('GET /api/wines/[id]/notes returns note in tasted_on DESC order', async ({ request }) => {
    const res = await request.get(`/api/wines/${wineId}/notes`);
    expect(res.status()).toBe(200);
    const { notes } = await res.json();
    expect(notes.length).toBeGreaterThan(0);
    expect(notes[0].appearance).toBe('Deep ruby');
    expect(notes[0].rating).toBe(80);
  });

  test('/wines/[id]/notes/new page renders (200)', async ({ page }) => {
    const response = await page.goto(`/wines/${wineId}/notes/new`);
    expect(response?.status()).toBe(200);
  });
});

test.describe('E2E Cross-Feature Flow: F5 — ReadinessBadge and F6 — Dashboard data', () => {
  test('GET /api/dashboard returns all 8 required keys', async ({ request }) => {
    const res = await request.get('/api/dashboard');
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('stats');
    expect(data).toHaveProperty('drink_now_wines');
    expect(data).toHaveProperty('type_breakdown');
    expect(data).toHaveProperty('country_breakdown');
    expect(data).toHaveProperty('decade_breakdown');
    expect(data).toHaveProperty('recently_added');
    expect(data).toHaveProperty('recently_consumed');
    expect(data).toHaveProperty('highest_rated');
    // stat sub-keys present
    expect(data.stats).toHaveProperty('total_bottles');
    expect(data.stats).toHaveProperty('unique_wines');
    expect(data.stats).toHaveProperty('drink_now_count');
    expect(data.stats).toHaveProperty('approaching_peak_count');
    // All stat values are numbers
    expect(typeof data.stats.total_bottles).toBe('number');
    expect(typeof data.stats.drink_now_count).toBe('number');
  });

  test('dashboard / page renders without error (200)', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    // No Next.js error overlay
    const content = await page.content();
    expect(content).not.toMatch(/Application error|unhandled.*exception/i);
  });

  test('F5: ReadinessBadge present on /wines/[id] detail page for wine with drinking window', async ({ request, page }) => {
    // Create a wine with a drinking window that makes it Drink Now
    const locRes = await request.post('/api/locations', {
      data: { name: `Badge Test Rack ${Date.now()}` },
    });
    const loc = await locRes.json();
    const cy = new Date().getFullYear();
    const wineRes = await request.post('/api/wines', {
      data: {
        name: 'Badge Test Wine',
        producer: 'Badge Producer',
        vintage: 2015,
        wine_type: 'Red',
        quantity: 1,
        location_id: loc.id,
        drinking_window_start: cy, // Drink Now: window includes this year
        drinking_window_end: cy + 3,
      },
    });
    const wine = await wineRes.json();

    await page.goto(`/wines/${wine.id}`);
    // ReadinessBadge renders "Drink Now" text somewhere on the page
    const content = await page.content();
    expect(content).toMatch(/Drink Now/i);
  });

  test('F6: Dashboard drink_now_wines contains wine with Drink Now window', async ({ request }) => {
    const res = await request.get('/api/dashboard');
    const data = await res.json();
    // The wine created above should appear in drink_now_wines
    const drinkNow = data.drink_now_wines as Array<{ name: string }>;
    const found = drinkNow.find(w => w.name === 'Badge Test Wine');
    expect(found).toBeDefined();
  });
});

test.describe('NFR-004: DATABASE_URL uses hostname db (not localhost)', () => {
  test('docker-compose.yml DATABASE_URL references hostname db not localhost', async () => {
    const { readFileSync } = await import('fs');
    const composeContent = readFileSync('docker-compose.yml', 'utf8');
    expect(composeContent).toMatch(/@db:/);
    expect(composeContent).not.toMatch(/@localhost:/);
  });
});

test.describe('F2: Location delete sets wines to Location Unknown (NFR-009)', () => {
  test('DELETE /api/locations/[id] sets wines.location_id to NULL (non-destructive)', async ({ request }) => {
    // Create location and wine
    const locRes = await request.post('/api/locations', {
      data: { name: `Delete Test Rack ${Date.now()}` },
    });
    expect(locRes.status()).toBe(201);
    const loc = await locRes.json();

    const wineRes = await request.post('/api/wines', {
      data: {
        name: 'Location Unknown Test Wine',
        producer: 'NFR-009 Producer',
        vintage: 2021,
        wine_type: 'White',
        quantity: 1,
        location_id: loc.id,
      },
    });
    expect(wineRes.status()).toBe(201);
    const wine = await wineRes.json();

    // Delete the location
    const delRes = await request.delete(`/api/locations/${loc.id}`);
    expect(delRes.status()).toBe(204);

    // Wine must still exist with location_id = null
    const wineAfter = await request.get(`/api/wines/${wine.id}`);
    expect(wineAfter.status()).toBe(200);
    const data = await wineAfter.json();
    expect(data.wine).toBeDefined();
    expect(data.wine.location_id).toBeNull();
    expect(data.wine.location_name).toBeNull();
  });
});

test.describe('F0: Vintage validation (1900–currentYear+1)', () => {
  test('POST /api/wines with vintage 1899 returns 422 VINTAGE_OUT_OF_RANGE', async ({ request }) => {
    const locRes = await request.post('/api/locations', {
      data: { name: `Vintage Test Rack ${Date.now()}` },
    });
    const loc = await locRes.json();
    const res = await request.post('/api/wines', {
      data: {
        name: 'Bad Vintage Wine',
        producer: 'Test',
        vintage: 1899,
        wine_type: 'Red',
        quantity: 1,
        location_id: loc.id,
      },
    });
    expect(res.status()).toBe(422);
    const data = await res.json();
    expect(data.error).toBe('VINTAGE_OUT_OF_RANGE');
  });

  test('POST /api/wines with vintage = currentYear+2 returns 422 VINTAGE_OUT_OF_RANGE', async ({ request }) => {
    const locRes = await request.post('/api/locations', {
      data: { name: `Vintage Test Rack 2 ${Date.now()}` },
    });
    const loc = await locRes.json();
    const res = await request.post('/api/wines', {
      data: {
        name: 'Future Vintage Wine',
        producer: 'Test',
        vintage: new Date().getFullYear() + 2,
        wine_type: 'Red',
        quantity: 1,
        location_id: loc.id,
      },
    });
    expect(res.status()).toBe(422);
    const data = await res.json();
    expect(data.error).toBe('VINTAGE_OUT_OF_RANGE');
  });
});

test.describe('F4: Rating normalization — five_star × 20 = stored value', () => {
  test('POST /api/wines/[id]/notes with 5-star rating stores as 80 (four stars stored as 80)', async ({ request }) => {
    // Ensure five_star is the active scale
    await request.patch('/api/settings', { data: { rating_scale: 'five_star' } });

    const locRes = await request.post('/api/locations', {
      data: { name: `Rating Test Rack ${Date.now()}` },
    });
    const loc = await locRes.json();
    const wineRes = await request.post('/api/wines', {
      data: { name: 'Rating Norm Wine', producer: 'Test', vintage: 2020, wine_type: 'Red', quantity: 1, location_id: loc.id },
    });
    const wine = await wineRes.json();

    const today = new Date().toISOString().split('T')[0];
    const noteRes = await request.post(`/api/wines/${wine.id}/notes`, {
      data: { tasted_on: today, rating: 4 }, // 4 stars × 20 = 80
    });
    expect(noteRes.status()).toBe(201);
    const note = await noteRes.json();
    expect(note.rating).toBe(80);
  });

  test('PATCH /api/settings switches to hundred_point scale', async ({ request }) => {
    const res = await request.patch('/api/settings', { data: { rating_scale: 'hundred_point' } });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.rating_scale).toBe('hundred_point');

    // Switch back to five_star for clean state
    await request.patch('/api/settings', { data: { rating_scale: 'five_star' } });
  });
});
```

**Implementation notes:**
- The test file uses Playwright's `request` fixture for pure API tests and `page` fixture for browser-based UI tests
- Tests import `fs` dynamically for file system checks (next.config.mjs exists, docker-compose.yml content)
- `test.beforeAll` hooks create prerequisite DB state via API calls; tests are order-independent within a describe block but the beforeAll must complete first
- The docker-compose stack MUST be running before `npx playwright test` is invoked. The CI verification step starts the stack first.
- Some tests depend on each other via shared `let wineId` variables within a describe block — this is intentional for cross-feature flow verification
  </action>
  <verify>
```bash
# 1. Playwright installed
npx playwright --version 2>&1 && echo "PLAYWRIGHT INSTALLED"

# 2. playwright.config.ts exists
ls playwright.config.ts && echo "PLAYWRIGHT CONFIG EXISTS"

# 3. e2e test file exists
ls e2e/integration.spec.ts && echo "E2E TEST FILE EXISTS"

# 4. Test file has key test group markers
grep -n 'NFR-005\|NFR-010\|NFR-001\|NFR-004\|NFR-008\|NFR-009\|NFR-006' e2e/integration.spec.ts && echo "NFR COVERAGE MARKERS OK"

# 5. Cross-feature flow tests present
grep -n 'Consume bottle\|Tasting note creation\|ReadinessBadge' e2e/integration.spec.ts && echo "CROSS-FEATURE FLOWS PRESENT"

# 6. Docker stack up, run the full integration test suite
docker compose up -d --build 2>&1 | tail -5 && echo "DOCKER BUILD STARTED"
sleep 25
docker compose ps | grep 'Up' && echo "SERVICES UP"
curl -sf http://localhost:3000 > /dev/null && echo "APP REACHABLE"
npx playwright test e2e/integration.spec.ts --reporter=list 2>&1 | tail -40 && echo "PLAYWRIGHT PASSED"
docker compose down
```
  </verify>
  <done>
- e2e/integration.spec.ts exists with full test suite covering all NFRs
- playwright.config.ts exists with baseURL: 'http://localhost:3000' and 375px default viewport
- NFR-001 (375px no horizontal scroll): tests for /, /cellar, /wines/new, /locations all pass
- NFR-003 (Docker deployment): docker compose up --build brings both services to Up state within 60s; app reachable at localhost:3000
- NFR-004 (db hostname): docker-compose.yml verified to use @db: not @localhost:
- NFR-005 (no frame-blocking): X-Frame-Options absent from / response headers; no frame-ancestors CSP restriction
- NFR-006 (next.config.mjs): next.config.mjs exists; next.config.ts does NOT exist
- NFR-008 (brand fidelity): Gold #FBCA5C, Black #0A0A0A, Bone #FAFAF7, Montserrat all present in rendered HTML
- NFR-009 (location delete non-destructive): DELETE location → wine.location_id = NULL, wine record survives
- NFR-010 (no dead nav links): /, /cellar, /wines/new, /locations all return HTTP 200
- F0: Wine CRUD E2E — create → GET list → GET detail all verified against real DB
- F1: Consume flow — PATCH quantity delta:-1 → event_id created → GET events confirms Consumed entry
- F2: Location CRUD + Location Unknown state after delete
- F4: Tasting note POST (201) + rating normalization (4 stars = 80 stored) + GET notes
- F5: ReadinessBadge text 'Drink Now' present on /wines/[id] for wine with current-year window
- F6: GET /api/dashboard returns all 8 sections with correct types; dashboard page renders 200
- All Playwright tests pass (0 failing, 0 skipped)
  </done>

  <feature_dependencies>
  Implements: F0–F6 integration verification (all features exercised end-to-end against real PostgreSQL DB via docker-compose stack)
  Depends on: All prior waves (1, 2a, 2b, 3a, 3b) fully implemented
  Enables: None (this is the final wave)
  </feature_dependencies>
</task>

<task type="auto">
  <name>Task 2: Docker cold-start validation + NFR sign-off execution</name>
  <files>
    e2e/integration.spec.ts
  </files>
  <action>
Execute the full integration validation against the live docker stack. This task verifies the system works end-to-end before declaring the build complete.

**Step 1: Verify no next.config.ts exists (hard requirement — NFR-006)**
```bash
if [ -f next.config.ts ]; then
  echo "ERROR: next.config.ts must NOT exist. Delete it immediately — Next.js 14 will hard-error."
  exit 1
fi
ls next.config.mjs && echo "NFR-006 OK: next.config.mjs present"
```

**Step 2: Docker cold-start validation (NFR-003)**
```bash
docker compose down -v 2>/dev/null; true
docker compose up -d --build
sleep 30
docker compose ps
# Both db and app must show 'Up' or 'running'
docker compose ps | grep -E 'Up|running' | wc -l | xargs -I{} test {} -ge 2 && echo "NFR-003 BOTH SERVICES UP"
```

**Step 3: App reachability + frame-blocking header check (NFR-005)**
```bash
# App must respond on port 3000
curl -sf http://localhost:3000 > /dev/null && echo "APP REACHABLE AT localhost:3000"

# X-Frame-Options must NOT be in response headers
HEADERS=$(curl -sI http://localhost:3000)
echo "$HEADERS" | grep -iv 'X-Frame-Options' && echo "NFR-005 OK: No X-Frame-Options header"
echo "$HEADERS" | grep -iv 'frame-ancestors' && echo "NFR-005 OK: No frame-ancestors CSP"
```

**Step 4: Route smoke test — no dead nav links (NFR-010)**
```bash
for ROUTE in "/" "/cellar" "/wines/new" "/locations"; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000${ROUTE}")
  if [ "$STATUS" = "200" ]; then
    echo "NFR-010 OK: ${ROUTE} → 200"
  else
    echo "NFR-010 FAIL: ${ROUTE} → ${STATUS}"
    exit 1
  fi
done
```

**Step 5: API integration — CRUD flows (F0, F1, F2)**
```bash
# Create a location
LOC_RESPONSE=$(curl -s -X POST http://localhost:3000/api/locations \
  -H 'Content-Type: application/json' \
  -d '{"name":"NFR-Check Rack"}')
echo "$LOC_RESPONSE" | grep -q '"id"' && echo "F2 OK: Location created"
LOC_ID=$(echo "$LOC_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')

# Create a wine in that location
WINE_RESPONSE=$(curl -s -X POST http://localhost:3000/api/wines \
  -H 'Content-Type: application/json' \
  -d "{\"name\":\"NFR Check Wine\",\"producer\":\"Test\",\"vintage\":2020,\"wine_type\":\"Red\",\"quantity\":2,\"location_id\":${LOC_ID}}")
echo "$WINE_RESPONSE" | grep -q '"id"' && echo "F0 OK: Wine created"
WINE_ID=$(echo "$WINE_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')

# Decrement bottle (consume event) — F1
CONSUME_RESPONSE=$(curl -s -X PATCH "http://localhost:3000/api/wines/${WINE_ID}/quantity" \
  -H 'Content-Type: application/json' \
  -d '{"delta":-1,"event_type":"Consumed","note":"NFR validation consume"}')
echo "$CONSUME_RESPONSE" | grep -q '"event_id"' && echo "F1 OK: Consume event created"
echo "$CONSUME_RESPONSE" | grep -q '"quantity":1' && echo "F1 OK: Quantity decremented to 1"

# Check event log
EVENTS_RESPONSE=$(curl -s "http://localhost:3000/api/wines/${WINE_ID}/events")
echo "$EVENTS_RESPONSE" | grep -q '"Consumed"' && echo "F1 OK: Consumed event in event log"

# Dashboard stats (F6)
DASH_RESPONSE=$(curl -s http://localhost:3000/api/dashboard)
echo "$DASH_RESPONSE" | grep -q '"total_bottles"' && echo "F6 OK: Dashboard returns total_bottles"
echo "$DASH_RESPONSE" | grep -q '"drink_now_wines"' && echo "F6 OK: Dashboard returns drink_now_wines"
echo "$DASH_RESPONSE" | grep -q '"recently_consumed"' && echo "F6 OK: Dashboard returns recently_consumed"

echo "ALL NFR MANUAL CHECKS PASSED"
```

**Step 6: Run Playwright integration test suite**
```bash
npx playwright test e2e/integration.spec.ts --reporter=list 2>&1 | tail -50
```

**Step 7: Clean up**
```bash
docker compose down
echo "DOCKER STACK STOPPED"
```

If any test fails:
- **next.config.ts exists**: delete it immediately (`rm next.config.ts`)
- **Services not Up**: check `docker compose logs app` for build or migration errors
- **X-Frame-Options present**: check `next.config.mjs` headers() — ensure it does NOT include `X-Frame-Options`
- **Route 404**: check NavBar.tsx links and Next.js App Router page files exist at correct paths
- **API 500**: check `docker compose logs app` for DB connection errors; verify DATABASE_URL uses `@db:` not `@localhost:`
- **Brand checks fail**: verify app/globals.css or component inline styles use exact hex values `#FBCA5C`, `#0A0A0A`, `#FAFAF7`
- **Playwright test fails**: debug individual test with `npx playwright test e2e/integration.spec.ts --grep "test name" --headed`
  </action>
  <verify>
```bash
# Final integration sign-off — all checks in sequence
echo "=== WAVE 4 INTEGRATION SIGN-OFF ==="

# 1. NFR-006: next.config.mjs only
! ls next.config.ts 2>/dev/null && echo "NFR-006 PASS: no next.config.ts" || echo "NFR-006 FAIL"
ls next.config.mjs && echo "NFR-006 PASS: next.config.mjs exists" || echo "NFR-006 FAIL"

# 2. NFR-003: docker stack cold-start
docker compose up -d --build && sleep 25
docker compose ps | grep -c 'Up\|running' | xargs -I{} sh -c '[ {} -ge 2 ] && echo "NFR-003 PASS: 2 services Up" || echo "NFR-003 FAIL"'

# 3. NFR-005: frame compat
curl -sI http://localhost:3000 | grep -iv 'X-Frame-Options' > /dev/null && echo "NFR-005 PASS: no X-Frame-Options" || echo "NFR-005 FAIL"

# 4. NFR-010: route smoke
for R in "/" "/cellar" "/wines/new" "/locations"; do
  S=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000${R}")
  [ "$S" = "200" ] && echo "NFR-010 PASS: $R → 200" || echo "NFR-010 FAIL: $R → $S"
done

# 5. Playwright full suite
npx playwright test e2e/integration.spec.ts --reporter=list 2>&1 | tail -30 && echo "PLAYWRIGHT PASSED"

# 6. Teardown
docker compose down && echo "TEARDOWN COMPLETE"
```
  </verify>
  <done>
- docker compose up --build cold-start: both db (postgres:16) and app (Next.js) services reach Up state within 60 seconds
- App reachable at http://localhost:3000 after cold start
- HTTP response from / does NOT include X-Frame-Options header (NFR-005 ✓)
- next.config.mjs exists; next.config.ts does NOT exist (NFR-006 ✓)
- All primary nav routes return HTTP 200 (no dead links): /, /cellar, /wines/new, /locations (NFR-010 ✓)
- DATABASE_URL in docker-compose.yml uses @db: not @localhost: (NFR-004 ✓)
- F0: POST /api/wines → 201; GET /api/wines includes location_name; GET /api/wines/[id] → {wine, tasting_notes, bottle_events}
- F1: PATCH /api/wines/[id]/quantity delta:-1 → quantity decremented + bottle_events row created; GET /api/wines/[id]/events shows Consumed entry
- F2: POST /api/locations → 201; DELETE /api/locations/[id] → 204; wine.location_id = NULL after delete (NFR-009 ✓)
- F4: POST /api/wines/[id]/notes → 201; rating 4 (five_star) stored as 80; GET /api/wines/[id]/notes returns note
- F5: ReadinessBadge text 'Drink Now' present on /wines/[id] detail page for wine with current-year drinking window
- F6: GET /api/dashboard returns all 8 keys with correct types; recently_consumed reflects consume event
- NFR-001 (375px mobile): no horizontal scroll on /, /cellar, /wines/new, /locations
- NFR-008 (brand fidelity): Gold #FBCA5C, Black #0A0A0A, Bone #FAFAF7, Montserrat all present in rendered HTML
- All Playwright tests in e2e/integration.spec.ts pass (0 failing, 0 skipped)
- docker compose down completes cleanly
  </done>

  <feature_dependencies>
  Implements: F0–F6 end-to-end NFR sign-off against live docker-compose stack
  Depends on: All prior waves fully implemented and e2e/integration.spec.ts from Task 1
  Enables: None
  </feature_dependencies>
</task>

</tasks>

<verification>
```bash
# Complete wave 4 integration verification
echo "=== SIMPLEWINEAPP WAVE 4 INTEGRATION VERIFICATION ==="

# Config file check
! ls next.config.ts 2>/dev/null && echo "✓ NFR-006: next.config.mjs only (no .ts)" || echo "✗ NFR-006 FAIL"

# e2e test file exists
ls e2e/integration.spec.ts && echo "✓ E2E test suite exists" || echo "✗ E2E test suite MISSING"

# Docker cold-start
docker compose down -v 2>/dev/null; true
docker compose up -d --build 2>&1 | tail -3
sleep 30
docker compose ps

# App reachability
curl -sf http://localhost:3000 > /dev/null && echo "✓ NFR-003: App reachable at localhost:3000" || echo "✗ NFR-003 FAIL"

# Frame compat
curl -sI http://localhost:3000 | grep -iv 'x-frame-options' > /dev/null && echo "✓ NFR-005: No X-Frame-Options" || echo "✗ NFR-005 FAIL"

# Route smoke
for R in "/" "/cellar" "/wines/new" "/locations"; do
  S=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000${R}")
  [ "$S" = "200" ] && echo "✓ NFR-010: $R → 200" || echo "✗ NFR-010 FAIL: $R → $S"
done

# Playwright suite
npx playwright test e2e/integration.spec.ts --reporter=list 2>&1 | tail -20 && echo "✓ All Playwright tests passed"

# Cleanup
docker compose down
echo "=== VERIFICATION COMPLETE ==="
```
</verification>

<success_criteria>
- `docker compose up --build` cold-start: both services reach Up state within 60 seconds (NFR-003)
- App reachable at http://localhost:3000 after cold start
- HTTP response headers from / do NOT include X-Frame-Options or frame-ancestors CSP (NFR-005)
- next.config.mjs exists; next.config.ts does NOT exist (NFR-006)
- All primary routes return HTTP 200: /, /cellar, /wines/new, /locations (NFR-010)
- DATABASE_URL in docker-compose.yml uses `@db:` not `@localhost:` (NFR-004)
- Full E2E CRUD flow verified: create location → create wine → decrement → event logged → dashboard stats updated
- Tasting note POST 201; rating normalized correctly (4 stars → stored 80); note retrievable via GET
- ReadinessBadge shows correct state on /wines/[id] for wine with current-year drinking window
- Dashboard /api/dashboard returns all 8 data sections with correct shape and live DB values
- Location delete sets wine.location_id = NULL without destroying wine record (NFR-009)
- No horizontal scroll at 375px on any primary route (NFR-001)
- TechSur brand tokens present in rendered HTML: Gold #FBCA5C, Black #0A0A0A, Bone #FAFAF7, Montserrat (NFR-008)
- All Playwright tests in e2e/integration.spec.ts pass: 0 failing, 0 skipped
</success_criteria>

<output>
After completion, create `.planning/express/implement-the-full-simplewineapp-system-/04-SUMMARY.md` with:
- NFR sign-off status for each of NFR-001 through NFR-010 (PASS / FAIL with notes)
- Playwright test results (N passed, M failed)
- Any issues found during integration (flag prominently with fix applied)
- Docker cold-start timing (actual seconds to reach localhost:3000)
- Cross-feature flow verification results
</output>
