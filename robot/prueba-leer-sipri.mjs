// Prueba del lector de la consulta personal de SIPRI con textos INVENTADOS (como en la captura de la clienta).
// Ejecutar: npm run test:sipri
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'vite';

const { leerConsulta } = await (async () => {
  const r = await build({
    logLevel: 'silent', configFile: false,
    build: { write: false, ssr: 'src/sipri/leer.ts', rollupOptions: { output: { format: 'es' } } },
  });
  const code = r.output[0].code;
  return import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
})();

const tokens = [
  'Bolsa: 00590018 - ORIENTACIÓN EDUCATIVA P.E.S.', '×', 'Tras la última adjudicación',
  'Orden en Bolsa:', '⟦603⟧', 'Sit. tras la última adjudicación:', '⟦37⟧',
  'Situación en Tiempo tras la última adjudicación por provincias:',
  'Almería:', '⟦6⟧', 'Cádiz:', '⟦-⟧', 'Córdoba:', '⟦-⟧', 'Granada:', '⟦9⟧', 'Huelva:', '⟦-⟧', 'Jaén:', '⟦8⟧', 'Málaga:', '⟦-⟧', 'Sevilla:', '⟦-⟧',
];

test('lee orden, situación y provincias de la consulta personal', () => {
  const [b] = leerConsulta(tokens);
  assert.equal(b.puesto, '00590018');
  assert.equal(b.ordenEnBolsa, 603);
  assert.equal(b.situacionTrasAdjudicacion, 37);
  assert.deepEqual(b.porProvincia, { Almería: 6, Granada: 9, Jaén: 8 });
});

test('varias bolsas en la misma página', () => {
  const r = leerConsulta([...tokens, 'Bolsa:', '00590019 - FORMACIÓN Y ORIENTACIÓN LABORAL', 'Orden en Bolsa:', '1.204', 'Situación en tiempo real:', '⟦120⟧']);
  assert.equal(r.length, 2);
  assert.equal(r[1].ordenEnBolsa, 1204);
  assert.equal(r[1].situacionTiempoReal, 120);
});

test('página sin datos de bolsa (por ejemplo, trabajando) → nada', () => {
  assert.deepEqual(leerConsulta(['Situación tiempo real en bolsa', 'No está activo en ninguna bolsa.']), []);
});
