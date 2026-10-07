import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

// Unit tests for plain TypeScript modules (no React Native rendering).
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: { include: ['test/**/*.test.ts'] },
});
