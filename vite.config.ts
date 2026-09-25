import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['sharefinance.dapat.com'],
    proxy: {
      '/auth': 'http://localhost:4000',
      '/me': 'http://localhost:4000',
      '/groups': 'http://localhost:4000',
    },
  },
})
