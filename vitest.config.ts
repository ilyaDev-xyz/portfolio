import { defineConfig } from 'vitest/config';

// Standalone test config — does NOT load vite.config.ts plugins
// (agent-mirrors generation, head injection) so the test runner stays fast
// and side-effect free.
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: false,
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
    clearMocks: true,
    restoreMocks: true,
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  },
});
