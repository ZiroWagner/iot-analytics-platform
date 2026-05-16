import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, './src'),
      '@tests': path.resolve(rootDir, './src/tests'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup/setup.ts'],
    include: [
      'src/**/*.test.{ts,tsx}',
      'src/**/tests/**/*.{test,spec}.{ts,tsx}',
      'src/tests/**/*.{test,spec}.{ts,tsx}',
    ],
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json-summary'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/tests/**',
        'src/test/**',
        'src/tests/setup/**',
        'src/tests/builders/**',
        'src/tests/fixtures/**',
        'src/tests/mocks/**',
        'src/**/*.d.ts',
        'src/app/**',
        'src/components/ui/**',
      ],
    },
  },
})
