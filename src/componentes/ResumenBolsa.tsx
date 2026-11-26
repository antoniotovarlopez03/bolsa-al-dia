// Dato público de la última convocatoria para una bolsa + comparación ORIENTATIVA con el número del docente.
import type { Convocatoria } from '../datos/tipos';
import { Ayuda, TEXTO_RANGO } from './Comunes';
import { fechaCorta, num } from '../utilidades';
import { Icono } from './Iconos';

export function ResumenConvocados({ conv, puesto, miOrden }: { conv?: Convocatoria; puesto: string; miOrden?: number }) {
  if (!conv?.secciones.convocados) return <p className="nota">Aún no hay listados de convocados leídos.</p>;
  const r = conv.secciones.convocados.porPuesto[puesto];
  return (
    <div className="dato-publico">
      <p className="etq">Convocatoria del {fechaCorta(conv.fecha)}</p>
      {r ? (
        <>
          <p>
            <strong>{num(r.convocados)}</strong> {r.convocados === 1 ? 'persona convocada' : 'personas convocadas'} de esta bolsa,
            con número de orden del <strong>{num(r.ordenMin)}</strong> al <strong>{num(r.ordenMax)}</strong>.
          </p>
          {miOrden !== undefined && r.ordenes && (
            r.ordenes.includes(miOrden) ? (
              <p className="convocado si">
                <Icono nombre="check" tam={20} />
                <span>
                  <strong>Tu número ({num(miOrden)}) está entre los convocados.</strong> Revisa SIPRI y presenta tu solicitud en plazo.
                </span>
              </p>
            ) : (
              <p className="convocado no">
                Tu número ({num(miOrden)}) <strong>no aparece</strong> entre los convocados de esta bolsa
                {r.ordenMax !== null && miOrden > r.ordenMax && ` (el mayor convocado es el ${num(r.ordenMax)})`}.
              </p>
            )
          )}
          {miOrden !== undefined && !r.ordenes && r.ordenMax !== null && (
            <p className="comparacion">
              {miOrden <= r.ordenMax
                ? `Tu orden en bolsa (${num(miOrden)}) está dentro del rango convocado.`
                : `Tu orden en bolsa (${num(miOrden)}) está ${num(miOrden - r.ordenMax)} puestos por encima del mayor número convocado.`}
              <span className="nota"> Orientativo, no oficial.</span>
            </p>
          )}
          {miOrden === undefined && <p className="nota">Apunta tu orden en bolsa en "Mis bolsas" y te diremos si estás convocado.</p>}
          <Ayuda titulo="¿Por qué hay un rango y no un único número?">{TEXTO_RANGO}</Ayuda>
        </>
      ) : (
        <p>No se convocó a nadie de esta bolsa.</p>
      )}
    </div>
  );
}
