import { defineConfig, devices } from '@playwright/test'

const origin = URL.parse(process.env.ANTIFRAUD_ADMISSION_E2E_ORIGIN || '')
if (!origin || origin.protocol !== 'https:' || origin.username || origin.password
  || origin.pathname !== '/' || origin.search || origin.hash) {
  throw new Error('Set ANTIFRAUD_ADMISSION_E2E_ORIGIN to the dedicated HTTPS Test Network controller origin.')
}
if (process.env.FIREBASE_AUTH_EMULATOR_HOST || process.env.FIRESTORE_EMULATOR_HOST) {
  throw new Error('This suite requires online Firebase Auth and Firestore.')
}

export default defineConfig({
  testDir: './test-network-e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  use: {
    ...devices['Desktop Chrome'],
    baseURL: origin.origin,
    screenshot: 'off',
    trace: 'off',
    video: 'off',
  },
})
