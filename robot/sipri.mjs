#!/usr/bin/env node
// ROBOT DE BOLSA AL DÍA — lee los listados PÚBLICOS de SIPRI y guarda solo cifras.
// - Pocas peticiones, con pausa entre ellas y límite máximo por ejecución.
// - Descarta nombres/NIF al leer (lista blanca de campos en procesar.mjs).
// - No escribe nada si los datos no han cambiado.
// Uso: node robot/sipri.mjs [--salida public/datos]

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  comprobarSinDatosPersonales, fechaDeTitulo, mismaSeccion, resumirConvocados, resumirPlazas, titulosConvocatoria,
} from './procesar.mjs';

const BASE = 'https://sipri.juntadeandalucia.es/sipri/';
const UA = 'Mozilla/5.0 (compatible; BolsaAlDia-robot/0.1; herramienta informativa gratuita y sin anuncios)';
const PAUSA_MS = 2000;
const MAX_PETICIONES = 40; // tope duro por ejecución
const POR_PAGINA = 1000;
const MAX_PAGINAS = 10; // 10.000 filas como máximo por listado

const args = process.argv.slice(2);
const SALIDA = join(args.includes('--salida') ? args[args.indexOf('--salida') + 1] : 'public/datos', 'and');

let peticiones = 0;
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

async function pedir(url, opciones = {}) {
  if (++peticiones > MAX_PETICIONES) throw new Error(`Superado el máximo de ${MAX_PETICIONES} peticiones. Parado por seguridad.`);
  if (peticiones > 1) await espera(PAUSA_MS);
  const r = await fetch(url, { ...opciones, headers: { 'User-Agent': UA, ...opciones.headers }, signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error(`${url} respondió ${r.status}`);
  return r;
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
  const titulos = titulosConvocatoria(html);
  if (!titulos.length) {
    if (/No hay (lista|convocatorias?)[^<]*publicad/i.test(html)) return [];
    throw new Error(`${l.id}: no se encuentra el título de la convocatoria. ¿Ha cambiado la web de SIPRI?`);
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
      // Las filas originales (con nombres) se descartan aquí: solo sigue el resumen.
      c.filas.length = 0;
      if (mismaSeccion(doc.secciones[l.id], seccion)) { console.log(`= ${l.id} ${c.fecha}: sin cambios`); continue; }
      doc.secciones[l.id] = seccion;
      cambiadas.add(ruta);
      console.log(`✔ ${l.id} ${c.fecha}: ${seccion.total} filas resumidas`);
    }
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

  if (cambiadas.size) {
    indice.actualizado = ahora;
    indice.puestos = Object.fromEntries(Object.entries(puestos).sort(([a], [b]) => a.localeCompare(b)));
    comprobarSinDatosPersonales(indice);
    await writeFile(rutaIndice, JSON.stringify(indice, null, 1) + '\n');
  }
  console.log(`\nPeticiones a SIPRI: ${peticiones}. Ficheros actualizados: ${cambiadas.size}.`);
}

main().catch((e) => {
  console.error('❌ Robot detenido:', e.message);
  process.exit(1);
});
