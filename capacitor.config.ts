import type { CapacitorConfig } from '@capacitor/cli';

/* App de iPhone (App Store) de Bolsa Sur. Lleva la web dentro (carpeta dist) y descarga
   los datos públicos de https://bolsa-al-dia.vercel.app. Incluye «Conectar con SIPRI»:
   el docente entra él mismo en la web oficial dentro de la app y la app lee SUS números
   en el propio móvil (no se envían a ningún servidor). Ver docs/03-app-iphone.md. */
const config: CapacitorConfig = {
  appId: 'es.bolsasur.app',
  appName: 'Bolsa Sur',
  webDir: 'dist',
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#f4f6f4',
  },
  plugins: {
    // Las peticiones de la app (datos de Vercel) salen por el sistema nativo: sin problemas de CORS.
    CapacitorHttp: { enabled: true },
  },
};

export default config;
