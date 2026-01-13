import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['images/**/*'],
      manifest: {
        name: 'Bar Vidva - Kaset Fair',
        short_name: 'Bar Vidva',
        description: 'Food ordering system for Bar Vidva booth at Kaset Fair 2026',
        theme_color: '#f97316',
        background_color: '#f9fafb',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: '/images/logo.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
          {
            src: '/images/logo.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        // Cache static assets
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],

        // Runtime caching strategies
        runtimeCaching: [
          {
            // Cache menu API - Network first, fallback to cache
            urlPattern: /^.*\/api\/v1\/menu(\?.*)?$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'menu-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60, // 1 hour
              },
              networkTimeoutSeconds: 5,
            },
          },
          {
            // Cache queue API - Network first for live updates
            urlPattern: /^.*\/api\/v1\/queue(\?.*)?$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'queue-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60, // 1 minute
              },
              networkTimeoutSeconds: 3,
            },
          },
          {
            // Cache order status API - Network first
            urlPattern: /^.*\/api\/v1\/orders\/[^/]+$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'order-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5, // 5 minutes
              },
              networkTimeoutSeconds: 5,
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
