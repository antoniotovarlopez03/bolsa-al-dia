// Activar / desactivar avisos y elegir cuáles recibir.
import { useEffect, useState } from 'react';
import type { Perfil } from '../datos/tipos';
import {
  TIPOS_AVISO, type EstadoAvisos, type TipoAviso, activarAvisos, actualizarAvisos, desactivarAvisos, estadoAvisos, tiposGuardados,
} from '../avisos';
import { Aviso } from './Comunes';
import { Icono } from './Iconos';

export function TarjetaAvisos({ perfil, compacta = false }: { perfil: Perfil; compacta?: boolean }) {
  const [estado, setEstado] = useState<EstadoAvisos | null>(null);
  const [tipos, setTipos] = useState<TipoAviso[]>(tiposGuardados());
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    estadoAvisos().then(setEstado);
  }, []);

  if (!estado) return null;
  if (compacta && estado.tipo !== 'desactivado') return null; // en Inicio solo se ofrece si se puede activar

  const accion = async (f: () => Promise<EstadoAvisos>) => {
    setOcupado(true);
    setError('');
    try {
      setEstado(await f());
    } catch {
      setError('No se han podido activar los avisos. Inténtalo de nuevo con conexión.');
    } finally {
      setOcupado(false);
    }
  };

  const cambiarTipo = (t: TipoAviso) => {
    const nuevos = tipos.includes(t) ? tipos.filter((x) => x !== t) : [...tipos, t];
    setTipos(nuevos);
    if (estado.tipo === 'activado') actualizarAvisos(perfil, nuevos);
  };

  return (
    <section className={`tarjeta ${compacta ? 'tarjeta-aviso-activar' : ''}`}>
      <h2><Icono nombre="convocatoria" tam={20} /> Avisos en el móvil</h2>
      {estado.tipo === 'iphone-instalar' && (
        <Aviso tipo="info">
          En iPhone, los avisos solo funcionan con la app <strong>añadida a la pantalla de inicio</strong>: botón Compartir → "Añadir a pantalla de inicio". Después ábrela desde el icono y activa los avisos aquí.
        </Aviso>
      )}
      {estado.tipo === 'no-soportado' && <p className="nota">Este navegador no permite avisos. Prueba con Chrome, Edge o Safari actualizados.</p>}
      {estado.tipo === 'no-disponible' && <p className="nota">Los avisos estarán disponibles muy pronto.</p>}
      {estado.tipo === 'bloqueado' && (
        <Aviso>Has bloqueado los avisos para esta web. Para activarlos, permite las notificaciones en los ajustes del navegador.</Aviso>
      )}

      {(estado.tipo === 'desactivado' || estado.tipo === 'activado') && (
        <>
          <p className={compacta ? '' : 'nota'}>
            {estado.tipo === 'activado'
              ? 'Avisos activados para tus especialidades y provincias.'
              : 'Te avisamos en cuanto SIPRI publique la convocatoria o la adjudicación. Sin recargar la web de la Junta.'}
          </p>
          {!compacta && (
            <div className="opciones">
              {TIPOS_AVISO.map(([t, texto]) => (
                <label key={t} className={`opcion ${tipos.includes(t) ? 'marcada' : ''}`}>
                  <input type="checkbox" checked={tipos.includes(t)} onChange={() => cambiarTipo(t)} />
                  <span>{texto}</span>
                </label>
              ))}
            </div>
          )}
          {estado.tipo === 'desactivado' ? (
            <button className="boton principal" disabled={ocupado || !tipos.length} onClick={() => accion(() => activarAvisos(perfil, tipos))}>
              {ocupado ? 'Activando…' : 'Activar avisos'}
            </button>
          ) : (
            <button className="boton" disabled={ocupado} onClick={() => accion(desactivarAvisos)}>Desactivar avisos</button>
          )}
          {error && <p className="error" role="alert">{error}</p>}
          {!compacta && <p className="nota">No guardamos tu nombre ni tu correo: solo el "buzón" anónimo de avisos de este navegador y las especialidades que sigues.</p>}
        </>
      )}
    </section>
  );
}
