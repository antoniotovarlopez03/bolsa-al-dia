import type { Bolsa } from './tipos';

export const URL_SIPRI = 'https://sipri.juntadeandalucia.es/sipri/';

// Cuerpos docentes (3 cifras centrales del código de puesto).
export const CUERPOS: Record<string, string> = {
  '597': 'Maestros',
  '590': 'Secundaria',
  '591': 'Profesores Técnicos de FP',
  '598': 'Especialistas de FP',
  '592': 'Escuelas Oficiales de Idiomas',
  '594': 'Música y Artes Escénicas',
  '593': 'Catedráticos de Música y AA. EE.',
  '595': 'Artes Plásticas y Diseño',
  '596': 'Maestros de Taller de AA. PP.',
};

/** "INGLES P.E.S." → "Ingles P.E.S." (mantiene siglas con puntos). */
export function nombreLegible(oficial: string): string {
  const t = oficial
    .split(/(\s+)/)
    // Siglas tipo "P.E.S." o "C.M.A.E." se mantienen; el resto pasa a minúsculas.
    .map((p) => (/^\(?(\p{L}\.){2,}\)?,?$/u.test(p) ? p : p.toLowerCase()))
    .join('');
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function crearBolsa(puesto: string, oficial: string): Bolsa {
  return {
    id: `AND-${puesto}`,
    comunidad: 'AND',
    cuerpo: puesto.slice(2, 5),
    puesto,
    nombre: nombreLegible(oficial),
    nombreOficial: oficial,
  };
}

// Lista mínima por si la app arranca sin conexión la primera vez (códigos verificados en SIPRI).
const RESPALDO: Record<string, string> = {
  '00597031': 'EDUCACIÓN INFANTIL',
  '00597038': 'EDUCACIÓN PRIMARIA',
  '00597032': 'INGLÉS',
  '00597034': 'EDUCACIÓN FÍSICA',
  '00597035': 'MÚSICA',
  '00597036': 'PEDAGOGÍA TERAPÉUTICA',
  '00597037': 'AUDICIÓN Y LENGUAJE',
  '00590011': 'INGLES P.E.S.',
};

/** Catálogo completo: lo que publica el robot (índice) + respaldo. */
export function crearCatalogo(puestos?: Record<string, string>): Bolsa[] {
  return Object.entries({ ...RESPALDO, ...(puestos ?? {}) })
    .map(([p, n]) => crearBolsa(p, n))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

export function nombreCuerpo(cuerpo: string) {
  return CUERPOS[cuerpo] ?? 'Otros puestos específicos';
}
