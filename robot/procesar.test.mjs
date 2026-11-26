// Pruebas del robot con datos INVENTADOS (no reales). Ejecutar: npm run test:robot
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  comprobarSinDatosPersonales, detallePlazas, fechaDeTitulo, mismaSeccion, novedadesDePortada, puestosDelDesplegable, resumirConvocados, resumirPlazas, separarPuesto,
  titulosConvocatoria,
} from './procesar.mjs';

test('extrae la fecha del título de la convocatoria', () => {
  assert.equal(fechaDeTitulo('CONVOCATORIA DE PROVISIÓN DE VACANTES Y SUSTITUCIONES DE 24 DE NOVIEMBRE DE 2026'), '2026-11-24');
  assert.equal(fechaDeTitulo('... DE 3 DE MARZO DE 2027'), '2027-03-03');
  assert.equal(fechaDeTitulo('sin fecha'), null);
});

test('encuentra los títulos en el HTML', () => {
  const html = '<h3>Personal convocado</h3><a>CONVOCATORIA DE PROVISIÓN DE VACANTES Y SUSTITUCIONES DE\n 19 DE NOVIEMBRE DE 2026</a>';
  assert.equal(titulosConvocatoria(html).length, 1);
});

test('lee las especialidades del desplegable', () => {
  const html = '<select id="puesto"><option value="">Seleccionar puesto...</option><option value="00597038">00597038 - EDUCACIÓN PRIMARIA</option><option value="11590006" >MATEMATICAS (INGLES) P.E.S.</option></select>';
  assert.deepEqual(puestosDelDesplegable(html), { '00597038': 'EDUCACIÓN PRIMARIA', '11590006': 'MATEMATICAS (INGLES) P.E.S.' });
});

test('separa código y nombre del puesto', () => {
  assert.deepEqual(separarPuesto('00597038 - EDUCACIÓN PRIMARIA'), { codigo: '00597038', nombre: 'EDUCACIÓN PRIMARIA' });
});

test('resume convocados por puesto SIN guardar nombres', () => {
  const filas = [
    { orden: 575, apellidoNombreNif: 'PERSONA INVENTADA, UNA 00000000T', puesto: '00597038 - EDUCACIÓN PRIMARIA' },
    { orden: 790, apellidoNombreNif: 'PERSONA INVENTADA, DOS 00000001R', puesto: '00597038 - EDUCACIÓN PRIMARIA' },
    { orden: 12, apellidoNombreNif: 'PERSONA INVENTADA, TRES 00000002W', puesto: '00590011 - INGLES P.E.S.' },
  ];
  const puestos = {};
  const r = resumirConvocados(filas, puestos);
  assert.deepEqual(r['00597038'], { convocados: 2, ordenMin: 575, ordenMax: 790, ordenes: [575, 790] });
  assert.deepEqual(r['00590011'], { convocados: 1, ordenMin: 12, ordenMax: 12, ordenes: [12] });
  assert.equal(puestos['00590011'], 'INGLES P.E.S.');
  assert.ok(!JSON.stringify(r).includes('INVENTADA'));
  assert.ok(comprobarSinDatosPersonales(r));
});

test('resume plazas por puesto y provincia sumando numPla', () => {
  const filas = [
    { puesto: '00590011 - INGLES P.E.S.', provincia: 'Sevilla', numPla: 1, tipo: 'Sustitución', participacion: 'O' },
    { puesto: '00590011 - INGLES P.E.S.', provincia: 'Sevilla', numPla: 2, tipo: 'Vacante', participacion: 'V' },
    { puesto: '00590011 - INGLES P.E.S.', provincia: 'Cádiz', numPla: 1, tipo: 'Sustitución', participacion: 'O' },
  ];
  const r = resumirPlazas(filas);
  assert.equal(r.length, 2);
  const sev = r.find((f) => f.provincia === 'Sevilla');
  assert.equal(sev.plazas, 3);
  assert.deepEqual(sev.porTipo, { Sustitución: 1, Vacante: 2 });
});

