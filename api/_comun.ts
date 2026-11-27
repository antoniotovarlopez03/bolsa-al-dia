// Utilidades compartidas por las funciones de Vercel (carpeta /api).
// Las claves se leen de las variables de entorno de Vercel; nunca están en el código.
import webpush from 'web-push';

export interface Suscripcion {
  endpoint: string;
  p256dh: string;
  auth: string;
  puestos: string[];
  provincias: string[];
  tipos: string[];
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const avisosConfigurados = Boolean(
  SUPABASE_URL && SUPABASE_KEY && process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY,
);

export function json(datos: unknown, estado = 200) {
  return new Response(JSON.stringify(datos), { status: estado, headers: { 'Content-Type': 'application/json' } });
}

/** Llamada a la API REST de Supabase con la clave de servicio (solo en el servidor). */
export async function supabase(ruta: string, opciones: RequestInit = {}) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${ruta}`, {
    ...opciones,
    headers: {
      apikey: SUPABASE_KEY!,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      ...opciones.headers,
    },
  });
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return r;
}

export function configurarWebPush() {
  webpush.setVapidDetails(
    'mailto:avisos@bolsa-sur.invalid', // contacto genérico (no personal)
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  return webpush;
}

/** Validación sencilla para no guardar basura. */
export const esCodigo = (s: unknown) => typeof s === 'string' && /^[0-9A-Z]{6,10}$/.test(s);
export const PROVINCIAS = ['Almería', 'Cádiz', 'Córdoba', 'Granada', 'Huelva', 'Jaén', 'Málaga', 'Sevilla'];
export const TIPOS = ['convocatoria', 'adjudicacion', 'notas'];
