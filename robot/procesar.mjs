// Funciones puras del robot: convierten filas de SIPRI en CIFRAS sin datos personales.
// Regla de oro: solo se leen los campos de la lista blanca. Nombres, NIF y DNI nunca se copian.

const MESES = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
  julio: 7, agosto: 8, septiembre: 9, setiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
};

/** "…SUSTITUCIONES DE 24 DE NOVIEMBRE DE 2026" → "2026-11-24" (o null). */
export function fechaDeTitulo(titulo) {
  const m = /(\d{1,2})\s+DE\s+([A-ZÁÉÍÓÚa-záéíóú]+)\s+DE\s+(\d{4})/i.exec(titulo ?? '');
  if (!m) return null;
  const mes = MESES[m[2].toLowerCase()];
  if (!mes) return null;
  return `${m[3]}-${String(mes).padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}

/** Títulos de convocatoria que aparecen en la página, en orden (posición 0, 1…). */
export function titulosConvocatoria(html) {
  const texto = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  return [...texto.matchAll(/CONVOCATORIA DE PROVISI[ÓO]N DE VACANTES Y SUSTITUCIONES DE \d{1,2} DE [A-ZÁÉÍÓÚ]+ DE \d{4}/gi)]
    .map((m) => m[0]);
}

/** "00597038 - EDUCACIÓN PRIMARIA" → { codigo, nombre } */
export function separarPuesto(texto) {
  const m = /^\s*(\d{8})\s*-\s*(.+?)\s*$/.exec(texto ?? '');
  return m ? { codigo: m[1], nombre: m[2].replace(/\s+/g, ' ') } : { codigo: 'desconocido', nombre: String(texto ?? '').trim() };
}

const n = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

/** Convocados → por puesto: cuántos y rango de número de orden en bolsa. */
export function resumirConvocados(filas, puestos = {}) {
  const res = {};
  for (const f of filas) {
    const { codigo, nombre } = separarPuesto(f.puesto);
    puestos[codigo] ??= nombre;
    const orden = Number(f.orden);
    const r = (res[codigo] ??= { convocados: 0, ordenMin: null, ordenMax: null });
    r.convocados++;
    if (Number.isFinite(orden)) {
      r.ordenMin = r.ordenMin === null ? orden : Math.min(r.ordenMin, orden);
      r.ordenMax = r.ordenMax === null ? orden : Math.max(r.ordenMax, orden);
    }
  }
  return ordenarClaves(res);
}

/** Plazas (convocadas o no cubiertas) → por puesto y provincia. */
export function resumirPlazas(filas, puestos = {}, campoProvincia = 'provincia') {
  const mapa = new Map();
  for (const f of filas) {
    const { codigo, nombre } = separarPuesto(f.puesto);
    puestos[codigo] ??= nombre;
    const provincia = String(f[campoProvincia] ?? 'Sin provincia').trim();
    const clave = `${codigo}|${provincia}`;
    const r = mapa.get(clave) ?? { puesto: codigo, provincia, plazas: 0, porTipo: {}, porParticipacion: {} };
    const num = f.numPla === undefined ? 1 : n(f.numPla);
    r.plazas += num;
    if (f.tipo) r.porTipo[f.tipo] = (r.porTipo[f.tipo] ?? 0) + num;
    if (f.participacion) r.porParticipacion[f.participacion] = (r.porParticipacion[f.participacion] ?? 0) + num;
    mapa.set(clave, r);
  }
  return [...mapa.values()].sort((a, b) => a.puesto.localeCompare(b.puesto) || a.provincia.localeCompare(b.provincia));
}

function ordenarClaves(o) {
  return Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));
}

/** Comprobación de seguridad: el resultado no puede contener campos personales. */
export function comprobarSinDatosPersonales(obj) {
  const txt = JSON.stringify(obj);
  if (/"[^"]*(nombre|nif|dni|apellid)[^"]*"\s*:/i.test(txt))
    throw new Error('Se ha detectado un campo personal en los datos de salida. Abortado.');
  return true;
}

/** Igualdad de secciones ignorando la hora de lectura. */
export function mismaSeccion(a, b) {
  if (!a || !b) return false;
  const { leido: _a, ...ra } = a;
  const { leido: _b, ...rb } = b;
  return JSON.stringify(ra) === JSON.stringify(rb);
}