test('adjudicados: no copia el nombre aunque venga en la fila', () => {
  const r = resumirPlazas([{ puesto: '00597035 - MÚSICA', dProvincia: 'Sevilla', apellidosNombreDni: 'X' }], {}, 'dProvincia');
  assert.deepEqual(r, [{ puesto: '00597035', provincia: 'Sevilla', plazas: 1, porTipo: {}, porParticipacion: {} }]);
});

test('detalle de plazas: solo campos permitidos y coordenadas numéricas', () => {
  const [d] = detallePlazas([{
    idPlaza: 1, idClave: 9, centro: '41000000 - I.E.S. Inventado', provincia: 'Sevilla', localidad: 'Sevilla',
    puesto: '00590011 - INGLES P.E.S.', fFinAus: '2027-01-26', tipo: 'Sustitución', numPla: 1, participacion: 'O',
    observaciones: null, latitud: '37,3891', longitud: '-5,9845',
  }], 'plazas');
  assert.deepEqual(d, {
    id: 1, puesto: '00590011', centro: '41000000 - I.E.S. Inventado', localidad: 'Sevilla', provincia: 'Sevilla',
    tipo: 'Sustitución', n: 1, part: 'O', cese: '2027-01-26', lat: 37.3891, lon: -5.9845,
  });
});

test('detalle de adjudicados: nunca copia el nombre', () => {
  const r = detallePlazas([{
    orden: 1, apellidosNombreDni: 'PERSONA INVENTADA 00000000T', idPlaza: 7, centro: 'C.E.I.P. Inventado',
    puesto: '00597035 - MÚSICA', participacion: 'N', dLocalidad: 'Huelva', dProvincia: 'Huelva',
  }], 'adjudicados');
  assert.ok(!JSON.stringify(r).includes('INVENTADA 0'));
  assert.equal(r[0].provincia, 'Huelva');
  assert.ok(comprobarSinDatosPersonales(r));
});

test('detalle: descarta textos que parezcan un NIF', () => {
  const [d] = detallePlazas([{ idPlaza: 2, puesto: '00590011 - X', provincia: 'Cádiz', observaciones: 'Renuncia 00000000T' }], 'noCubiertas');
  assert.equal(d.motivo, undefined);
});

test('lee las notas informativas de la portada', () => {
  const html = `<article class="media media-body">
    <h1 class="media-heading">NOTA INFORMATIVA PRÓXIMAS CONVOCATORIAS
      <time datetime="2026-11-26 14:00:00.0"><small> jueves 26 noviembre 2026 14:00</small></time></h1>
    <section><p align="justify">Se informa de que la próxima semana habrá una única convocatoria, el jueves 3 de diciembre.</p>
    <p><a href="https://www.juntadeandalucia.es/educacion/sipri/normativa/normativa">Normativa</a> | <a href="https://x.juntadeandalucia.es/p">Plazas</a> | Convocados</p></section>
  </article>`;
  const [n] = novedadesDePortada(html);
  assert.equal(n.titulo, 'NOTA INFORMATIVA PRÓXIMAS CONVOCATORIAS');
  assert.equal(n.fecha, '2026-11-26T14:00:00');
  assert.ok(n.texto.startsWith('Se informa'));
  assert.ok(!n.texto.includes('Normativa | Plazas'));
  assert.equal(n.enlaces.length, 2);
});

test('detalle de plazas: guarda observaciones (jornada parcial)', () => {
  const [d] = detallePlazas([{ idPlaza: 3, puesto: '00590011 - X', provincia: 'Cádiz', observaciones: 'Media jornada' }], 'plazas');
  assert.equal(d.obs, 'Media jornada');
});

test('detecta un campo personal y aborta', () => {
  assert.throws(() => comprobarSinDatosPersonales({ filas: [{ apellidoNombreNif: 'x' }] }));
});

test('compara secciones ignorando la hora de lectura', () => {
  assert.ok(mismaSeccion({ leido: 'a', total: 1 }, { leido: 'b', total: 1 }));
  assert.ok(!mismaSeccion({ leido: 'a', total: 1 }, { leido: 'a', total: 2 }));
});
