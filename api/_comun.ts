// Utilidades compartidas por las funciones de Vercel (carpeta /api).
// Las claves se leen de las variables de entorno de Vercel; nunca están en el código.
// Las suscripciones se guardan en Upstash Redis (plan gratuito, conectado desde Vercel → Storage).
import webpush from 'web-push';

export interface Suscripcion {
  endpoint: string;
  p256dh: string;
  auth: string;
  puestos: string[];
  provincias: string[];
  tipos: string[];
}

// Vercel crea estas variables al conectar Upstash (según la versión, con un nombre u otro).
const REDIS_URL = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
const CLAVE = 'bolsasur:suscripciones'; // un único "hash": endpoint → datos de la suscripción

export const avisosConfigurados = Boolean(
  REDIS_URL && REDIS_TOKEN && process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY,
);

export function json(datos: unknown, estado = 200) {
  return new Response(JSON.stringify(datos), { status: estado, headers: { 'Content-Type': 'application/json' } });
}

/** Ejecuta un comando de Redis por su API REST. */
async function redis(...comando: string[]) {
  const r = await fetch(REDIS_URL!, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(comando),
  });
  const j = (await r.json()) as { result?: unknown; error?: string };
  if (!r.ok || j.error) throw new Error(`Redis: ${j.error ?? r.status}`);
  return j.result;
}

export async function guardarSuscripcion(s: Suscripcion) {
  await redis('HSET', CLAVE, s.endpoint, JSON.stringify(s));
}

export async function borrarSuscripcion(endpoint: string) {
  await redis('HDEL', CLAVE, endpoint);
}

export async function todasLasSuscripciones(): Promise<Suscripcion[]> {
  const plano = ((await redis('HGETALL', CLAVE)) as string[] | null) ?? [];
  const res: Suscripcion[] = [];
  for (let i = 1; i < plano.length; i += 2) {
    try {
      res.push(JSON.parse(plano[i]));
    } catch {
      /* entrada dañada: se ignora */
    }
  }
  return res;
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
