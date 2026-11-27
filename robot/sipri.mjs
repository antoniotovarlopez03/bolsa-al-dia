#!/usr/bin/env node
// ROBOT DE BOLSA AL DÍA — lee los listados PÚBLICOS de SIPRI y guarda solo cifras.
// - Pocas peticiones, con pausa entre ellas y límite máximo por ejecución.
// - Descarta nombres/NIF al leer (lista blanca de campos en procesar.mjs).
// - No escribe nada si los datos no han cambiado.
// Uso: node robot/sipri.mjs [--salida public/datos]

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  comprobarSinDatosPersonales, detallePlazas, fechaDeTitulo, mismaSeccion, novedadesDePortada, puestosDelDesplegable,
  resumirConvocados, resumirPlazas,
  titulosConvocatoria,
} from './procesar.mjs';

/** Catálogo de especialidades visto en los desplegables oficiales (se rellena al leer). */
const puestosDesplegables = {};
/** Páginas sin título de convocatoria en esta ejecución. */
const paginasSinTitulo = [];

const BASE = 'https://sipri.juntadeandalucia.es/sipri/';
const UA = 'Mozilla/5.0 (compatible; BolsaSur-robot/0.2; herramienta informativa gratuita y sin anuncios)';
const PAUSA_MS = 2000;
const MAX_PETICIONES = 40; // tope duro por ejecución
const POR_PAGINA = 1000;
const MAX_PAGINAS = 10; // 10.000 filas como máximo por listado

const args = process.argv.slice(2);
const SALIDA = join(args.includes('--salida') ? args[args.indexOf('--salida') + 1] : 'public/datos', 'and');

let peticiones = 0;
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

async function pedir(url, opciones = {}, intento = 1) {
  if (++peticiones > MAX_PETICIONES) throw new Error(`Superado el máximo de ${MAX_PETICIONES} peticiones. Parado por seguridad.`);
  if (peticiones > 1) await espera(PAUSA_MS);
  try {
    const r = await fetch(url, { ...opciones, headers: { 'User-Agent': UA, ...opciones.headers }, signal: AbortSignal.timeout(30000) });
    if (!r.ok) throw new Error(`${url} respondió ${r.status}`);
    return r;
  } catch (e) {
    // Un único reintento tras 20 s (cortes puntuales de red o del servidor).
    if (intento < 2) {
      console.warn(`⚠️ Fallo en ${url} (${causa(e)}). Reintento en 20 s…`);
      await espera(20000);
      return pedir(url, opciones, intento + 1);
    }
    throw new Error(`${url}: ${causa(e)}`);
  }
}

/** Mensaje legible de un error de red (fetch esconde la causa real en e.cause). */
function causa(e) {
  return [e?.message, e?.cause?.code, e?.cause?.message].filter(Boolean).join(' · ');
}

const LISTADOS = [
  { id: 'convocados', pagina: 'convocados/convocados', datos: 'convocados/buscar', filtros: { puesto: '', nif: '' } },
  { id: 'plazas', pagina: 'plazas/plaza', datos: 'plazas/buscar',
    filtros: { cuerpo: '', puesto: '', participacion: '', tipo: '', provincia: '', municipio: '', localidad: '' } },
  { id: 'adjudicados', pagina: 'adjudicaciones/adjudicacion', datos: 'adjudicaciones/buscar',
    filtros: { cuerpo: '', puesto: '', provincia: '', nif: '', estado: '' } },
  { id: 'noCubiertas', pagina: 'adjudicaciones/nocubiertas', datos: 'adjudicaciones/buscarNoCubiertas',
    filtros: { cuerpo: '', puesto: '', participacion: '', tipo: '', provincia: '', municipio: '', localidad: '' } },
];

