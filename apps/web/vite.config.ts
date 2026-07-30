import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Proxies same-origin `/api/...` calls to the NestJS API in dev, so the browser
    // never makes a cross-origin request and we don't need to touch apps/api's CORS
    // config (which isn't set up). In production this would be a reverse proxy / gateway.
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },
})
