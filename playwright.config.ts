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
      command: 'npm --prefix ../terminology-api-node-ts run build && node ../terminology-api-node-ts/dist/index.js',
      env: {
        ...process.env,
        PORT: '3720',
        TERMINOLOGY_SERVICE_TOKEN: 'local-terminology-bff-token',
        TERMINOLOGY_UPSTREAM_UMLS_ENABLED: 'false',
        TERMINOLOGY_CATALOG_DIR: '../terminology-api-node-ts/catalogs/antifraud-demo',
      },
      url: 'http://127.0.0.1:3720/health',
      reuseExistingServer: false,
      timeout: 120_000,
    },
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
        // local-network is a release-validation transport profile, not a
        // browser-selectable environment. The UI remains on its synthetic
        // test profile while the separately started Gateway uses real Fabric.
        ANTIFRAUD_NETWORK_KIND: 'test',
        CONTROLLER_DEMO_MODE: 'true',
        ANTIFRAUD_GATEWAY_BASE_URL: 'http://127.0.0.1:3700',
        ANTIFRAUD_GATEWAY_BEARER: 'local-controller-bff-token',
        TERMINOLOGY_BASE_URL: 'http://127.0.0.1:3720',
        TERMINOLOGY_SERVICE_TOKEN: 'local-terminology-bff-token',
        CONTROLLER_PORTAL_HOST_PROFILES_JSON: JSON.stringify({
          '127.0.0.1': {
            id: 'local-antifraud-tech', kind: 'organization-controller',
            name: 'Antifraud Controller', logoUrl: '/brand/controller-mark.svg', accentColor: '#075f68',
            supportUrl: 'https://github.com/antifraudservices/antifraud-controller-nextjs',
            modules: ['organization', 'workforce', 'structure', 'evidence', 'clearing-house'],
            allowedSectors: ['antifraud-tech'], allowedJurisdictions: ['CA-BC'],
            enrollmentPolicy: 'jurisdiction-provider',
          },
        }),
      },
      url: 'http://127.0.0.1:3600',
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: 'npm --prefix ../antifraud-professional-nextjs run dev',
      env: {
        ...process.env,
        ANTIFRAUD_NETWORK_KIND: 'test',
        ANTIFRAUD_GATEWAY_BASE_URL: 'http://127.0.0.1:3700',
        ANTIFRAUD_GATEWAY_BEARER: 'local-professional-bff-token',
      },
      url: 'http://127.0.0.1:3610',
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
})
