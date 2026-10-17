import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  maxFailures: 1,
  timeout: 60_000,
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1024 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  use: {
    baseURL: 'http://127.0.0.1:3600',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    env: { ...process.env, CONTROLLER_DEMO_MODE: 'true' },
    url: 'http://127.0.0.1:3600',
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
