// POST /api/suscribir   → guarda o actualiza la suscripción a avisos de este navegador.
// DELETE /api/suscribir → la borra (el usuario desactiva los avisos).
// GET /api/suscribir    → dice si los avisos están disponibles (sin datos personales).
import { PROVINCIAS, TIPOS, avisosConfigurados, esCodigo, json, supabase } from './_comun.js';

export function GET() {
  return json({ disponible: avisosConfigurados, clavePublica: process.env.VAPID_PUBLIC_KEY ?? null });
}

export async function POST(req: Request) {
  if (!avisosConfigurados) return json({ error: 'Avisos no configurados todavía' }, 503);
  let b: any;
  try {
    b = await req.json();
  } catch {
    return json({ error: 'Petición no válida' }, 400);
  }
  const s = b?.suscripcion;
  const endpoint = s?.endpoint;
  if (typeof endpoint !== 'string' || !/^https:\/\/[^\s]{10,800}$/.test(endpoint) || !s?.keys?.p256dh || !s?.keys?.auth)
    return json({ error: 'Suscripción no válida' }, 400);

  const fila = {
    endpoint,
    p256dh: String(s.keys.p256dh).slice(0, 200),
    auth: String(s.keys.auth).slice(0, 100),
    puestos: (Array.isArray(b.puestos) ? b.puestos : []).filter(esCodigo).slice(0, 20),
    provincias: (Array.isArray(b.provincias) ? b.provincias : []).filter((p: unknown) => PROVINCIAS.includes(p as string)),
    tipos: (Array.isArray(b.tipos) ? b.tipos : TIPOS).filter((t: unknown) => TIPOS.includes(t as string)),
    actualizada: new Date().toISOString(),
  };
  try {
    await supabase('suscripciones?on_conflict=endpoint', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(fila),
    });
    return json({ ok: true });
  } catch (e) {
    console.error(e);
    return json({ error: 'No se pudo guardar' }, 500);
  }
}

export async function DELETE(req: Request) {
  if (!avisosConfigurados) return json({ ok: true });
  try {
    const { endpoint } = await req.json();
    if (typeof endpoint === 'string') await supabase(`suscripciones?endpoint=eq.${encodeURIComponent(endpoint)}`, { method: 'DELETE' });
    return json({ ok: true });
  } catch {
    return json({ error: 'No se pudo borrar' }, 500);
  }
}
