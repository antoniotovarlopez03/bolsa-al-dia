import type { Bolsa } from './tipos';

// Catálogo inicial de bolsas de Andalucía.
// Los códigos siguen el formato de "Puesto" del desplegable de SIPRI (8 cifras).
// Verificados en SIPRI (24-11-2026): 00597038, 00590011, 00597037.
// El resto: PENDIENTE DE VERIFICAR contra el desplegable oficial antes de la Fase 4.
const lista: Array<[string, string, string]> = [
  ['597', '00597031', 'Educación Infantil (Maestros)'],
  ['597', '00597038', 'Educación Primaria (Maestros)'],
  ['597', '00597032', 'Inglés (Maestros)'],
  ['597', '00597033', 'Francés (Maestros)'],
  ['597', '00597034', 'Educación Física (Maestros)'],
  ['597', '00597035', 'Música (Maestros)'],
  ['597', '00597036', 'Pedagogía Terapéutica (Maestros)'],
  ['597', '00597037', 'Audición y Lenguaje (Maestros)'],
  ['590', '00590001', 'Filosofía (Secundaria)'],
  ['590', '00590004', 'Lengua Castellana y Literatura (Secundaria)'],
  ['590', '00590005', 'Geografía e Historia (Secundaria)'],
  ['590', '00590006', 'Matemáticas (Secundaria)'],
  ['590', '00590007', 'Física y Química (Secundaria)'],
  ['590', '00590008', 'Biología y Geología (Secundaria)'],
  ['590', '00590011', 'Inglés (Secundaria)'],
  ['590', '00590018', 'Orientación Educativa (Secundaria)'],
];

export const CATALOGO: Bolsa[] = lista.map(([cuerpo, puesto, nombre]) => ({
  id: `AND-${puesto}`,
  comunidad: 'AND',
  cuerpo,
  puesto,
  nombre,
}));

export function buscarBolsa(id: string): Bolsa | undefined {
  return CATALOGO.find((b) => b.id === id);
}

export const URL_SIPRI = 'https://sipri.juntadeandalucia.es/sipri/';
