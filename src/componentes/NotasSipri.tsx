// Notas informativas de la portada de SIPRI (plazos, avisos, próximas convocatorias).
import { useState } from 'react';
import type { NotaSipri } from '../datos/tipos';
import { URL_SIPRI } from '../datos/catalogo';
import { Icono } from './Iconos';

const fechaNota = (iso: string) =>
  new Date(iso).toLocaleString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/** "NOTA INFORMATIVA PRÓXIMAS CONVOCATORIAS" → "Próximas convocatorias" */
function tituloLegible(t: string) {
  const sin = t.replace(/^NOTA INFORMATIVA[.:]?\s*/i, '').replace(/^AVISO:\s*/i, 'Aviso: ').trim() || t;
  const minus = sin === sin.toUpperCase() ? sin.toLowerCase() : sin;
  return minus.charAt(0).toUpperCase() + minus.slice(1);
}

export function NotasSipri({ notas, max = 3 }: { notas: NotaSipri[]; max?: number }) {
  const [abierta, setAbierta] = useState<string | null>(null);
  const [todas, setTodas] = useState(false);
  if (!notas.length) return null;
  const lista = todas ? notas : notas.slice(0, max);

  return (
    <div className="notas">
      <ul>
        {lista.map((n) => (
          <li key={n.id} className="nota-sipri">
            <button className="cabecera-plegable" aria-expanded={abierta === n.id} onClick={() => setAbierta(abierta === n.id ? null : n.id)}>
              <span>
                <strong>{tituloLegible(n.titulo)}</strong>
                <small>{fechaNota(n.fecha)}</small>
              </span>
              <Icono nombre="abajo" />
            </button>
            {abierta === n.id && (
              <div className="nota-texto">
                {n.texto.split('\n').filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}
                <a href={URL_SIPRI} target="_blank" rel="noopener noreferrer" className="enlace">
                  <Icono nombre="externo" tam={16} /> Ver en SIPRI
                </a>
              </div>
            )}
          </li>
        ))}
      </ul>
      {notas.length > max && !todas && (
        <button className="enlace" onClick={() => setTodas(true)}>Ver todas las notas ({notas.length})</button>
      )}
    </div>
  );
}
