// ¿Estamos dentro de la app de iPhone/Android (Capacitor) o en la web?
import { Capacitor } from '@capacitor/core';

export const esAppNativa = () => Capacitor.isNativePlatform();

/** En la app, los datos públicos se descargan de la web publicada; en la web, de la misma dirección. */
export const BASE_DATOS = () => (esAppNativa() ? 'https://bolsa-al-dia.vercel.app' : '');
