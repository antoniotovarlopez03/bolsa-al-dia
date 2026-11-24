// Pruebas del robot con datos INVENTADOS (no reales). Ejecutar: npm run test:robot
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  comprobarSinDatosPersonales, fechaDeTitulo, mismaSeccion, resumirConvocados, resumirPlazas, separarPuesto, titulosConvocatoria,
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
  assert.deepEqual(r['00597038'], { convocados: 2, ordenMin: 575, ordenMax: 790 });
  assert.deepEqual(r['00590011'], { convocados: 1, ordenMin: 12, ordenMax: 12 });
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

test('detecta un campo personal y aborta', () => {
  assert.throws(() => comprobarSinDatosPersonales({ filas: [{ apellidoNombreNif: 'x' }] }));
});

test('compara secciones ignorando la hora de lectura', () => {
  assert.ok(mismaSeccion({ leido: 'a', total: 1 }, { leido: 'b', total: 1 }));
  assert.ok(!mismaSeccion({ leido: 'a', total: 1 }, { leido: 'a', total: 2 }));
});
