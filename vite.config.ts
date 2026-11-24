import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icono.svg'],
      manifest: {
        name: 'Bolsa al Día',
        short_name: 'Bolsa al Día',
        description: 'Sigue tus bolsas docentes de Andalucía. Herramienta independiente, no oficial.',
        lang: 'es',
        start_url: '/',
        display: 'standalone',
        background_color: '#f6f8f8',
        theme_color: '#0f5e66',
        icons: [{ src: 'icono.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
      },
    }),
  ],
});
