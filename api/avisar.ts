// POST /api/avisar — lo llama SOLO el robot cuando detecta novedades en SIPRI.
// Protegido con un secreto compartido (variable AVISOS_SECRET en Vercel y en GitHub).
// Envía a cada suscripción un único aviso con lo que le interesa (sus especialidades y provincias).
import { avisosConfigurados, configurarWebPush, json, supabase, type Suscripcion } from './_comun.js';

interface FilaPlazas { puesto: string; provincia: string; plazas: number }
type Evento =
  | { tipo: 'convocatoria'; fecha: string; plazas: FilaPlazas[]; convocados: Record<string, number> }
  | { tipo: 'adjudicacion'; fecha: string; adjudicados: FilaPlazas[] }
  | { tipo: 'nota'; titulo: string };

const fecha = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
const POR_LOTE = 50;

/** Construye el aviso para una suscripción, o null si no le interesa nada. */
export function componerAviso(s: Suscripcion, eventos: Evento[]) {
  const partes: string[] = [];
  let titulo = '';
  for (const e of eventos) {
    if (e.tipo === 'convocatoria' && s.tipos.includes('convocatoria')) {
      const mias = e.plazas.filter((f) => s.puestos.includes(f.puesto) && (!s.provincias.length || s.provincias.includes(f.provincia)));
      const n = mias.reduce((a, f) => a + f.plazas, 0);
      titulo ||= `Ya está la convocatoria del ${fecha(e.fecha)}`;
      partes.push(n ? `${n} ${n === 1 ? 'plaza' : 'plazas'} de tus especialidades en tus provincias.` : 'Sin plazas de tus especialidades en tus provincias.');
      const conv = s.puestos.reduce((a, p) => a + (e.convocados[p] ?? 0), 0);
      if (conv) partes.push(`${conv} personas convocadas de tus bolsas: mira si está tu número.`);
    }
    if (e.tipo === 'adjudicacion' && s.tipos.includes('adjudicacion')) {
      const mias = e.adjudicados.filter((f) => s.puestos.includes(f.puesto) && (!s.provincias.length || s.provincias.includes(f.provincia)));
      const n = mias.reduce((a, f) => a + f.plazas, 0);
      titulo ||= `Ya está la adjudicación del ${fecha(e.fecha)}`;
      partes.push(`${n} ${n === 1 ? 'plaza adjudicada' : 'plazas adjudicadas'} de tus especialidades. Actualiza tu situación en Mis bolsas.`);
    }
    if (e.tipo === 'nota' && s.tipos.includes('notas')) {
      titulo ||= 'Nuevo aviso de SIPRI';
      const t = e.titulo.replace(/^NOTA INFORMATIVA[.:]?\s*/i, '').toLowerCase().replace(/^./, (c) => c.toUpperCase());
      partes.push(`Aviso de SIPRI: ${t.replace(/\.$/, '')}.`);
    }
  }
  if (!partes.length) return null;
  return { titulo, cuerpo: partes.join(' '), url: '/' };
}

async function todasLasSuscripciones(): Promise<Suscripcion[]> {
  const res: Suscripcion[] = [];
  for (let desde = 0; desde < 100000; desde += 1000) {
    const r = await supabase(`suscripciones?select=endpoint,p256dh,auth,puestos,provincias,tipos&order=endpoint&limit=1000&offset=${desde}`);
    const lote = (await r.json()) as Suscripcion[];
    res.push(...lote);
    if (lote.length < 1000) break;
  }
  return res;
}

export async function POST(req: Request) {
  if (!process.env.AVISOS_SECRET || req.headers.get('x-avisos-secreto') !== process.env.AVISOS_SECRET)
    return json({ error: 'No autorizado' }, 401);
  if (!avisosConfigurados) return json({ error: 'Avisos no configurados' }, 503);

  const { eventos } = (await req.json()) as { eventos: Evento[] };
  if (!Array.isArray(eventos) || !eventos.length) return json({ enviados: 0 });

  const webpush = configurarWebPush();
  const subs = await todasLasSuscripciones();
  let enviados = 0;
  const caducadas: string[] = [];

  for (let i = 0; i < subs.length; i += POR_LOTE) {
    await Promise.allSettled(
      subs.slice(i, i + POR_LOTE).map(async (s) => {
        const aviso = componerAviso(s, eventos);
        if (!aviso) return;
        try {
          await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(aviso), { TTL: 6 * 3600 });
          enviados++;
        } catch (e: any) {
          if (e?.statusCode === 404 || e?.statusCode === 410) caducadas.push(s.endpoint); // el navegador ya no la usa
        }
      }),
    );
  }
  for (const ep of caducadas) await supabase(`suscripciones?endpoint=eq.${encodeURIComponent(ep)}`, { method: 'DELETE' }).catch(() => {});
  return json({ suscripciones: subs.length, enviados, caducadas: caducadas.length });
}
