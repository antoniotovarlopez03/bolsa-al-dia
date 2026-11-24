import type { Convocatoria, EventoCalendario, RegistroPosicion } from './datos/tipos';

export const hoyISO = () => new Date().toISOString().slice(0, 10);

export function fechaLarga(iso: string) {
  return new Date(iso + (iso.length === 10 ? 'T12:00:00' : '')).toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

export function fechaCorta(iso: string) {
  return new Date(iso + (iso.length === 10 ? 'T12:00:00' : '')).toLocaleDateString('es-ES', {
    day: '2-digit', month: '2-digit', year: '2-digit',
  });
}

export const num = (n?: number) => (n === undefined ? '—' : n.toLocaleString('es-ES'));

export function saludo() {
  const h = new Date().getHours();
  return h < 14 ? 'Buenos días' : h < 21 ? 'Buenas tardes' : 'Buenas noches';
}

/** Últimos dos registros que tengan el campo indicado. */
export function ultimosDos(regs: RegistroPosicion[], campo: 'ordenEnBolsa' | 'situacionTiempoReal') {
  const v = regs.filter((r) => r[campo] !== undefined).sort((a, b) => a.fecha.localeCompare(b.fecha));
  return { actual: v.at(-1), anterior: v.at(-2) };
}

/** Totales de una convocatoria para unas bolsas y provincias. */
export function totales(c: Convocatoria, bolsaIds?: string[], provincias?: string[]) {
  const filas = c.resumen.filter(
    (r) => (!bolsaIds || bolsaIds.includes(r.bolsaId)) && (!provincias?.length || provincias.includes(r.provincia)),
  );
  return {
    ofertadas: filas.reduce((s, r) => s + r.plazasOfertadas, 0),
    adjudicadas: filas.reduce((s, r) => s + r.plazasAdjudicadas, 0),
    noCubiertas: filas.reduce((s, r) => s + r.plazasNoCubiertas, 0),
    filas,
  };
}

/** Exporta eventos a un archivo .ics (Google Calendar, Apple, Outlook). */
export function descargarICS(eventos: EventoCalendario[]) {
  const lineas = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//BOLSA AL DIA//ES'];
  eventos.forEach((e, i) => {
    const d = e.fecha.replace(/-/g, '');
    lineas.push(
      'BEGIN:VEVENT',
      `UID:${d}-${i}@bolsa-al-dia`,
      `DTSTART;VALUE=DATE:${d}`,
      `SUMMARY:${e.esEjemplo ? '[EJEMPLO] ' : ''}${e.titulo}`,
      'END:VEVENT',
    );
  });
  lineas.push('END:VCALENDAR');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([lineas.join('\r\n')], { type: 'text/calendar' }));
  a.download = 'bolsa-al-dia-calendario.ics';
  a.click();
  URL.revokeObjectURL(a.href);
}
