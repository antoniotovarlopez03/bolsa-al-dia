// Lista de plazas concretas con sus características (dato público, sin personas).
import { useState } from 'react';
import type { DetallePlaza } from '../datos/tipos';
import { fechaCorta, normalizar } from '../utilidades';
import { Icono } from './Iconos';

const PARTICIPACION: Record<string, string> = { O: 'Obligatoria', V: 'Voluntaria' };
const PASO = 25;

/** "41700105 - I.E.S. Albero" → { codigo: "41700105", nombre: "I.E.S. Albero" } */
function separarCentro(c?: string) {
  const m = /^\s*(\d{8})\s*-\s*(.+)$/.exec(c ?? '');
  return m ? { codigo: m[1], nombre: m[2] } : { codigo: '', nombre: c ?? 'Centro no indicado' };
}

interface Props {
  filas: DetallePlaza[];
  nombrePuesto: (codigo: string) => string;
  /** Mostrar la especialidad en cada plaza (si la lista mezcla varias). */
  conEspecialidad?: boolean;
  vacio?: string;
}

export function ListaPlazas({ filas, nombrePuesto, conEspecialidad = true, vacio = 'Ninguna plaza.' }: Props) {
  const [visibles, setVisibles] = useState(PASO);
  const [buscar, setBuscar] = useState('');
  if (!filas.length) return <p className="vacio">{vacio}</p>;

  const f = normalizar(buscar.trim());
  const lista = f
    ? filas.filter((p) => normalizar(`${p.centro} ${p.localidad} ${p.provincia} ${nombrePuesto(p.puesto)}`).includes(f))
    : filas;

  return (
    <div className="lista-plazas">
      {filas.length > 8 && (
        <label className="campo compacto">
          <span className="oculto">Buscar centro o localidad</span>
          <input type="search" value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Buscar centro o localidad…" />
        </label>
      )}
      <ul>
        {lista.slice(0, visibles).map((p) => {
          const centro = separarCentro(p.centro);
          return (
            <li key={`${p.id}-${p.puesto}`} className="plaza">
              <div className="plaza-cabecera">
                <strong>{centro.nombre}</strong>
                {p.n > 1 && <span className="etiqueta fuerte">{p.n} plazas</span>}
              </div>
              <div className="plaza-lugar">
                {[p.localidad, p.provincia].filter(Boolean).join(' · ')}
                {centro.codigo && <span className="codigo"> · Código {centro.codigo}</span>}
              </div>
              {conEspecialidad && <div className="plaza-especialidad">{nombrePuesto(p.puesto)}</div>}
              <div className="etiquetas">
                {p.tipo && <span className="etiqueta">{p.tipo}</span>}
                {p.part && PARTICIPACION[p.part] && <span className="etiqueta">{PARTICIPACION[p.part]}</span>}
                {p.cese && <span className="etiqueta">Cese previsto {fechaCorta(p.cese)}</span>}
                {p.motivo && <span className="etiqueta aviso">{p.motivo.toLowerCase()}</span>}
              </div>
            </li>
          );
        })}
      </ul>
      {f && !lista.length && <p className="vacio">Ningún centro coincide con la búsqueda.</p>}
      <p className="nota">
        {Math.min(visibles, lista.length)} de {lista.length} {lista.length === 1 ? 'plaza' : 'plazas'}
      </p>
      {lista.length > visibles && (
        <button className="boton" onClick={() => setVisibles(visibles + PASO)}>
          <Icono nombre="abajo" tam={20} /> Ver más plazas
        </button>
      )}
    </div>
  );
}
