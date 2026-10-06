import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import type { ProxyOptions } from 'vite'

// API paths share prefixes with app routes (/groups/:id is both a page and an endpoint).
// Browser navigations ask for HTML, so hand those to the SPA and proxy everything else.
const api: ProxyOptions = {
  target: 'http://localhost:4000',
  bypass: (req) => (req.headers.accept?.includes('text/html') ? '/index.html' : undefined),
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['sharefinance.dapat.com'],
    proxy: {
      '/auth': api,
      '/me': api,
      '/groups': api,
      '/connect': api,
    },
  },
})
