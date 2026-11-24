// Modelo de datos de BOLSA AL DÍA.
// Pensado para varias comunidades: todo lleva el código de comunidad.

export type CodigoComunidad = 'AND'; // futuro: 'MAD', 'VAL', ...

export const PROVINCIAS_AND = [
  'Almería', 'Cádiz', 'Córdoba', 'Granada', 'Huelva', 'Jaén', 'Málaga', 'Sevilla',
] as const;
export type Provincia = (typeof PROVINCIAS_AND)[number];

/** Una bolsa = cuerpo + especialidad ("puesto" en SIPRI, p. ej. 00597038). */
export interface Bolsa {
  id: string; // `${comunidad}-${puesto}`
  comunidad: CodigoComunidad;
  cuerpo: string; // '590', '597'...
  puesto: string; // código de puesto de SIPRI
  nombre: string;
}

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

/** Resumen público y SIN nombres de una convocatoria, por bolsa y provincia. */
export interface ResumenConvocatoria {
  bolsaId: string;
  provincia: Provincia;
  plazasOfertadas: number;
  plazasAdjudicadas: number;
  plazasNoCubiertas: number;
  /** Solo si SIPRI lo publica (pendiente de verificar). */
  ultimoOrdenConvocado?: number;
}

export interface Convocatoria {
  id: string;
  comunidad: CodigoComunidad;
  titulo: string;
  fechaConvocatoria: string;
  fechaAdjudicacion?: string;
  fechaIncorporacion?: string;
  resumen: ResumenConvocatoria[];
  fuente: string; // URL oficial
  esEjemplo: boolean; // true = DATOS DE EJEMPLO
}

export interface EventoCalendario {
  fecha: string;
  titulo: string;
  tipo: 'convocatoria' | 'adjudicacion' | 'incorporacion' | 'plazo' | 'otro';
  esEjemplo: boolean;
}

export interface PaqueteDatos {
  actualizado: string; // fecha-hora ISO de la última lectura
  esEjemplo: boolean;
  convocatorias: Convocatoria[];
  eventos: EventoCalendario[];
}
