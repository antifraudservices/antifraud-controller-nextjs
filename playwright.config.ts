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
  webServer: [
    {
      command: 'npm --prefix ../antifraud-gw-node-ts run build && node ../antifraud-gw-node-ts/test/local-controller-gateway-server.mjs',
      url: 'http://127.0.0.1:3700/healthz',
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: 'npm run dev',
      env: {
        ...process.env,
        CONTROLLER_DEMO_MODE: 'true',
        ANTIFRAUD_GATEWAY_BASE_URL: 'http://127.0.0.1:3700',
        ANTIFRAUD_GATEWAY_BEARER: 'local-controller-bff-token',
      },
      url: 'http://127.0.0.1:3600',
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
})
