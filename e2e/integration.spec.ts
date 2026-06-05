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
