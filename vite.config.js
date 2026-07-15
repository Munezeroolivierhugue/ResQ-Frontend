import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    global: 'globalThis',
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/ws': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        ws: true,
      },
      '/webhook': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      // Field-report photo/document attachments are served as static files
      // directly by the backend (FileStorageService), not under /api — this
      // proxy rule was missing entirely, so any attempt to render an
      // attachment's fileUrl 404'd against the frontend's own dev-server
      // origin instead of reaching the backend.
      '/reports': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
