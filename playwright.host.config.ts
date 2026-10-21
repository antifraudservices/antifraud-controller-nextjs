import { defineConfig, devices } from '@playwright/test'

const profiles = JSON.stringify({
  '127.0.0.1': {
    id: 'local-host-controller', kind: 'host-controller', name: 'Federated Host Controller',
    logoUrl: '/brand/controller-mark.svg', accentColor: '#075f68', supportUrl: 'https://support.example.org/controller',
    modules: ['host-organizations'], allowedSectors: ['health-care', 'education'], allowedJurisdictions: ['ES'],
    enrollmentPolicy: 'jurisdiction-provider',
  },
})

export default defineConfig({
  testDir: './e2e-host', fullyParallel: false, workers: 1, timeout: 60_000,
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1024 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  use: { baseURL: 'http://127.0.0.1:3600', trace: 'retain-on-failure' },
  webServer: {
    command: 'npm run dev', url: 'http://127.0.0.1:3600', reuseExistingServer: false, timeout: 120_000,
    env: { ...process.env, CONTROLLER_PORTAL_HOST_PROFILES_JSON: profiles, HOST_CONTROLLER_DEMO_MODE: 'true', HOST_CONTROLLER_DEMO_SUBJECT: 'host-admin-001' },
  },
})
