import { defineConfig } from 'vitest/config'

export default defineConfig({ test: { include: ['test-integration/*.firestore.mts'], testTimeout: 20_000 } })
