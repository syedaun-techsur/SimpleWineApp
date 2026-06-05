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
