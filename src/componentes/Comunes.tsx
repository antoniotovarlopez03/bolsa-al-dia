import { useState, type ReactNode } from 'react';
import { URL_SIPRI } from '../datos/catalogo';
import type { EstadoCarga } from '../datos/cargar';
import { diasDesde, fechaCorta, fechaHora } from '../utilidades';
import { Icono } from './Iconos';

/** Logotipo «Lista de clase»: cuaderno con tu fila resaltada (mismo dibujo que el icono de la app). */
export function Logo({ tam = 22 }: { tam?: number }) {
  return (
    <svg width={tam} height={tam} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="2.5" width="15" height="19" rx="2" fill="#fff" />
      {[5.5, 9, 12.5, 16, 19].map((y) => <circle key={y} cx="5" cy={y} r="1.1" fill="#007a33" />)}
      <rect x="8" y="5.5" width="9.5" height="1.4" rx=".7" fill="#cfe3d6" />
      <rect x="7.2" y="10.2" width="11.2" height="3.2" rx="1.1" fill="#ffcf3f" />
      <rect x="8" y="16.5" width="9.5" height="1.4" rx=".7" fill="#cfe3d6" />
    </svg>
  );
}

export function BarraSuperior() {
  return (
    <header className="barra-superior">
      <div className="interior">
        <div className="marca">
          <span className="marca-logo"><Logo tam={28} /></span>
          <span>
            Bolsa Sur
            <small>Bolsas docentes de Andalucía · no oficial</small>
          </span>
        </div>
      </div>
    </header>
  );
}

/** Aviso destacado con icono. */
export function Aviso({ children, tipo = 'alerta' }: { children: ReactNode; tipo?: 'alerta' | 'info' }) {
  return (
    <div className={`aviso-caja ${tipo === 'info' ? 'info' : ''}`}>
      <Icono nombre={tipo === 'info' ? 'info' : 'alerta'} tam={18} />
      <span>{children}</span>
    </div>
  );
}

/** Franja superior: de cuándo son los datos, o si hay un problema. */
export function EstadoDatos({ carga }: { carga: EstadoCarga }) {
  if (carga.tipo === 'cargando') return null;
  if (carga.tipo === 'error')
    return <div className="franja aviso" role="alert"><Icono nombre="alerta" tam={16} /> {carga.mensaje}</div>;
  const dias = diasDesde(carga.indice.actualizado);
  if (dias > 7)
    return (
      <div className="franja aviso" role="status">
        <Icono nombre="alerta" tam={16} />
        Los datos tienen {dias} días (última lectura: {fechaHora(carga.indice.actualizado)}). Consulta también la web oficial.
      </div>
    );
  return <div className="franja" role="status">Datos de SIPRI leídos el {fechaHora(carga.indice.actualizado)}</div>;
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
        <Icono nombre="info" tam={18} /> {titulo}
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
      <Icono nombre={d < 0 ? 'bajar' : 'subir'} tam={14} /> {Math.abs(d).toLocaleString('es-ES')}
    </span>
  );
}

export const TEXTO_ORDEN =
  'Tu "Orden en bolsa" es el puesto que ocupas entre TODAS las personas de tu bolsa este curso. Cambia poco. Lo ves en SIPRI entrando con tu usuario.';
export const TEXTO_TIEMPO_REAL =
  'Tu "Situación en tiempo real" cuenta solo a las personas que tienes realmente delante ahora: no cuenta a quien ya está trabajando, ni a los no disponibles, inactivos o excluidos. SIPRI no la muestra a quien está trabajando en ese momento.';
export const TEXTO_TRAS_ADJ =
  'La "Situación tras la última adjudicación" (en el menú de SIPRI: "Situación Provisional en Bolsa a fecha de…") es tu posición una vez se incorporen las personas adjudicadas. Suele estar unos números por debajo de la de tiempo real y es la más realista. Cambia los jueves y los lunes, cuando se publica cada adjudicación, y también cualquier día si alguien vuelve a la bolsa.';
export const TEXTO_PROVINCIAS =
  'En la misma pantalla de SIPRI aparece tu situación en cada provincia que pediste. En las provincias que no pediste sale un guion: déjalas en blanco.';
export const TEXTO_CONVOCADO =
  'Estar "convocado" significa que te han llamado en una convocatoria concreta para pedir plazas. Ser convocado no garantiza que te adjudiquen una plaza.';
export const TEXTO_RANGO =
  'SIPRI convoca a las personas activas y disponibles de la bolsa. Por eso los números de orden convocados van de un mínimo a un máximo con huecos: en medio hay personas que ya trabajan, no están disponibles o están inactivas. Que tu número esté dentro del rango no significa que te tocara ser convocado.';
