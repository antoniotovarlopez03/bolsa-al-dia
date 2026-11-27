// Avisos (notificaciones web) en el navegador. Sin cuentas: el navegador da un "buzón" anónimo
// y se guarda junto con las especialidades y provincias elegidas, nada más.
import type { Perfil } from './datos/tipos';

export type TipoAviso = 'convocatoria' | 'adjudicacion' | 'notas';
export const TIPOS_AVISO: Array<[TipoAviso, string]> = [
  ['convocatoria', 'Nueva convocatoria y plazas de mis especialidades'],
  ['adjudicacion', 'Adjudicación publicada'],
  ['notas', 'Avisos y plazos de SIPRI'],
];

const CLAVE_TIPOS = 'bolsa-al-dia:avisos-tipos';

export type EstadoAvisos =
  | { tipo: 'no-soportado' }
  | { tipo: 'iphone-instalar' } // iPhone: solo funcionan con la app añadida a la pantalla de inicio
  | { tipo: 'no-disponible' } // el servidor aún no tiene las claves configuradas
  | { tipo: 'bloqueado' } // el usuario denegó el permiso
  | { tipo: 'desactivado' }
  | { tipo: 'activado' };

const esIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent);
const instalada = () => window.matchMedia?.('(display-mode: standalone)').matches || (navigator as any).standalone === true;

export function tiposGuardados(): TipoAviso[] {
  try {
    const t = JSON.parse(localStorage.getItem(CLAVE_TIPOS) ?? 'null');
    if (Array.isArray(t)) return t;
  } catch {
    /* sin datos */
  }
  return ['convocatoria', 'adjudicacion', 'notas'];
}

function guardarTipos(t: TipoAviso[]) {
  try {
    localStorage.setItem(CLAVE_TIPOS, JSON.stringify(t));
  } catch {
    /* modo privado */
  }
}

async function configuracion(): Promise<{ disponible: boolean; clavePublica: string | null }> {
  try {
    const r = await fetch('/api/suscribir', { cache: 'no-store' });
    if (!r.ok) throw new Error();
    return await r.json();
  } catch {
    return { disponible: false, clavePublica: null };
  }
}

async function suscripcionActual() {
  const reg = await navigator.serviceWorker?.getRegistration();
  return reg ? reg.pushManager.getSubscription() : null;
}

export async function estadoAvisos(): Promise<EstadoAvisos> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window))
    return esIOS() && !instalada() ? { tipo: 'iphone-instalar' } : { tipo: 'no-soportado' };
  if (esIOS() && !instalada()) return { tipo: 'iphone-instalar' };
  if (Notification.permission === 'denied') return { tipo: 'bloqueado' };
  const { disponible } = await configuracion();
  if (!disponible) return { tipo: 'no-disponible' };
  return (await suscripcionActual()) ? { tipo: 'activado' } : { tipo: 'desactivado' };
}

function aUint8(base64: string) {
  const relleno = '='.repeat((4 - (base64.length % 4)) % 4);
  const b = atob((base64 + relleno).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
}

async function enviar(sub: PushSubscription, perfil: Perfil, tipos: TipoAviso[]) {
  const r = await fetch('/api/suscribir', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      suscripcion: sub.toJSON(),
      puestos: perfil.bolsas.map((b) => b.bolsaId.replace(/^AND-/, '')),
      provincias: [...new Set(perfil.bolsas.flatMap((b) => b.provincias))],
      tipos,
    }),
  });
  if (!r.ok) throw new Error('No se pudo guardar la suscripción');
}

/** Pide permiso, crea la suscripción y la guarda. Devuelve el nuevo estado. */
export async function activarAvisos(perfil: Perfil, tipos: TipoAviso[]): Promise<EstadoAvisos> {
  const { disponible, clavePublica } = await configuracion();
  if (!disponible || !clavePublica) return { tipo: 'no-disponible' };
  const permiso = await Notification.requestPermission();
  if (permiso !== 'granted') return { tipo: permiso === 'denied' ? 'bloqueado' : 'desactivado' };
  const reg = await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription())
    ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: aUint8(clavePublica) }));
  await enviar(sub, perfil, tipos);
  guardarTipos(tipos);
  return { tipo: 'activado' };
}

export async function desactivarAvisos(): Promise<EstadoAvisos> {
  const sub = await suscripcionActual();
  if (sub) {
    await fetch('/api/suscribir', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    }).catch(() => {});
    await sub.unsubscribe().catch(() => {});
  }
  return { tipo: 'desactivado' };
}

/** Si los avisos están activos, actualiza especialidades/provincias/tipos en el servidor. */
export async function actualizarAvisos(perfil: Perfil, tipos: TipoAviso[] = tiposGuardados()) {
  try {
    const sub = await suscripcionActual();
    if (sub && Notification.permission === 'granted') {
      await enviar(sub, perfil, tipos);
      guardarTipos(tipos);
    }
  } catch {
    /* sin conexión: se actualizará la próxima vez */
  }
}
