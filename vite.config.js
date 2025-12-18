import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // needed to polyfill NodeJS modules like 'util' used in some dependencies
    nodePolyfills()
  ],
  // leading dot needed to run from any path
  base: './'
})