/** Lee un listado completo. Devuelve [{ titulo, fecha, filas }] (una entrada por convocatoria de la página). */
async function leerListado(l) {
  const r = await pedir(BASE + l.pagina);
  const cookie = (r.headers.getSetCookie?.() ?? []).map((c) => c.split(';')[0]).join('; ');
  const html = await r.text();
  Object.assign(puestosDesplegables, puestosDelDesplegable(html));
  const titulos = titulosConvocatoria(html);
  if (!titulos.length) {
    // Entre convocatoria y adjudicación, SIPRI muestra mensajes variables ("No hay…", etc.).
    // No es un error: se anota el texto visible (sin datos personales, la tabla está vacía) y se sigue.
    const visible = (html.match(/<main[\s\S]*?<\/main>|<body[\s\S]*<\/body>/i)?.[0] ?? html)
      .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    const aviso = visible.match(/(No hay|No existe|no se ha publicado|pendiente)[^.]{0,120}/i)?.[0];
    console.log(`· ${l.id}: sin convocatoria publicada${aviso ? ` («${aviso.trim()}»)` : ''}`);
    paginasSinTitulo.push({ id: l.id, reconocido: Boolean(aviso) });
    return [];
  }
  const res = [];
  for (let pos = 0; pos < titulos.length; pos++) {
    const filas = [];
    let total = 0;
    for (let pag = 0; pag < MAX_PAGINAS; pag++) {
      const resp = await pedir(BASE + l.datos, {
        method: 'POST',
        headers: {
          Cookie: cookie, Referer: BASE + l.pagina, 'X-Requested-With': 'XMLHttpRequest',
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        },
        body: new URLSearchParams({ pos: String(pos), offset: String(pag * POR_PAGINA), limit: String(POR_PAGINA), sort: '', order: 'asc', ...l.filtros }),
      });
      const j = await resp.json();
      total = Number(j.total) || 0;
      filas.push(...(j.rows ?? []));
      if (filas.length >= total || !(j.rows ?? []).length) break;
    }
    if (filas.length !== total)
      throw new Error(`${l.id}: se esperaban ${total} filas y se leyeron ${filas.length}. Datos incompletos, no se guarda nada.`);
    res.push({ titulo: titulos[pos], fecha: fechaDeTitulo(titulos[pos]), filas });
  }
  return res;
}

async function leerJSON(ruta, defecto) {
  try { return JSON.parse(await readFile(ruta, 'utf8')); } catch { return defecto; }
}

