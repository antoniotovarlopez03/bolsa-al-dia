import { TarjetaAvisos } from '../componentes/TarjetaAvisos';
import { useRef, useState } from 'react';
import { borrarTodo, exportarPerfil, importarPerfil } from '../almacen';
import { URL_SIPRI } from '../datos/catalogo';
import type { Bolsa, Perfil } from '../datos/tipos';

interface Props {
  perfil: Perfil;
  catalogo: Bolsa[];
  setPerfil: (p: Perfil | null) => void;
  editarPerfil: () => void;
}

export default function Mas({ perfil, catalogo, setPerfil, editarPerfil }: Props) {
  const buscarBolsa = (id: string) => catalogo.find((b) => b.id === id);
  const archivo = useRef<HTMLInputElement>(null);
  const [mensaje, setMensaje] = useState('');

  const borrar = () => {
    if (!window.confirm('¿Borrar todos tus datos de este dispositivo? No se puede deshacer.')) return;
    borrarTodo();
    setPerfil(null);
  };

  const importar = async (f?: File) => {
    if (!f) return;
    try {
      setPerfil(await importarPerfil(f));
      setMensaje('Copia restaurada correctamente.');
    } catch {
      setMensaje('No se pudo leer el archivo. ¿Es una copia de Bolsa Sur (o de Bolsa al Día)?');
    }
  };

  return (
    <>
      <header className="cabecera"><h1>Más</h1></header>

      <section className="tarjeta">
        <h2>Mi perfil</h2>
        <p>{perfil.bolsas.map((b) => buscarBolsa(b.bolsaId)?.nombre).join(' · ')}</p>
        <p className="nota">Provincias: {perfil.bolsas[0]?.provincias.join(', ')}</p>
        <button className="boton" onClick={editarPerfil}>Cambiar especialidades y provincias</button>
      </section>

      <TarjetaAvisos perfil={perfil} />
      <p className="nota">SIPRI también avisa por correo o SMS a quien convoca. Revisa tu correo no deseado.</p>

      <section className="tarjeta">
        <h2>Copia de seguridad</h2>
        <p className="nota">Tus datos solo están en este dispositivo. Guarda una copia para pasarlos a otro móvil u ordenador.</p>
        <div className="botones">
          <button className="boton" onClick={() => exportarPerfil(perfil)}>Guardar copia</button>
          <button className="boton" onClick={() => archivo.current?.click()}>Restaurar copia</button>
        </div>
        <input ref={archivo} type="file" accept="application/json" hidden onChange={(e) => importar(e.target.files?.[0])} />
        {mensaje && <p role="status">{mensaje}</p>}
      </section>

      <section className="tarjeta">
        <h2>Privacidad</h2>
        <ul className="lista-check puntos">
          <li>No hay cuentas ni registro.</li>
          <li>Tus datos (especialidades, provincias y números) se guardan <strong>solo en este dispositivo</strong>.</li>
          <li>Nunca pedimos contraseñas, certificados, DNI ni NIF.</li>
          <li>Los listados de SIPRI incluyen nombres: <strong>no los guardamos ni los mostramos</strong>, solo cifras.</li>
          <li>Sin publicidad y sin cookies de seguimiento.</li>
        </ul>
        <button className="boton peligro" onClick={borrar}>Borrar todos mis datos</button>
      </section>

      <section className="tarjeta">
        <h2>Aviso legal y fuentes</h2>
        <p>
          <strong>Bolsa Sur es una herramienta informativa independiente.</strong> No pertenece a la Junta de Andalucía ni a SIPRI y no tiene carácter oficial.
          Ante cualquier duda, consulta siempre la web oficial.
        </p>
        <p>
          Fuente de los datos públicos: <a href={URL_SIPRI} target="_blank" rel="noopener noreferrer">sipri.juntadeandalucia.es</a> (Consejería de Desarrollo Educativo y F.P., Junta de Andalucía).
        </p>
        <p className="nota">Gratis para siempre: sin anuncios, sin suscripciones y sin compras.</p>
        <p className="nota">
          Cómo se obtienen los datos: un programa automático lee los listados públicos de SIPRI (convocados, plazas,
          adjudicados y plazas no cubiertas) unas pocas veces al día laborable. Descarta nombres y NIF al leerlos y guarda
          solo cifras por especialidad y provincia. Tu posición personal no es pública: la apuntas tú.
        </p>
        <p className="nota">Versión 0.2</p>
      </section>
    </>
  );
}
