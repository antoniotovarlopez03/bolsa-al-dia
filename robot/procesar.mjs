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

/** Opciones del desplegable "Puesto" de la página → { codigo: nombre }. */
export function puestosDelDesplegable(html) {
  const res = {};
  for (const m of html.matchAll(/<option[^>]*value="([0-9A-Z]{8})"[^>]*>([^<]+)/g)) {
    const { nombre } = separarPuesto(m[2].includes(' - ') ? m[2] : `${m[1]} - ${m[2]}`);
    res[m[1]] = nombre;
  }
  return res;
}

/** "00597038 - EDUCACIÓN PRIMARIA" → { codigo, nombre } */
export function separarPuesto(texto) {
  // Códigos de 8 caracteres; algunos llevan letras (p. ej. ZT597038 = Zona de Transformación Social).
  const m = /^\s*([0-9A-Z]{8})\s*-\s*(.+?)\s*$/.exec(texto ?? '');
  return m ? { codigo: m[1], nombre: m[2].replace(/\s+/g, ' ') } : { codigo: 'desconocido', nombre: String(texto ?? '').trim() };
}

const n = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

/**
 * Convocados → por puesto: cuántos, rango y lista de NÚMEROS de orden en bolsa (sin nombres).
 * La lista permite a cada docente comprobar en su móvil si su número está convocado.
 */
export function resumirConvocados(filas, puestos = {}) {
  const res = {};
  for (const f of filas) {
    const { codigo, nombre } = separarPuesto(f.puesto);
    puestos[codigo] ??= nombre;
    const orden = Number(f.orden);
    const r = (res[codigo] ??= { convocados: 0, ordenMin: null, ordenMax: null, ordenes: [] });
    r.convocados++;
    if (Number.isFinite(orden)) {
      r.ordenMin = r.ordenMin === null ? orden : Math.min(r.ordenMin, orden);
      r.ordenMax = r.ordenMax === null ? orden : Math.max(r.ordenMax, orden);
      r.ordenes.push(orden);
    }
  }
  for (const r of Object.values(res)) r.ordenes = [...new Set(r.ordenes)].sort((a, b) => a - b);
  return ordenarClaves(res);
}

/** Notas informativas de la portada de SIPRI (texto general, sin datos personales). */
export function novedadesDePortada(html) {
  const notas = [];
  for (const m of html.matchAll(/<article[^>]*>([\s\S]*?)<\/article>/gi)) {
    const bloque = m[1];
    const h1 = bloque.match(/<h1[^>]*>([\s\S]*?)<time/i)?.[1];
    const fecha = bloque.match(/<time[^>]*datetime="([^"]+)"/i)?.[1];
    if (!h1 || !fecha) continue;
    const limpiar = (s) => s.replace(/<br\s*\/?>|<\/p>/gi, '\n').replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/[ \t]+/g, ' ').replace(/\s*\n\s*/g, '\n').trim();
    const seccion = bloque.match(/<section[^>]*>([\s\S]*?)<\/section>/i)?.[1] ?? '';
    let cuerpo = limpiar(seccion).replace(/\n?Normativa \| Plazas \| Convocados.*$/s, '').trim();
    if (NIF.test(cuerpo)) cuerpo = ''; // precaución: nunca publicar algo que parezca un NIF
    const enlaces = [...seccion.matchAll(/href="(https:\/\/[^"]*juntadeandalucia\.es[^"]*)"/gi)].map((e) => e[1]);
    const iso = fecha.replace(' ', 'T').replace(/\.\d+$/, '');
    notas.push({
      id: `${iso}|${limpiar(h1).slice(0, 60)}`,
      fecha: iso,
      titulo: limpiar(h1),
      texto: cuerpo.slice(0, 1500),
      enlaces: [...new Set(enlaces)].slice(0, 5),
    });
  }
  return notas;
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

const NIF = /\b\d{8}[A-Z]\b|\b[XYZ]\d{7}[A-Z]\b/i;
const coord = (v) => {
  const x = Number(String(v ?? '').replace(',', '.'));
  return Number.isFinite(x) && x !== 0 ? Math.round(x * 1e5) / 1e5 : undefined;
};
const texto = (v, max = 80) => {
  const t = String(v ?? '').replace(/\s+/g, ' ').trim();
  return t && !NIF.test(t) ? t.slice(0, max) : undefined;
};

/**
 * Detalle de cada plaza (no contiene personas). Lista blanca de campos:
 * plazas / noCubiertas usan `provincia`; adjudicados usa `dProvincia`/`dLocalidad` y trae un nombre que se IGNORA.
 */
export function detallePlazas(filas, listado) {
  const adj = listado === 'adjudicados';
  return filas
    .map((f) => {
      const d = {
        id: f.idPlaza,
        puesto: separarPuesto(f.puesto).codigo,
        centro: texto(f.centro, 120),
        localidad: texto(adj ? f.dLocalidad : f.localidad),
        provincia: texto(adj ? f.dProvincia : f.provincia),
        tipo: texto(f.tipo, 30),
        n: f.numPla === undefined ? 1 : n(f.numPla),
        part: texto(f.participacion, 5),
        cese: texto(f.fFinAus, 10),
        lat: coord(f.latitud),
        lon: coord(f.longitud),
        motivo: listado === 'noCubiertas' ? texto(f.observaciones) : undefined,
        // Observaciones de la plaza (p. ej. jornada parcial). Se descartan si parecen contener un NIF.
        obs: listado === 'plazas' ? texto(f.observaciones, 160) : undefined,
      };
      return Object.fromEntries(Object.entries(d).filter(([, v]) => v !== undefined && v !== null));
    })
    .sort((a, b) => String(a.puesto).localeCompare(String(b.puesto)) || String(a.provincia).localeCompare(String(b.provincia)) || (a.id ?? 0) - (b.id ?? 0));
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
