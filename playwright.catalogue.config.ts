import { defineConfig, devices } from '@playwright/test'

const origin = URL.parse(process.env.CONTROLLER_CATALOGUE_E2E_PORTAL_ORIGIN || '')
if (!origin || origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash
  || (origin.protocol !== 'https:' && !(origin.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(origin.hostname)))) {
  throw new Error('Configure the local or Test Network catalogue portal origin.')
}

export default defineConfig({
  testDir: './catalogue-e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  use: { ...devices['Desktop Chrome'], baseURL: origin.origin, screenshot: 'off', trace: 'off', video: 'off' },
})
