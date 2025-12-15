import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    {
      enforce: 'pre',
      transform(code, id) {
        if (id.endsWith('.css') || id.endsWith('.scss') || id.endsWith('.sass')) {
          return ''; // Ignore CSS imports during tests
        }
      }
    }
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './test/setUpTests.js',
    testTimeout: 20000
  }
})
