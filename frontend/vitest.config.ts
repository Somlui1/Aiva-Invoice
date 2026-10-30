import { configDefaults, defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  test: {
    globals: true,
    globalSetup: ['./vitest.global-setup.ts'],
    setupFiles: ['./vitest.setup.ts'],
    exclude: [...configDefaults.exclude, '**/.patch-backup/**', '**/docs/change/**'],
    // Ingestion tests share one SQLite file; serializing files avoids lock races.
    fileParallelism: false,
    env: {
      VITE_AUTH_MOCK: 'true',
      VITE_AUTH_BYPASS: 'true',
    },
  }
})
