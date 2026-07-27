import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Local HTTPS for LAN/phone testing (mkcert-generated, gitignored under .cert/).
// Falls back to plain HTTP automatically when the cert isn't present so the
// dev server still runs for anyone who hasn't generated one.
const certFile = path.resolve(__dirname, '.cert/dev-cert.pem')
const keyFile = path.resolve(__dirname, '.cert/dev-key.pem')
const httpsConfig = fs.existsSync(certFile) && fs.existsSync(keyFile)
  ? { cert: fs.readFileSync(certFile), key: fs.readFileSync(keyFile) }
  : undefined

// Forces a real browser download (Content-Disposition: attachment) for the
// mkcert root CA instead of Chrome rendering the .pem inline as text — needed
// so mobile browsers save it via their Download Manager (giving CertInstaller
// proper read access) rather than just displaying it.
const forceCertDownload = {
  name: 'force-cert-download',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url?.startsWith('/mkcert-root-ca.pem')) {
        res.setHeader('Content-Disposition', 'attachment; filename="mkcert-root-ca.pem"')
      }
      next()
    })
  },
}

export default defineConfig({
  plugins: [
    forceCertDownload,
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: true },
      includeAssets: ['favicon.svg', 'icons.svg'],
      manifest: {
        name: 'ResQ — Emergency Response Intelligence',
        short_name: 'ResQ',
        description: 'Rwanda emergency response coordination platform',
        theme_color: '#879D1F',
        background_color: '#060D1A',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallbackDenylist: [/^\/api/, /^\/webhook/, /^\/ws/],
        runtimeCaching: [
          {
            // Field Responder + Dispatcher GET data (assignments, shift status, incidents, etc.)
            // NetworkFirst so we always try live data, falling back to last-known cache offline.
            urlPattern: ({ url, request }) => url.pathname.startsWith('/api') && request.method === 'GET',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'resq-api-get-cache',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Never cache mutating requests — offline submissions must fail loudly, not
            // appear to succeed against a stale cache (would silently drop incident data).
            urlPattern: ({ url, request }) => url.pathname.startsWith('/api') && request.method !== 'GET',
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
  define: {
    global: 'globalThis',
  },
  server: {
    host: true,
    https: httpsConfig,
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
      // Profile photos are served the same way (FileStorageService static
      // files under /uploads/profile-photos, URL without the "uploads"
      // segment) — same missing-proxy-rule bug as /reports above.
      '/profile-photos': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
