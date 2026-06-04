import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './specs',
  timeout: 15000,
  expect: { timeout: 8000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: 1,
  globalSetup: './global-setup',

  use: {
    baseURL: process.env.CI
      ? 'http://frontend:3000'
      : process.env.BASE_URL || 'http://localhost:3000',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'off',
    video: 'off',
  },

  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],

  reporter: process.env.CI
    ? [['github'], ['list']]
    : [['html', { open: 'never' }]],
})
