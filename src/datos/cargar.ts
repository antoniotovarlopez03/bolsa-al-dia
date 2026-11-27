// Carga los datos públicos que genera el robot (public/datos/and/).
// El service worker los guarda para poder verlos sin conexión.
import { BASE_DATOS } from '../nativo';
import { useEffect, useState } from 'react';
import type { Convocatoria, DetalleConvocatoria, Indice, NotaSipri } from './tipos';

// En la app de iPhone/Android los datos se piden a la web publicada.
const RUTA = BASE_DATOS() + '/datos/and/';
/** Cuántas convocatorias recientes se descargan (≈ 2 meses). Limita datos móviles. */
export const MAX_CONVOCATORIAS = 16;

export type EstadoCarga =
  | { tipo: 'cargando' }
  | { tipo: 'error'; mensaje: string }
  | { tipo: 'listo'; indice: Indice; convocatorias: Convocatoria[]; novedades: NotaSipri[] };

async function json<T>(url: string): Promise<T> {
  const r = await fetch(url, { cache: 'no-cache' });
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json() as Promise<T>;
}

// ── Detalle de plazas: se descarga solo cuando se abre (y se recuerda mientras la app está abierta) ──
const cacheDetalle = new Map<string, Promise<DetalleConvocatoria | null>>();

function cargarDetalle(id: string) {
  if (!cacheDetalle.has(id))
    cacheDetalle.set(id, json<DetalleConvocatoria>(`${RUTA}convocatorias/${id}.plazas.json`).catch(() => null));
  return cacheDetalle.get(id)!;
}

/** undefined = cargando · null = no hay detalle para esta convocatoria. */
export function useDetalle(id: string | undefined): DetalleConvocatoria | null | undefined {
  const [det, setDet] = useState<DetalleConvocatoria | null | undefined>(undefined);
  useEffect(() => {
    if (!id) return setDet(null);
    let vivo = true;
    setDet(undefined);
    cargarDetalle(id).then((d) => vivo && setDet(d));
    return () => {
      vivo = false;
    };
  }, [id]);
  return det;
}

export function useDatosPublicos(): EstadoCarga {
  const [estado, setEstado] = useState<EstadoCarga>({ tipo: 'cargando' });

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const indice = await json<Indice>(RUTA + 'indice.json');
        const ultimas = indice.convocatorias.slice(-MAX_CONVOCATORIAS);
        const convocatorias = (
          await Promise.all(ultimas.map((c) => json<Convocatoria>(`${RUTA}convocatorias/${c.id}.json`).catch(() => null)))
        ).filter((c): c is Convocatoria => c !== null);
        // Las novedades son opcionales: si faltan, la app funciona igual.
        const novedades = (await json<{ notas: NotaSipri[] }>(RUTA + 'novedades.json').catch(() => ({ notas: [] }))).notas;
        if (vivo) setEstado({ tipo: 'listo', indice, convocatorias, novedades });
      } catch {
        if (vivo) setEstado({ tipo: 'error', mensaje: 'No se han podido cargar los datos de SIPRI. Comprueba tu conexión.' });
      }
    })();
    return () => {
      vivo = false;
    };
  }, []);

  return estado;
}
