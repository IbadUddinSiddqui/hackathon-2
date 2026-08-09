import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts', 'tests/**/*.test.ts'],
  },
  resolve: {
    alias: {
      // Mirror tsconfig's "@/*" path so lib tests can import app modules.
      '@': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
});
