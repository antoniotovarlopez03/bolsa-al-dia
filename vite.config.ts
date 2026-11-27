import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icono.svg', 'favicon-32.png', 'apple-touch-icon.png'],
      workbox: {
        // Datos de SIPRI: se pide la versión nueva y, si no hay conexión, se usa la última guardada.
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/datos/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'datos-sipri',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 90 },
            },
          },
        ],
      },
      manifest: {
        name: 'Bolsa Sur · Bolsas docentes de Andalucía',
        short_name: 'Bolsa Sur',
        description: 'Sigue tus bolsas docentes de Andalucía. Herramienta independiente, no oficial.',
        lang: 'es',
        start_url: '/',
        display: 'standalone',
        background_color: '#f4f6f4',
        theme_color: '#007a33',
        // Iconos generados con `npm run iconos` (scripts/iconos.mjs).
        icons: [
          { src: 'icono-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icono-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icono-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'icono.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
    }),
  ],
});
