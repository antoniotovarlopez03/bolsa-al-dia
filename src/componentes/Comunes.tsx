import { useState, type ReactNode } from 'react';
import { URL_SIPRI } from '../datos/catalogo';
import type { EstadoCarga } from '../datos/cargar';
import { diasDesde, fechaCorta, fechaHora } from '../utilidades';

/** Franja superior: de cuándo son los datos, o si hay un problema. */
export function EstadoDatos({ carga }: { carga: EstadoCarga }) {
  if (carga.tipo === 'cargando') return null;
  if (carga.tipo === 'error')
    return <div className="franja aviso" role="alert">⚠️ {carga.mensaje}</div>;
  const dias = diasDesde(carga.indice.actualizado);
  if (dias > 7)
    return (
      <div className="franja aviso" role="status">
        ⚠️ Los datos tienen {dias} días (última lectura: {fechaHora(carga.indice.actualizado)}). Consulta también la web oficial.
      </div>
    );
  return <div className="franja" role="status">Datos de SIPRI · leídos el {fechaHora(carga.indice.actualizado)}</div>;
}

export function Fuente({ fecha }: { fecha?: string }) {
  return (
    <p className="fuente">
      Fuente: <a href={URL_SIPRI} target="_blank" rel="noopener noreferrer">SIPRI (Junta de Andalucía)</a>
      {fecha && <> · convocatoria del {fechaCorta(fecha)}</>}
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
export const TEXTO_RANGO =
  'SIPRI convoca a las personas activas y disponibles de la bolsa. Por eso los números de orden convocados van de un mínimo a un máximo con huecos: en medio hay personas que ya trabajan, no están disponibles o están inactivas. Que tu número esté dentro del rango no significa que te tocara ser convocado.';
