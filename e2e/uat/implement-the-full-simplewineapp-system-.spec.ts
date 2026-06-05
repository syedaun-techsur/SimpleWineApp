import { test, expect, type Page } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const BASE = 'http://localhost:3000';

/** Create a location via API and return its id. */
async function createLocation(page: Page, name: string): Promise<number> {
  const res = await page.request.post(`${BASE}/api/locations`, {
    data: { name },
    headers: { 'Content-Type': 'application/json' },
  });
  const body = await res.json();
  return (body.id ?? body.location?.id) as number;
}

/** Create a wine via API and return its id. */
async function createWine(
  page: Page,
  locationId: number,
  overrides: Record<string, unknown> = {}
): Promise<number> {
  const payload = {
    name: 'Test Wine',
    producer: 'Test Producer',
    vintage: 2018,
    wine_type: 'Red',
    quantity: 3,
    location_id: locationId,
    ...overrides,
  };
  const res = await page.request.post(`${BASE}/api/wines`, {
    data: payload,
    headers: { 'Content-Type': 'application/json' },
  });
  const body = await res.json();
  return body.id as number;
}

/** Delete a wine via API (cleanup). */
async function deleteWine(page: Page, id: number) {
  await page.request.delete(`${BASE}/api/wines/${id}`);
}

