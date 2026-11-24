import { useState, type ReactNode } from 'react';
import { URL_SIPRI } from '../datos/catalogo';
import { fechaCorta } from '../utilidades';

export function AvisoEjemplo() {
  return (
    <div className="aviso-ejemplo" role="status">
      <strong>DATOS DE EJEMPLO</strong> · Prototipo. Las cifras de SIPRI son inventadas para probar el diseño.
    </div>
  );
}

export function Fuente({ fecha, ejemplo }: { fecha?: string; ejemplo?: boolean }) {
  return (
    <p className="fuente">
      {ejemplo ? 'Dato de ejemplo' : 'Fuente'}:{' '}
      <a href={URL_SIPRI} target="_blank" rel="noopener noreferrer">SIPRI (Junta de Andalucía)</a>
      {fecha && <> · {fechaCorta(fecha)}</>}
    </p>
  );
}

/** Botón "¿Qué significa?" que despliega una explicación sencilla. */
export function Ayuda({ titulo, children }: { titulo: string; children: ReactNode }) {
  const [abierta, setAbierta] = useState(false);
  return (
    <div className="ayuda">
      <button className="enlace" aria-expanded={abierta} onClick={() => setAbierta(!abierta)}>
        ⓘ {titulo}
      </button>
      {abierta && <div className="ayuda-texto">{children}</div>}
    </div>
  );
}

export function Cambio({ actual, anterior, menorEsMejor = true }: { actual?: number; anterior?: number; menorEsMejor?: boolean }) {
  if (actual === undefined || anterior === undefined) return null;
  const d = actual - anterior;
  if (d === 0) return <span className="cambio igual">sin cambios</span>;
  const bueno = menorEsMejor ? d < 0 : d > 0;
  return (
    <span className={`cambio ${bueno ? 'bueno' : 'malo'}`}>
      {d < 0 ? '▼' : '▲'} {Math.abs(d).toLocaleString('es-ES')}
    </span>
  );
}

export const TEXTO_ORDEN =
  'Tu "Orden en bolsa" es el puesto que ocupas entre TODAS las personas de tu bolsa este curso. Cambia poco. Lo ves en SIPRI entrando con tu usuario.';
export const TEXTO_TIEMPO_REAL =
  'Tu "Situación en tiempo real" cuenta solo a las personas que tienes realmente delante: no cuenta a quien ya está trabajando, ni a los no disponibles, inactivos o excluidos. Cambia tras cada convocatoria (martes y jueves).';
export const TEXTO_CONVOCADO =
  'Estar "convocado" significa que te han llamado en una convocatoria concreta para pedir plazas. Ser convocado no garantiza que te adjudiquen una plaza.';