async function main() {
  await mkdir(join(SALIDA, 'convocatorias'), { recursive: true });
  const rutaIndice = join(SALIDA, 'indice.json');
  const indice = await leerJSON(rutaIndice, { comunidad: 'AND', fuente: BASE, convocatorias: [], puestos: {} });
  const puestos = indice.puestos ?? {};
  const ahora = new Date().toISOString();
  const cambiadas = new Set();
  const detallesCambiados = new Set();
  const ficheros = new Map();

  for (const l of LISTADOS) {
    const convocatorias = await leerListado(l);
    for (const c of convocatorias) {
      if (!c.fecha) { console.warn(`⚠️ ${l.id}: título sin fecha reconocible: ${c.titulo}`); continue; }
      if (!c.filas.length) { console.log(`· ${l.id} ${c.fecha}: sin filas (aún no publicado)`); continue; }
      const ruta = join(SALIDA, 'convocatorias', `${c.fecha}.json`);
      const doc = ficheros.get(ruta) ?? (await leerJSON(ruta, {
        id: c.fecha, comunidad: 'AND', fecha: c.fecha, titulo: c.titulo, fuente: BASE, esEjemplo: false, secciones: {},
      }));
      ficheros.set(ruta, doc);
      const seccion = l.id === 'convocados'
        ? { leido: ahora, total: c.filas.length, porPuesto: resumirConvocados(c.filas, puestos) }
        : { leido: ahora, total: c.filas.length, filas: resumirPlazas(c.filas, puestos, l.id === 'adjudicados' ? 'dProvincia' : 'provincia') };

      // Detalle de cada plaza (sin personas) en un fichero aparte: la app solo lo descarga al abrirlo.
      if (l.id !== 'convocados') {
        const rutaDet = join(SALIDA, 'convocatorias', `${c.fecha}.plazas.json`);
        const det = ficheros.get(rutaDet) ?? (await leerJSON(rutaDet, { id: c.fecha, fecha: c.fecha, secciones: {} }));
        ficheros.set(rutaDet, det);
        const nueva = { leido: ahora, filas: detallePlazas(c.filas, l.id) };
        if (!mismaSeccion(det.secciones[l.id], nueva)) {
          det.secciones[l.id] = nueva;
          detallesCambiados.add(rutaDet);
        }
      }
      // Las filas originales (con nombres) se descartan aquí: solo siguen el resumen y el detalle sin personas.
      c.filas.length = 0;
      if (mismaSeccion(doc.secciones[l.id], seccion)) { console.log(`= ${l.id} ${c.fecha}: sin cambios`); continue; }
      doc.secciones[l.id] = seccion;
      cambiadas.add(ruta);
      console.log(`✔ ${l.id} ${c.fecha}: ${seccion.total} filas resumidas`);
    }
  }

  // Si NINGUNA página tiene convocatoria ni un mensaje reconocible, probablemente ha cambiado la web.
  if (paginasSinTitulo.length === LISTADOS.length && !paginasSinTitulo.some((p) => p.reconocido))
    throw new Error('Ninguna página de SIPRI muestra convocatorias ni un aviso reconocible. ¿Ha cambiado la web?');

  for (const ruta of detallesCambiados) {
    const det = ficheros.get(ruta);
    comprobarSinDatosPersonales(det);
    await writeFile(ruta, JSON.stringify(det) + '\n');
    console.log(`✔ detalle de plazas: ${ruta}`);
  }

  for (const ruta of cambiadas) {
    const doc = ficheros.get(ruta);
    comprobarSinDatosPersonales(doc);
    await writeFile(ruta, JSON.stringify(doc, null, 1) + '\n');
    const s = doc.secciones;
    const entrada = {
      id: doc.id, fecha: doc.fecha,
      totales: {
        convocados: s.convocados?.total ?? null,
        plazas: s.plazas?.filas.reduce((a, f) => a + f.plazas, 0) ?? null,
        adjudicados: s.adjudicados?.total ?? null,
        noCubiertas: s.noCubiertas?.filas.reduce((a, f) => a + f.plazas, 0) ?? null,
      },
    };
    indice.convocatorias = [...indice.convocatorias.filter((c) => c.id !== doc.id), entrada].sort((a, b) => a.fecha.localeCompare(b.fecha));
  }

  // Notas informativas de la portada (una petición). Si falla, no se detiene el robot.
  try {
    const html = await (await pedir(BASE + 'inicio/')).text();
    const nuevas = novedadesDePortada(html);
    const rutaNov = join(SALIDA, 'novedades.json');
    const previo = await leerJSON(rutaNov, { notas: [] });
    const mapa = new Map([...previo.notas, ...nuevas].map((n) => [n.id, n]));
    const notas = [...mapa.values()].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 40);
    if (JSON.stringify(notas) !== JSON.stringify(previo.notas)) {
      const doc = { actualizado: ahora, fuente: BASE, notas };
      comprobarSinDatosPersonales(doc);
      await writeFile(rutaNov, JSON.stringify(doc, null, 1) + '\n');
      console.log(`✔ novedades: ${notas.length} notas (${nuevas.length} en portada)`);
    } else console.log('= novedades: sin cambios');
  } catch (e) {
    console.warn(`⚠️ No se pudieron leer las novedades: ${e.message}`);
  }

  // Se compara el contenido sin depender del orden: JavaScript reordena las claves que parecen números.
  const firma = (o) => JSON.stringify(Object.entries(o ?? {}).sort(([a], [b]) => a.localeCompare(b)));
  const nuevosPuestos = Object.fromEntries(
    Object.entries({ ...puestos, ...puestosDesplegables })
      .filter(([c]) => /^[0-9A-Z]{6,10}$/.test(c))
      .sort(([a], [b]) => a.localeCompare(b)),
  );
  const puestosCambiados = Object.keys(nuevosPuestos).filter((c) => nuevosPuestos[c] !== indice.puestos?.[c]);
  if (firma(nuevosPuestos) !== firma(indice.puestos))
    console.log(`✔ catálogo: ${puestosCambiados.length} especialidades nuevas o renombradas (${puestosCambiados.slice(0, 5).join(', ')})`);
  if (cambiadas.size || firma(nuevosPuestos) !== firma(indice.puestos)) {
    indice.actualizado = ahora;
    indice.puestos = nuevosPuestos;
    comprobarSinDatosPersonales(indice);
    await writeFile(rutaIndice, JSON.stringify(indice, null, 1) + '\n');
  }
  console.log(`\nPeticiones a SIPRI: ${peticiones}. Resúmenes actualizados: ${cambiadas.size}. Detalles actualizados: ${detallesCambiados.size}.`);
}

main().catch((e) => {
  console.error('❌ Robot detenido:', e.message);
  // En GitHub Actions, el error queda como anotación visible en la página de la ejecución.
  if (process.env.GITHUB_ACTIONS) console.log(`::error title=Robot SIPRI::${String(e.message).replace(/\r?\n/g, ' ')}`);
  process.exit(1);
});
