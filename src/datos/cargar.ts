// Carga los datos públicos que genera el robot (public/datos/and/).
// El service worker los guarda para poder verlos sin conexión.
import { useEffect, useState } from 'react';
import type { Convocatoria, Indice } from './tipos';

const RUTA = '/datos/and/';
/** Cuántas convocatorias recientes se descargan (≈ 2 meses). Limita datos móviles. */
export const MAX_CONVOCATORIAS = 16;

export type EstadoCarga =
  | { tipo: 'cargando' }
  | { tipo: 'error'; mensaje: string }
  | { tipo: 'listo'; indice: Indice; convocatorias: Convocatoria[] };

async function json<T>(url: string): Promise<T> {
  const r = await fetch(url, { cache: 'no-cache' });
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json() as Promise<T>;
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
        if (vivo) setEstado({ tipo: 'listo', indice, convocatorias });
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
