import type { Bolsa, Convocatoria, FilaPlazas, Indice, NotaSipri, RegistroPosicion } from './datos/tipos';

/** Todo lo que las pantallas necesitan de los datos públicos. */
export interface Datos {
  indice: Indice;
  convocatorias: Convocatoria[]; // ordenadas por fecha, de antigua a reciente
  novedades: NotaSipri[]; // notas de la portada de SIPRI, de reciente a antigua
  catalogo: Bolsa[];
  bolsa: (id: string) => Bolsa | undefined;
}

export const hoyISO = () => new Date().toISOString().slice(0, 10);
const aFecha = (iso: string) => new Date(iso + (iso.length === 10 ? 'T12:00:00' : ''));

export const fechaLarga = (iso: string) =>
  aFecha(iso).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
export const fechaCorta = (iso: string) =>
  aFecha(iso).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
export const fechaHora = (iso: string) =>
  new Date(iso).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export const num = (n?: number | null) => (n === undefined || n === null ? '—' : n.toLocaleString('es-ES'));

export function saludo() {
  const h = new Date().getHours();
  return h < 14 ? 'Buenos días' : h < 21 ? 'Buenas tardes' : 'Buenas noches';
}

/** Días transcurridos desde una fecha ISO. */
export const diasDesde = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);

/** Quita tildes y pasa a minúsculas para buscar ("ingles" encuentra "Inglés"). */
export const normalizar = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export type LectorValor = (r: RegistroPosicion) => number | undefined;

export const valorOrden: LectorValor = (r) => r.ordenEnBolsa;
/** Situación principal: la de "tras la última adjudicación" (la que SIPRI da con incorporaciones); si no, tiempo real. */
export const valorSituacion: LectorValor = (r) => r.situacionTrasAdjudicacion ?? r.situacionTiempoReal;
export const valorProvincia = (p: string): LectorValor => (r) => r.porProvincia?.[p as keyof typeof r.porProvincia];

/** Último y penúltimo valor apuntados (y la fecha del último). */
export function ultimosDos(regs: RegistroPosicion[], valor: LectorValor) {
  const v = regs.filter((r) => valor(r) !== undefined).sort((a, b) => a.fecha.localeCompare(b.fecha));
  const a = v.at(-1), b = v.at(-2);
  return { actual: a && valor(a), anterior: b && valor(b), fecha: a?.fecha };
}

/** Serie temporal de un valor, para las gráficas. */
export function serie(regs: RegistroPosicion[], valor: LectorValor) {
  return regs
    .filter((r) => valor(r) !== undefined)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map((r) => ({ etiqueta: fechaCorta(r.fecha), valor: valor(r)! }));
}

/** Suma plazas de unas filas, filtrando por especialidades y provincias (vacío = todas). */
export function sumarPlazas(filas: FilaPlazas[] | undefined, puestos?: string[], provincias?: string[]) {
  const f = (filas ?? []).filter(
    (r) => (!puestos?.length || puestos.includes(r.puesto)) && (!provincias?.length || provincias.includes(r.provincia)),
  );
  return { plazas: f.reduce((s, r) => s + r.plazas, 0), filas: f };
}

/** Convocatoria más reciente que tenga publicada la sección indicada. */
export function ultimaCon(convs: Convocatoria[], seccion: keyof Convocatoria['secciones']) {
  return [...convs].reverse().find((c) => c.secciones[seccion]);
}

export const puestoDe = (bolsaId: string) => bolsaId.replace(/^AND-/, '');

export interface EventoCalendario {
  fecha: string;
  titulo: string;
  tipo: 'convocatoria' | 'adjudicacion' | 'habitual';
}

/** Exporta eventos a un archivo .ics (Google Calendar, Apple, Outlook). */
export function descargarICS(eventos: EventoCalendario[]) {
  const lineas = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//BOLSA AL DIA//ES'];
  eventos.forEach((e, i) => {
    const d = e.fecha.replace(/-/g, '');
    lineas.push('BEGIN:VEVENT', `UID:${d}-${i}@bolsa-al-dia`, `DTSTART;VALUE=DATE:${d}`, `SUMMARY:${e.titulo}`, 'END:VEVENT');
  });
  lineas.push('END:VCALENDAR');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([lineas.join('\r\n')], { type: 'text/calendar' }));
  a.download = 'bolsa-al-dia-calendario.ics';
  a.click();
  URL.revokeObjectURL(a.href);
}
