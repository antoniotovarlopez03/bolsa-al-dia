import { useMemo, useState } from 'react';
import { cargarPerfil, guardarPerfil } from './almacen';
import { crearDatosEjemplo } from './datos/ejemplo';
import type { Perfil } from './datos/tipos';
import Bienvenida from './pantallas/Bienvenida';
import Inicio from './pantallas/Inicio';
import MisBolsas from './pantallas/MisBolsas';
import Sipri from './pantallas/Sipri';
import Mas from './pantallas/Mas';
import { AvisoEjemplo } from './componentes/Comunes';

export type Pestana = 'inicio' | 'bolsas' | 'sipri' | 'mas';
export type SeccionSipri = 'convocatorias' | 'estadisticas' | 'calendario';

const PESTANAS: Array<{ id: Pestana; texto: string; icono: string }> = [
  { id: 'inicio', texto: 'Inicio', icono: '🏠' },
  { id: 'bolsas', texto: 'Mis bolsas', icono: '📈' },
  { id: 'sipri', texto: 'SIPRI', icono: '📋' },
  { id: 'mas', texto: 'Más', icono: '⚙️' },
];

export default function App() {
  const [perfil, setPerfilEstado] = useState<Perfil | null>(() => cargarPerfil());
  const [pestana, setPestana] = useState<Pestana>('inicio');
  const [seccion, setSeccion] = useState<SeccionSipri>('convocatorias');
  const [editando, setEditando] = useState(false);
  // Fase 3: solo datos de ejemplo. En la Fase 4 se cargarán los JSON reales del robot.
  const datos = useMemo(() => crearDatosEjemplo(), []);

  const setPerfil = (p: Perfil | null) => {
    setPerfilEstado(p);
    if (p) guardarPerfil(p);
  };

  const irA = (p: Pestana, s?: SeccionSipri) => {
    setPestana(p);
    if (s) setSeccion(s);
    window.scrollTo(0, 0);
  };

  if (!perfil || editando) {
    return (
      <Bienvenida
        perfilInicial={perfil}
        onTerminar={(p) => {
          setPerfil(p);
          setEditando(false);
        }}
        onCancelar={perfil ? () => setEditando(false) : undefined}
      />
    );
  }

  return (
    <div className="app">
      {datos.esEjemplo && <AvisoEjemplo />}
      <main className="contenido">
        {pestana === 'inicio' && <Inicio perfil={perfil} datos={datos} irA={irA} />}
        {pestana === 'bolsas' && <MisBolsas perfil={perfil} datos={datos} setPerfil={setPerfil} />}
        {pestana === 'sipri' && <Sipri perfil={perfil} datos={datos} seccion={seccion} setSeccion={setSeccion} />}
        {pestana === 'mas' && <Mas perfil={perfil} setPerfil={setPerfil} editarPerfil={() => setEditando(true)} />}
      </main>
      <nav className="navegacion"aria-label="Navegación principal">
        {PESTANAS.map((p) => (
          <button
            key={p.id}
            className={pestana === p.id ? 'activa' : ''}
            aria-current={pestana === p.id ? 'page' : undefined}
            onClick={() => irA(p.id)}
          >
            <span aria-hidden="true">{p.icono}</span>
            {p.texto}
          </button>
        ))}
      </nav>
    </div>
  );
}