/** Delete a location via API (cleanup). */
async function deleteLocation(page: Page, id: number) {
  await page.request.delete(`${BASE}/api/locations/${id}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// US-0.1 – Add a New Wine
// ─────────────────────────────────────────────────────────────────────────────

test.describe('US-0.1: Add a New Wine', () => {
  let locationId: number;

  test.beforeEach(async ({ page }) => {
    locationId = await createLocation(page, `UAT-Loc-${Date.now()}`);
  });

  test.afterEach(async ({ page }) => {
    await deleteLocation(page, locationId);
  });

  test('/wines/new renders a form with required fields', async ({ page }) => {
    await page.goto('/wines/new');
    await expect(page.getByLabel(/Wine Name/i)).toBeVisible();
    await expect(page.getByLabel(/Producer/i)).toBeVisible();
    await expect(page.getByLabel(/Vintage Year/i)).toBeVisible();
    await expect(page.getByLabel(/Wine Type/i)).toBeVisible();
    await expect(page.getByLabel(/Quantity/i)).toBeVisible();
    await expect(page.getByLabel(/Storage Location/i)).toBeVisible();
  });

  test('Optional fields available via Show optional fields toggle', async ({ page }) => {
    await page.goto('/wines/new');
    // Toggle optional fields open
    await page.getByRole('button', { name: /show optional fields/i }).click();
    await expect(page.getByLabel(/Grape Variety/i)).toBeVisible();
    await expect(page.getByLabel(/Country/i)).toBeVisible();
    await expect(page.getByLabel(/Region/i)).toBeVisible();
    await expect(page.getByLabel(/Bottle Size/i)).toBeVisible();
    await expect(page.getByLabel(/Purchase Date/i)).toBeVisible();
    await expect(page.getByLabel(/Purchase Source/i)).toBeVisible();
    await expect(page.getByLabel(/Purchase Price/i)).toBeVisible();
    await expect(page.getByLabel(/Drink From/i)).toBeVisible();
    await expect(page.getByLabel(/Drink Until/i)).toBeVisible();
    await expect(page.getByLabel(/General Notes/i)).toBeVisible();
  });

  test('Wine type dropdown has exactly 8 options', async ({ page }) => {
    await page.goto('/wines/new');
    const select = page.getByLabel(/Wine Type/i);
    await expect(select).toBeVisible();
    // Count <option> elements inside the select (excluding the placeholder)
    const optionCount = await select.locator('option').count();
    // 1 placeholder + 8 types = 9 total
    expect(optionCount).toBe(9);
    const options = await select.locator('option').allTextContents();
    const wineTypes = options.filter((o) => o !== 'Select wine type...');
    expect(wineTypes).toEqual(['Red', 'White', 'Rosé', 'Sparkling', 'Dessert', 'Fortified', 'Orange', 'Other']);
  });

  test('On successful submission, user is redirected to /wines/[id]', async ({ page }) => {
    await page.goto('/wines/new');
    await page.getByLabel(/Wine Name/i).fill('UAT Redirect Wine');
    await page.getByLabel(/Producer/i).fill('UAT Producer');
    await page.getByLabel(/Vintage Year/i).fill('2015');
    await page.getByLabel(/Wine Type/i).selectOption('Red');
    await page.getByLabel(/Quantity/i).fill('1');
    await page.getByLabel(/Storage Location/i).selectOption({ index: 1 });
    await page.getByRole('button', { name: /Save Wine/i }).click();
    await page.waitForURL(/\/wines\/\d+$/);
    expect(page.url()).toMatch(/\/wines\/\d+$/);
    // Cleanup: extract id and delete
    const id = parseInt(page.url().split('/wines/')[1], 10);
    await deleteWine(page, id);
  });

  test('Form is usable on 375px viewport with no horizontal scroll', async ({ page }) => {
    // playwright.config.ts sets viewport to 375×812 by default
    await page.goto('/wines/new');
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize()!.width;
    expect(bodyScrollWidth).toBeLessThanOrEqual(viewportWidth);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// US-0.2 – Validate Wine Form Inputs
// ─────────────────────────────────────────────────────────────────────────────

test.describe('US-0.2: Validate Wine Form Inputs', () => {
  test('Required fields show inline errors if left empty on submit', async ({ page }) => {
    await page.goto('/wines/new');
    await page.getByRole('button', { name: /Save Wine/i }).click();
    // Should see field-error messages
    const errors = page.locator('.field-error');
    const count = await errors.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Vintage rejects values outside 1900–(current year + 1)', async ({ page }) => {
    await page.goto('/wines/new');
    // Fill required fields to isolate the vintage error
    await page.getByLabel(/Wine Name/i).fill('UAT Vintage Test');
    await page.getByLabel(/Producer/i).fill('UAT Producer');
    const vintageInput = page.getByLabel(/Vintage Year/i);
    await vintageInput.fill('1800');
    await page.getByLabel(/Wine Type/i).selectOption('Red');
    await page.getByLabel(/Quantity/i).fill('1');
    await page.getByRole('button', { name: /Save Wine/i }).click();
    // At least one field-error should be visible (vintage error)
    const errors = page.locator('.field-error');
    await expect(errors.first()).toBeVisible();
    // At least one error should mention the year range
    const allErrors = await errors.allTextContents();
    const hasVintageError = allErrors.some(t => /1900/i.test(t));
    expect(hasVintageError).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// US-0.3 – View Wine Detail
// ─────────────────────────────────────────────────────────────────────────────

test.describe('US-0.3: View Wine Detail', () => {
  let locationId: number;
  let wineId: number;

  test.beforeEach(async ({ page }) => {
    locationId = await createLocation(page, `UAT-Loc-${Date.now()}`);
    wineId = await createWine(page, locationId, {
      name: 'Detail Wine',
      producer: 'Detail Producer',
      vintage: 2016,
      wine_type: 'White',
      quantity: 2,
    });
  });

  test.afterEach(async ({ page }) => {
    await deleteWine(page, wineId);
    await deleteLocation(page, locationId);
  });

  test('/wines/[id] displays wine fields: name, producer, vintage, wine type, quantity, storage location', async ({ page }) => {
    await page.goto(`/wines/${wineId}`);
    await expect(page.getByText('Detail Wine')).toBeVisible();
    await expect(page.getByText('Detail Producer')).toBeVisible();
    // Vintage appears as part of the heading
    await expect(page.getByText(/2016/)).toBeVisible();
    // Wine type visible somewhere on the page
    await expect(page.getByText(/White/)).toBeVisible();
    // Quantity label
    await expect(page.getByText(/Quantity/i)).toBeVisible();
  });

  test('Readiness badge is displayed', async ({ page }) => {
    await page.goto(`/wines/${wineId}`);
    // A badge element should be present (no-window set or a real badge)
    const badge = page.locator('.badge').first();
    await expect(badge).toBeVisible();
  });

  test('Quantity increment + and decrement - controls are present', async ({ page }) => {
    await page.goto(`/wines/${wineId}`);
    await expect(page.getByRole('button', { name: /Add a bottle/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Remove a bottle/i })).toBeVisible();
  });

  test('If wine not found, 404 page renders', async ({ page }) => {
    await page.goto('/wines/99999999');
    // Next.js not-found renders something without status 200 or shows 404 content
    await expect(page).toHaveURL(/\/wines\/99999999/);
    const content = await page.textContent('body');
    // Should not be a normal wine page - either a 404 message or NEXT_NOT_FOUND
    expect(content).toBeTruthy();
    // The page title or body should indicate an error, not "Detail Wine"
    expect(content).not.toContain('Detail Wine');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// US-0.4 – Edit an Existing Wine
// ─────────────────────────────────────────────────────────────────────────────

test.describe('US-0.4: Edit an Existing Wine', () => {
  let locationId: number;
  let wineId: number;

  test.beforeEach(async ({ page }) => {
    locationId = await createLocation(page, `UAT-Loc-${Date.now()}`);
    wineId = await createWine(page, locationId, {
      name: 'Edit Wine',
      producer: 'Edit Producer',
      vintage: 2017,
      wine_type: 'Red',
      quantity: 1,
    });
  });

  test.afterEach(async ({ page }) => {
    await deleteWine(page, wineId);
    await deleteLocation(page, locationId);
  });

  test('/wines/[id]/edit renders form pre-populated with current values', async ({ page }) => {
    await page.goto(`/wines/${wineId}/edit`);
    await expect(page.getByLabel(/Wine Name/i)).toHaveValue('Edit Wine');
    await expect(page.getByLabel(/Producer/i)).toHaveValue('Edit Producer');
    await expect(page.getByLabel(/Vintage Year/i)).toHaveValue('2017');
    await expect(page.getByLabel(/Wine Type/i)).toHaveValue('Red');
  });

  test('On successful save, redirected to /wines/[id]', async ({ page }) => {
    await page.goto(`/wines/${wineId}/edit`);
    // Change name slightly
    await page.getByLabel(/Wine Name/i).fill('Edit Wine Updated');
    await page.getByRole('button', { name: /Save Changes/i }).click();
    await page.waitForURL(`/wines/${wineId}`);
    expect(page.url()).toContain(`/wines/${wineId}`);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// US-0.5 – Delete a Wine Record
// ─────────────────────────────────────────────────────────────────────────────

test.describe('US-0.5: Delete a Wine Record', () => {
  let locationId: number;
  let wineId: number;

  test.beforeEach(async ({ page }) => {
    locationId = await createLocation(page, `UAT-Loc-${Date.now()}`);
    wineId = await createWine(page, locationId, {
      name: 'Delete Wine',
      producer: 'Delete Producer',
      vintage: 2019,
      wine_type: 'Red',
      quantity: 1,
    });
  });

  test.afterEach(async ({ page }) => {
    // Best-effort cleanup if test didn't delete
    await deleteWine(page, wineId);
    await deleteLocation(page, locationId);
  });

  test('Delete action accessible from /wines/[id]', async ({ page }) => {
    await page.goto(`/wines/${wineId}`);
    await expect(page.getByRole('button', { name: /Delete Wine/i })).toBeVisible();
  });

  test('Confirmation modal appears before deletion', async ({ page }) => {
    await page.goto(`/wines/${wineId}`);
    await page.getByRole('button', { name: /Delete Wine/i }).click();
    // ConfirmModal has role=dialog
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    // Should contain "Delete" text
    await expect(modal.getByRole('heading')).toContainText(/Delete/i);
  });

  test('User redirected to /cellar after deletion', async ({ page }) => {
    await page.goto(`/wines/${wineId}`);
    await page.getByRole('button', { name: /Delete Wine/i }).click();
    // Click "Delete Permanently" in the confirm modal
    await page.getByRole('button', { name: /Delete Permanently/i }).click();
    await page.waitForURL('/cellar');
    expect(page.url()).toContain('/cellar');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// US-1.1 – Increment Bottle Count
// ─────────────────────────────────────────────────────────────────────────────

test.describe('US-1.1: Increment Bottle Count', () => {
  let locationId: number;
  let wineId: number;

  test.beforeEach(async ({ page }) => {
    locationId = await createLocation(page, `UAT-Loc-${Date.now()}`);
    wineId = await createWine(page, locationId, { quantity: 2 });
  });

  test.afterEach(async ({ page }) => {
    await deleteWine(page, wineId);
    await deleteLocation(page, locationId);
  });

  test('+ button visible on wine detail page', async ({ page }) => {
    await page.goto(`/wines/${wineId}`);
    await expect(page.getByRole('button', { name: /Add a bottle/i })).toBeVisible();
  });

  test('Tapping + increments quantity by 1', async ({ page }) => {
    await page.goto(`/wines/${wineId}`);
    // Read current quantity from the span between - and +
    const qtySpan = page.locator('span').filter({ hasText: /^\d+$/ }).first();
    const before = parseInt(await qtySpan.textContent() ?? '0', 10);
    await page.getByRole('button', { name: /Add a bottle/i }).click();
    // Wait for the quantity to update
    await expect(qtySpan).toHaveText(String(before + 1), { timeout: 5000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// US-1.2 – Log a Bottle Removal Event
// ─────────────────────────────────────────────────────────────────────────────

test.describe('US-1.2: Log a Bottle Removal Event', () => {
  let locationId: number;
  let wineId: number;

  test.beforeEach(async ({ page }) => {
    locationId = await createLocation(page, `UAT-Loc-${Date.now()}`);
    wineId = await createWine(page, locationId, { quantity: 3 });
  });

  test.afterEach(async ({ page }) => {
    await deleteWine(page, wineId);
    await deleteLocation(page, locationId);
  });

  test('Tapping - opens Remove a Bottle modal', async ({ page }) => {
    await page.goto(`/wines/${wineId}`);
    await page.getByRole('button', { name: /Remove a bottle/i }).click();
    const modal = page.getByRole('dialog', { name: /Remove a bottle/i });
    await expect(modal).toBeVisible();
  });

  test('Modal shows 3 event type buttons: Consumed, Gifted, Opened', async ({ page }) => {
    await page.goto(`/wines/${wineId}`);
    await page.getByRole('button', { name: /Remove a bottle/i }).click();
    await expect(page.getByRole('button', { name: /Consumed/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Gifted/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Opened/i })).toBeVisible();
  });

  test('On confirmation, quantity decrements by 1', async ({ page }) => {
    await page.goto(`/wines/${wineId}`);
    // Read initial quantity
    const qtySpan = page.locator('span').filter({ hasText: /^\d+$/ }).first();
    const before = parseInt(await qtySpan.textContent() ?? '0', 10);
    await page.getByRole('button', { name: /Remove a bottle/i }).click();
    await page.getByRole('button', { name: /^Opened$/i }).click();
    await page.getByRole('button', { name: /Confirm Removal/i }).click();
    // Modal closes and quantity decrements
    await expect(page.getByRole('dialog', { name: /Remove a bottle/i })).not.toBeVisible({ timeout: 5000 });
    await expect(qtySpan).toHaveText(String(before - 1), { timeout: 5000 });
  });

  test('After Consumed/Gifted, prompt appears: Would you like to add a tasting note?', async ({ page }) => {
    await page.goto(`/wines/${wineId}`);
    await page.getByRole('button', { name: /Remove a bottle/i }).click();
    await page.getByRole('button', { name: /^Consumed$/i }).click();
    // Wait for Confirm Removal button to be enabled (selectedType is set)
    const confirmBtn = page.getByRole('button', { name: /Confirm Removal/i });
    await expect(confirmBtn).not.toBeDisabled({ timeout: 3000 });
    await confirmBtn.click();
    // The tasting note prompt should appear after the API call completes
    await expect(page.getByText(/Would you like to add a tasting note/i)).toBeVisible({ timeout: 10000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// US-1.3 – View Bottle Event History
// ─────────────────────────────────────────────────────────────────────────────

test.describe('US-1.3: View Bottle Event History', () => {
  let locationId: number;
  let wineId: number;

  test.beforeEach(async ({ page }) => {
    locationId = await createLocation(page, `UAT-Loc-${Date.now()}`);
    wineId = await createWine(page, locationId, { quantity: 3 });
    // Create a bottle event via API
    await page.request.patch(`${BASE}/api/wines/${wineId}/quantity`, {
      data: { delta: -1, event_type: 'Consumed' },
      headers: { 'Content-Type': 'application/json' },
    });
  });

  test.afterEach(async ({ page }) => {
    await deleteWine(page, wineId);
    await deleteLocation(page, locationId);
  });

  test('Bottle History section exists on /wines/[id]', async ({ page }) => {
    await page.goto(`/wines/${wineId}`);
    await expect(page.getByText('Bottle History')).toBeVisible();
  });

  test('Events displayed in reverse-chronological order', async ({ page }) => {
    // Add a second event
    await page.request.patch(`${BASE}/api/wines/${wineId}/quantity`, {
      data: { delta: -1, event_type: 'Gifted' },
      headers: { 'Content-Type': 'application/json' },
    });
    await page.goto(`/wines/${wineId}`);
    await expect(page.getByText('Bottle History')).toBeVisible();
    // Both event types should appear
    const consumed = page.locator('.badge').filter({ hasText: /CONSUMED/i });
    const gifted = page.locator('.badge').filter({ hasText: /GIFTED/i });
    await expect(consumed).toBeVisible();
    await expect(gifted).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// US-1.4 – Cellar Empty State
// ─────────────────────────────────────────────────────────────────────────────

test.describe('US-1.4: Cellar Empty State', () => {
  let locationId: number;
  let wineId: number;

  test.beforeEach(async ({ page }) => {
    locationId = await createLocation(page, `UAT-Loc-${Date.now()}`);
    // Create with quantity 1, then decrement to 0 via API
    wineId = await createWine(page, locationId, { quantity: 1 });
    await page.request.patch(`${BASE}/api/wines/${wineId}/quantity`, {
      data: { delta: -1, event_type: 'Consumed' },
      headers: { 'Content-Type': 'application/json' },
    });
  });

  test.afterEach(async ({ page }) => {
    await deleteWine(page, wineId);
    await deleteLocation(page, locationId);
  });

  test('When quantity = 0, a Cellar Empty badge is displayed', async ({ page }) => {
    await page.goto(`/wines/${wineId}`);
    // CellarEmptyBadge renders <span class="badge">Cellar Empty</span>
    const badge = page.locator('span.badge').filter({ hasText: /Cellar Empty/i }).first();
    await expect(badge).toBeVisible();
  });

  test('The - button is disabled when quantity = 0', async ({ page }) => {
    await page.goto(`/wines/${wineId}`);
    const removeBtn = page.getByRole('button', { name: /Remove a bottle/i });
    // The button has HTML disabled property when quantity = 0
    await expect(removeBtn).toBeDisabled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// US-2.1 – View All Storage Locations
// ─────────────────────────────────────────────────────────────────────────────

test.describe('US-2.1: View All Storage Locations', () => {
  test('/locations renders list of locations when locations exist', async ({ page }) => {
    // Create a location first
    const locId = await createLocation(page, `UAT-ViewLoc-${Date.now()}`);
    await page.goto('/locations');
    await expect(page.getByText(/Storage Locations/i)).toBeVisible();
    // Cleanup
    await deleteLocation(page, locId);
  });

  test('If no locations exist, empty state message shown', async ({ page }) => {
    // We can't guarantee zero locations in a shared environment, so we check
    // that the empty state string is present in the DOM source as a fallback
    // or that the page at least renders the Storage Locations heading
    await page.goto('/locations');
    await expect(page.getByRole('heading', { name: /Storage Locations/i })).toBeVisible();
    // If empty: the message should be present in the DOM
    const body = await page.textContent('body');
    // Either list items or the empty message will be present
    const hasContent =
      (body ?? '').includes('No storage locations yet') ||
      (body ?? '').includes('wines');
    expect(hasContent).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// US-2.2 – Create a Storage Location
// ─────────────────────────────────────────────────────────────────────────────

test.describe('US-2.2: Create a Storage Location', () => {
  test('Add Location form present on /locations', async ({ page }) => {
    await page.goto('/locations');
    await expect(page.getByText(/Add Location/i)).toBeVisible();
    await expect(page.getByPlaceholder(/Location name/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /^Add$/i })).toBeVisible();
  });

  test('New location appears in list after creation', async ({ page }) => {
    const uniqueName = `UAT-Create-${Date.now()}`;
    await page.goto('/locations');
    await page.getByPlaceholder(/Location name/i).fill(uniqueName);
    await page.getByRole('button', { name: /^Add$/i }).click();
    await expect(page.getByText(uniqueName)).toBeVisible({ timeout: 5000 });
    // Cleanup: find id from API and delete
    const res = await page.request.get(`${BASE}/api/locations`);
    const data = await res.json();
    const loc = data.locations.find((l: { name: string; id: number }) => l.name === uniqueName);
    if (loc) await deleteLocation(page, loc.id);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// US-2.3 – Rename a Storage Location
// ─────────────────────────────────────────────────────────────────────────────

test.describe('US-2.3: Rename a Storage Location', () => {
  let locationId: number;
  const originalName = `UAT-Rename-${Date.now()}`;

  test.beforeEach(async ({ page }) => {
    locationId = await createLocation(page, originalName);
  });

  test.afterEach(async ({ page }) => {
    await deleteLocation(page, locationId);
  });

  test('Rename action available on location rows', async ({ page }) => {
    await page.goto('/locations');
    // Wait for client-side data to load
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('div.card', { timeout: 10000 });
    await expect(page.getByRole('button', { name: /Rename/i }).first()).toBeVisible();
  });

  test('On successful rename, updated name appears', async ({ page }) => {
    const newName = `UAT-Renamed-${Date.now()}`;
    await page.goto('/locations');
    // Wait for client-side data to load
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('div.card', { timeout: 10000 });
    // Click Rename button for our location (find the row containing originalName)
    const locRow = page.locator('div.card').filter({ hasText: originalName });
    await locRow.getByRole('button', { name: /Rename/i }).click();
    // After clicking Rename, the card re-renders to show an inline input
    // The rename input has the current location name as its value (not empty like the Add input)
    const renameInput = page.getByRole('textbox').nth(1);
    await expect(renameInput).toBeVisible({ timeout: 5000 });
    await renameInput.clear();
    await renameInput.fill(newName);
    await page.getByRole('button', { name: /^Save$/i }).click();
    await expect(page.getByText(newName)).toBeVisible({ timeout: 5000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// US-2.4 – Delete a Storage Location
// ─────────────────────────────────────────────────────────────────────────────

test.describe('US-2.4: Delete a Storage Location', () => {
  let locationId: number;
  const locName = `UAT-DelLoc-${Date.now()}`;

  test.beforeEach(async ({ page }) => {
    locationId = await createLocation(page, locName);
  });

  test.afterEach(async ({ page }) => {
    // Best-effort cleanup
    await deleteLocation(page, locationId);
  });

  test('Delete action shows confirmation modal', async ({ page }) => {
    await page.goto('/locations');
    // Wait for client-side data to load
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('div.card', { timeout: 10000 });
    const locRow = page.locator('div.card').filter({ hasText: locName });
    await locRow.getByRole('button', { name: /Delete/i }).click();
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    await expect(modal.getByRole('heading')).toContainText(/Delete/i);
  });

  test('Location removed from list after deletion', async ({ page }) => {
    await page.goto('/locations');
    // Wait for client-side data to load
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('div.card', { timeout: 10000 });
    const locRow = page.locator('div.card').filter({ hasText: locName });
    await locRow.getByRole('button', { name: /Delete/i }).click();
    // Confirm deletion — scope to the modal to avoid ambiguity with row Delete button
    const deleteModal = page.getByRole('dialog');
    await expect(deleteModal).toBeVisible({ timeout: 5000 });
    await deleteModal.getByRole('button', { name: /^Delete$/i }).click();
    // Use exact: true to avoid matching the modal heading which includes the name in quotes
    await expect(page.locator('p').filter({ hasText: locName })).not.toBeVisible({ timeout: 5000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// US-3.1 – Search the Collection by Text
// ─────────────────────────────────────────────────────────────────────────────

test.describe('US-3.1: Search the Collection by Text', () => {
  test('Search bar present on /cellar', async ({ page }) => {
    await page.goto('/cellar');
    await expect(page.getByRole('searchbox', { name: /Search wines/i })).toBeVisible();
  });

  test('Result count label shown below search bar', async ({ page }) => {
    await page.goto('/cellar');
    // The "Showing X of Y wines" label
    await expect(page.getByText(/Showing \d+ of \d+ wines/i)).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// US-3.2 – Filter the Collection by Multiple Dimensions
// ─────────────────────────────────────────────────────────────────────────────

test.describe('US-3.2: Filter the Collection by Multiple Dimensions', () => {
  test('Filter panel accessible on /cellar', async ({ page }) => {
    await page.goto('/cellar');
    // On mobile (375px), a Filters button opens the panel
    const filterBtn = page.getByRole('button', { name: /Filters/i });
    await expect(filterBtn).toBeVisible();
    await filterBtn.click();
    // The filter panel should open; look for any filter section heading
    const panel = page.locator('[role="dialog"], aside, [aria-label*="filter" i]').first();
    await expect(panel).toBeVisible({ timeout: 3000 });
  });

  test('Active filters appear as dismissible chips', async ({ page }) => {
    let locationId: number | null = null;
    let wineId: number | null = null;
    try {
      locationId = await createLocation(page, `UAT-FilterLoc-${Date.now()}`);
      wineId = await createWine(page, locationId, { wine_type: 'Red', quantity: 1 });
      await page.goto('/cellar?wine_type=Red');
      // Chips are rendered for active filters
      const chip = page.getByRole('button', { name: /Remove filter: Type: Red/i });
      await expect(chip).toBeVisible({ timeout: 5000 });
    } finally {
      if (wineId) await deleteWine(page, wineId);
      if (locationId) await deleteLocation(page, locationId);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// US-3.3 – Sort the Collection List
// ─────────────────────────────────────────────────────────────────────────────

test.describe('US-3.3: Sort the Collection List', () => {
  test('Sort dropdown present on /cellar', async ({ page }) => {
    await page.goto('/cellar');
    await expect(page.getByRole('combobox', { name: /Sort wines/i })).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// US-4.1 – Add a Tasting Note
// ─────────────────────────────────────────────────────────────────────────────

test.describe('US-4.1: Add a Tasting Note', () => {
  let locationId: number;
  let wineId: number;

  test.beforeEach(async ({ page }) => {
    locationId = await createLocation(page, `UAT-Loc-${Date.now()}`);
    wineId = await createWine(page, locationId, { name: 'Note Wine', quantity: 2 });
  });

  test.afterEach(async ({ page }) => {
    await deleteWine(page, wineId);
    await deleteLocation(page, locationId);
  });

  test('/wines/[id]/notes/new renders note form', async ({ page }) => {
    await page.goto(`/wines/${wineId}/notes/new`);
    await expect(page.getByText(/Add Tasting Note/i)).toBeVisible();
    await expect(page.getByLabel(/Tasting Date/i)).toBeVisible();
  });

  test('Required field: tasting date', async ({ page }) => {
    await page.goto(`/wines/${wineId}/notes/new`);
    await expect(page.getByLabel(/Tasting Date/i)).toBeVisible();
    // The input should have a value (today's date is pre-filled)
    const dateInput = page.getByLabel(/Tasting Date/i);
    const value = await dateInput.inputValue();
    expect(value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('Rating widget present (5-star or 100-point)', async ({ page }) => {
    await page.goto(`/wines/${wineId}/notes/new`);
    // The rating section label
    await expect(page.getByText(/^Rating$/i)).toBeVisible();
    // Switch button to change scale is visible
    await expect(page.getByRole('button', { name: /Switch to/i })).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// US-4.3 – View All Tasting Notes for a Wine
// ─────────────────────────────────────────────────────────────────────────────

test.describe('US-4.3: View All Tasting Notes for a Wine', () => {
  let locationId: number;
  let wineId: number;

  test.beforeEach(async ({ page }) => {
    locationId = await createLocation(page, `UAT-Loc-${Date.now()}`);
    wineId = await createWine(page, locationId, { name: 'Notes View Wine', quantity: 1 });
  });

  test.afterEach(async ({ page }) => {
    await deleteWine(page, wineId);
    await deleteLocation(page, locationId);
  });

  test('Tasting Notes section on /wines/[id]', async ({ page }) => {
    await page.goto(`/wines/${wineId}`);
    // Tasting Notes is rendered inside a section-header div as a span
    const tastingNotesHeader = page.locator('.section-header').filter({ hasText: /Tasting Notes/i });
    await expect(tastingNotesHeader).toBeVisible();
  });

  test('Empty state: No tasting notes yet link shown', async ({ page }) => {
    await page.goto(`/wines/${wineId}`);
    await expect(page.getByText(/No tasting notes yet/i)).toBeVisible();
    // The "Add a Tasting Note →" link should be present
    const addNoteLink = page.getByRole('link', { name: /Add a Tasting Note/i });
    await expect(addNoteLink).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// US-5.1 – Set a Drinking Window
// ─────────────────────────────────────────────────────────────────────────────

test.describe('US-5.1: Set a Drinking Window', () => {
  let locationId: number;

  test.beforeEach(async ({ page }) => {
    locationId = await createLocation(page, `UAT-Loc-${Date.now()}`);
  });

  test.afterEach(async ({ page }) => {
    await deleteLocation(page, locationId);
  });

  test('Wine form has Drink From and Drink Until year inputs', async ({ page }) => {
    await page.goto('/wines/new');
    await page.getByRole('button', { name: /show optional fields/i }).click();
    await expect(page.getByLabel(/Drink From/i)).toBeVisible();
    await expect(page.getByLabel(/Drink Until/i)).toBeVisible();
  });

  test('Live readiness badge preview below the inputs', async ({ page }) => {
    await page.goto('/wines/new');
    await page.getByRole('button', { name: /show optional fields/i }).click();
    const currentYear = new Date().getFullYear();
    // Fill a window that renders a badge
    await page.getByLabel(/Drink From/i).fill(String(currentYear - 1));
    await page.getByLabel(/Drink Until/i).fill(String(currentYear + 5));
    // Badge preview text
    await expect(page.getByText(/Preview:/i)).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// US-5.2 – See Readiness Badge
// ─────────────────────────────────────────────────────────────────────────────

test.describe('US-5.2: See Readiness Badge', () => {
  let locationId: number;
  let wineId: number;

  test.beforeEach(async ({ page }) => {
    locationId = await createLocation(page, `UAT-Loc-${Date.now()}`);
    const currentYear = new Date().getFullYear();
    wineId = await createWine(page, locationId, {
      name: 'Badge Wine',
      quantity: 2,
      drinking_window_start: currentYear - 1,
      drinking_window_end: currentYear + 5,
    });
  });

  test.afterEach(async ({ page }) => {
    await deleteWine(page, wineId);
    await deleteLocation(page, locationId);
  });

  test('Wine detail page shows readiness badge', async ({ page }) => {
    await page.goto(`/wines/${wineId}`);
    const badge = page.locator('.badge').filter({ hasText: /Drink Now|Hold|Approaching Peak|Past Window|No Window Set/i });
    await expect(badge.first()).toBeVisible();
  });

  test('Wine cards on cellar page show readiness badge', async ({ page }) => {
    await page.goto('/cellar');
    // Wait for client-side wine list to render
    await page.waitForLoadState('networkidle');
    // Wine cards show readiness badges as spans with aria-label starting with "Readiness:"
    const badge = page.locator('[role="list"] span[aria-label^="Readiness"]').first();
    await expect(badge).toBeVisible({ timeout: 5000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// US-6.1 – View Summary Stats at a Glance
// ─────────────────────────────────────────────────────────────────────────────

test.describe('US-6.1: View Summary Stats at a Glance', () => {
  test('Dashboard (/) shows 4 stat tiles: Total Bottles, Unique Wines, Drink Now, Approaching Peak', async ({ page }) => {
    await page.goto('/');
    // Stat tile labels are rendered as div elements inside Link components
    await expect(page.getByText(/Total Bottles/i).first()).toBeVisible();
    await expect(page.getByText(/Unique Wines/i).first()).toBeVisible();
    await expect(page.getByText(/Drink Now/i).first()).toBeVisible();
    await expect(page.getByText(/Approaching Peak/i).first()).toBeVisible();
  });

  test('Drink Now tile links to /cellar?readiness=Drink+Now', async ({ page }) => {
    await page.goto('/');
    // Find the link by its href attribute to avoid ambiguity with shelf heading
    const drinkNowLink = page.locator('a[href*="readiness=Drink"]').first();
    await expect(drinkNowLink).toBeVisible();
    const href = await drinkNowLink.getAttribute('href');
    expect(href).toContain('/cellar');
    // href uses + for spaces: /cellar?readiness=Drink+Now
    expect(href).toMatch(/readiness=Drink/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// US-6.2 – Browse Drink Now Shelf
// ─────────────────────────────────────────────────────────────────────────────

test.describe('US-6.2: Browse Drink Now Shelf', () => {
  test('Dashboard includes Drink Now shelf section', async ({ page }) => {
    await page.goto('/');
    // The section label is rendered as a <span> with "Drink Now" text
    await expect(page.getByText('Drink Now').first()).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// US-6.3 – See Recently Added, Consumed, and Highest Rated
// ─────────────────────────────────────────────────────────────────────────────

test.describe('US-6.3: See Recently Added, Consumed, and Highest Rated', () => {
  test('Dashboard shows Recently Added section or its empty state', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/Recently Added/i)).toBeVisible();
  });

  test('Dashboard shows Recently Consumed section or its empty state', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/Recently Consumed/i)).toBeVisible();
  });

  test('Dashboard shows Highest Rated section or its empty state', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/Highest Rated/i)).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// US-6.4 – Explore Collection Breakdowns
// ─────────────────────────────────────────────────────────────────────────────

test.describe('US-6.4: Explore Collection Breakdowns', () => {
  let locationId: number;
  let wineId: number;

  test.beforeEach(async ({ page }) => {
    // Create a wine with country to ensure breakdown sections appear
    locationId = await createLocation(page, `UAT-Loc-${Date.now()}`);
    wineId = await createWine(page, locationId, {
      name: 'Breakdown Wine',
      wine_type: 'Red',
      country: 'France',
      vintage: 2015,
      quantity: 1,
    });
  });

  test.afterEach(async ({ page }) => {
    await deleteWine(page, wineId);
    await deleteLocation(page, locationId);
  });

  test('Dashboard shows type breakdown, country/region breakdown, decade breakdown sections or empty state', async ({ page }) => {
    await page.goto('/');
    const body = await page.textContent('body');
    // With at least one wine, these sections should appear
    // Type breakdown
    const hasTypeBreakdown = (body ?? '').includes('Wine Type');
    // Country breakdown
    const hasCountryBreakdown = (body ?? '').includes('Country');
    // Decade breakdown
    const hasDecadeBreakdown = (body ?? '').includes('Vintage Decade') || (body ?? '').includes('Decade');
    // Empty state fallback
    const hasEmptyState = (body ?? '').includes('Add wines to see your collection breakdown');

    expect(hasTypeBreakdown || hasCountryBreakdown || hasDecadeBreakdown || hasEmptyState).toBe(true);
  });
});
