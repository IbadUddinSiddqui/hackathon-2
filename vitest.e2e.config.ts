import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  test: {
    environment: 'node',
    // Only the E2E specs run here; unit tests (lib/**/*.test.ts, tests/**/*.test.ts)
    // are excluded so `npm test` stays hermetic (no network/keys required).
    include: ['tests/e2e/**/*.spec.ts'],
    testTimeout: 120_000,
    hookTimeout: 120_000,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
});
