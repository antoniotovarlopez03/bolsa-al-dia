import { actualizarAvisos } from './avisos';
import { useMemo, useState } from 'react';
import { cargarPerfil, guardarPerfil } from './almacen';
import { useDatosPublicos } from './datos/cargar';
import { crearCatalogo } from './datos/catalogo';
import type { Perfil } from './datos/tipos';
import type { Datos } from './utilidades';
import Bienvenida from './pantallas/Bienvenida';
import Inicio from './pantallas/Inicio';
import MisBolsas from './pantallas/MisBolsas';
import Sipri from './pantallas/Sipri';
import Mas from './pantallas/Mas';
import { BarraSuperior, EstadoDatos } from './componentes/Comunes';
import { Icono, type NombreIcono } from './componentes/Iconos';

export type Pestana = 'inicio' | 'bolsas' | 'sipri' | 'mas';
export type SeccionSipri = 'convocatorias' | 'estadisticas' | 'calendario';

const PESTANAS: Array<{ id: Pestana; texto: string; icono: NombreIcono }> = [
  { id: 'inicio', texto: 'Inicio', icono: 'inicio' },
  { id: 'bolsas', texto: 'Mis bolsas', icono: 'bolsas' },
  { id: 'sipri', texto: 'SIPRI', icono: 'sipri' },
  { id: 'mas', texto: 'Más', icono: 'mas' },
];

export default function App() {
  const [perfil, setPerfilEstado] = useState<Perfil | null>(() => cargarPerfil());
  const [pestana, setPestana] = useState<Pestana>('inicio');
  const [seccion, setSeccion] = useState<SeccionSipri>('convocatorias');
  const [editando, setEditando] = useState(false);
  const carga = useDatosPublicos();

  const indice = carga.tipo === 'listo' ? carga.indice : undefined;
  const catalogo = useMemo(() => crearCatalogo(indice?.puestos), [indice]);
  const datos: Datos | null = useMemo(() => {
    if (carga.tipo !== 'listo') return null;
    return {
      indice: carga.indice,
      convocatorias: [...carga.convocatorias].sort((a, b) => a.fecha.localeCompare(b.fecha)),
      novedades: carga.novedades,
      catalogo,
      bolsa: (id) => catalogo.find((b) => b.id === id),
    };
  }, [carga, catalogo]);

  const setPerfil = (p: Perfil | null) => {
    setPerfilEstado(p);
    if (p) {
      guardarPerfil(p);
      actualizarAvisos(p); // si tiene avisos activos, actualiza especialidades y provincias
    }
  };

  const irA = (p: Pestana, s?: SeccionSipri) => {
    setPestana(p);
    if (s) setSeccion(s);
    window.scrollTo(0, 0);
  };

  if (!perfil || editando) {
    return (
      <Bienvenida
        catalogo={catalogo}
        cargando={carga.tipo === 'cargando'}
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
      <BarraSuperior />
      <EstadoDatos carga={carga} />
      <main className="contenido">
        {datos ? (
          <>
            {pestana === 'inicio' && <Inicio perfil={perfil} datos={datos} irA={irA} />}
            {pestana === 'bolsas' && <MisBolsas perfil={perfil} datos={datos} setPerfil={setPerfil} />}
            {pestana === 'sipri' && <Sipri perfil={perfil} datos={datos} seccion={seccion} setSeccion={setSeccion} />}
          </>
        ) : (
          pestana !== 'mas' && <p className="vacio">{carga.tipo === 'cargando' ? 'Cargando datos de SIPRI…' : 'Sin datos disponibles.'}</p>
        )}
        {pestana === 'mas' && <Mas perfil={perfil} catalogo={catalogo} setPerfil={setPerfil} editarPerfil={() => setEditando(true)} />}
      </main>
      <nav className="navegacion" aria-label="Navegación principal">
        {PESTANAS.map((p) => (
          <button
            key={p.id}
            className={pestana === p.id ? 'activa' : ''}
            aria-current={pestana === p.id ? 'page' : undefined}
            onClick={() => irA(p.id)}
          >
            <span className="pastilla"><Icono nombre={p.icono} /></span>
            {p.texto}
          </button>
        ))}
      </nav>
    </div>
  );
}
