// ⚠️ DATOS DE EJEMPLO. Inventados solo para probar el diseño.
// NO proceden de SIPRI. Todo lleva esEjemplo: true y la app lo muestra.
import { CATALOGO, URL_SIPRI } from './catalogo';
import { PROVINCIAS_AND, type Convocatoria, type EventoCalendario, type PaqueteDatos } from './tipos';

// Generador pseudoaleatorio con semilla (siempre da los mismos números).
function aleatorio(semilla: number) {
  let s = semilla;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** Martes y jueves de las últimas `semanas` semanas, contando desde `hoy`. */
function fechasConvocatoria(hoy: Date, semanas: number): Date[] {
  const res: Date[] = [];
  const d = new Date(hoy);
  d.setDate(d.getDate() - semanas * 7);
  const limite = new Date(hoy);
  limite.setHours(0, 0, 0, 0); // solo convocatorias anteriores a hoy (ya adjudicadas)
  while (d < limite) {
    if (d.getDay() === 2 || d.getDay() === 4) res.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return res;
}

export function crearDatosEjemplo(hoy = new Date()): PaqueteDatos {
  const r = aleatorio(42);
  const fechas = fechasConvocatoria(hoy, 8);
  const ultimoOrden: Record<string, number> = {};

  const convocatorias: Convocatoria[] = fechas.map((f, i) => {
    const adj = new Date(f);
    adj.setDate(adj.getDate() + 2);
    const inc = new Date(adj);
    inc.setDate(inc.getDate() + 1);
    const resumen = CATALOGO.flatMap((b) =>
      PROVINCIAS_AND.map((p) => {
        const ofertadas = Math.floor(r() * (b.cuerpo === '597' ? 9 : 5));
        const noCubiertas = Math.floor(ofertadas * r() * 0.3);
        const clave = `${b.id}-${p}`;
        ultimoOrden[clave] = (ultimoOrden[clave] ?? 800 + Math.floor(r() * 400)) + ofertadas * 3;
        return {
          bolsaId: b.id,
          provincia: p,
          plazasOfertadas: ofertadas,
          plazasAdjudicadas: ofertadas - noCubiertas,
          plazasNoCubiertas: noCubiertas,
          ultimoOrdenConvocado: ultimoOrden[clave],
        };
      }),
    );
    return {
      id: `ej-${i}`,
      comunidad: 'AND',
      titulo: `Convocatoria de ejemplo del ${f.toLocaleDateString('es-ES')}`,
      fechaConvocatoria: iso(f),
      fechaAdjudicacion: iso(adj),
      fechaIncorporacion: iso(inc),
      resumen,
      fuente: URL_SIPRI,
      esEjemplo: true,
    };
  });

  const eventos: EventoCalendario[] = [];
  convocatorias.slice(-4).forEach((c) => {
    eventos.push({ fecha: c.fechaConvocatoria, titulo: 'Convocatoria SIPRI', tipo: 'convocatoria', esEjemplo: true });
    if (c.fechaAdjudicacion)
      eventos.push({ fecha: c.fechaAdjudicacion, titulo: 'Publicación de adjudicaciones', tipo: 'adjudicacion', esEjemplo: true });
    if (c.fechaIncorporacion)
      eventos.push({ fecha: c.fechaIncorporacion, titulo: 'Incorporación a centros', tipo: 'incorporacion', esEjemplo: true });
  });
  // Próximas convocatorias (martes y jueves de las dos semanas siguientes)
  const d = new Date(hoy);
  for (let k = 1; k <= 14; k++) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() === 2 || d.getDay() === 4)
      eventos.push({ fecha: iso(d), titulo: 'Convocatoria SIPRI (habitual)', tipo: 'convocatoria', esEjemplo: true });
  }

  return { actualizado: hoy.toISOString(), esEjemplo: true, convocatorias, eventos };
}
