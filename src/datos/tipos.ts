// Modelo de datos de BOLSA AL DÍA.
// Pensado para varias comunidades: todo lleva el código de comunidad.

export type CodigoComunidad = 'AND'; // futuro: 'MAD', 'VAL', ...

export const PROVINCIAS_AND = [
  'Almería', 'Cádiz', 'Córdoba', 'Granada', 'Huelva', 'Jaén', 'Málaga', 'Sevilla',
] as const;
export type Provincia = (typeof PROVINCIAS_AND)[number];

/** Una bolsa = especialidad ("puesto" en SIPRI, código de 8 caracteres, p. ej. 00597038). */
export interface Bolsa {
  id: string; // `${comunidad}-${puesto}`
  comunidad: CodigoComunidad;
  cuerpo: string; // '590', '597'...
  puesto: string;
  nombre: string; // nombre legible
  nombreOficial: string; // tal cual lo publica SIPRI
}

// ───────── Datos del docente (solo en su dispositivo) ─────────

/** Lo que el docente apunta a mano, copiado de su consulta personal en SIPRI. */
export interface RegistroPosicion {
  fecha: string; // AAAA-MM-DD
  /** Orden general en la bolsa (todas las personas de la bolsa). */
  ordenEnBolsa?: number;
  /** Situación en tiempo real (personas que tiene realmente delante). */
  situacionTiempoReal?: number;
}

export type Disponibilidad = 'activo' | 'activo-no-disponible' | 'inactivo' | 'trabajando' | 'no-indicado';

export interface BolsaSeguida {
  bolsaId: string;
  provincias: Provincia[];
  disponibilidad: Disponibilidad;
  registros: RegistroPosicion[];
}

export interface Perfil {
  version: 1;
  nombre?: string; // opcional, solo para el saludo
  comunidad: CodigoComunidad;
  bolsas: BolsaSeguida[];
  creado: string;
}

// ───────── Datos públicos generados por el robot (robot/sipri.mjs) ─────────

export interface ResumenConvocados {
  convocados: number;
  /** Menor y mayor número de orden en bolsa entre las personas convocadas. */
  ordenMin: number | null;
  ordenMax: number | null;
}

export interface FilaPlazas {
  puesto: string;
  provincia: string;
  plazas: number;
  porTipo: Record<string, number>; // Sustitución / Vacante
  porParticipacion: Record<string, number>; // O = obligatoria, V = voluntaria…
}

interface SeccionBase { leido: string; total: number }

export interface Convocatoria {
  id: string;
  comunidad: CodigoComunidad;
  fecha: string;
  titulo: string;
  fuente: string;
  secciones: {
    convocados?: SeccionBase & { porPuesto: Record<string, ResumenConvocados> };
    plazas?: SeccionBase & { filas: FilaPlazas[] };
    adjudicados?: SeccionBase & { filas: FilaPlazas[] };
    noCubiertas?: SeccionBase & { filas: FilaPlazas[] };
  };
}

export interface EntradaIndice {
  id: string;
  fecha: string;
  totales: { convocados: number | null; plazas: number | null; adjudicados: number | null; noCubiertas: number | null };
}

export interface Indice {
  comunidad: CodigoComunidad;
  fuente: string;
  actualizado: string;
  convocatorias: EntradaIndice[];
  puestos: Record<string, string>;
}
