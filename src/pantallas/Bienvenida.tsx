import { useMemo, useState } from 'react';
import { nombreCuerpo } from '../datos/catalogo';
import { PROVINCIAS_AND, type Bolsa, type BolsaSeguida, type Perfil, type Provincia } from '../datos/tipos';
import { hoyISO, normalizar } from '../utilidades';
import { Icono } from '../componentes/Iconos';
import { BarraSuperior } from '../componentes/Comunes';

interface Props {
  catalogo: Bolsa[];
  cargando: boolean;
  perfilInicial: Perfil | null;
  onTerminar: (p: Perfil) => void;
  onCancelar?: () => void;
}

export default function Bienvenida({ catalogo, cargando, perfilInicial, onTerminar, onCancelar }: Props) {
  const [paso, setPaso] = useState(perfilInicial ? 2 : 1);
  const [nombre, setNombre] = useState(perfilInicial?.nombre ?? '');
  const [bolsas, setBolsas] = useState<string[]>(perfilInicial?.bolsas.map((b) => b.bolsaId) ?? []);
  const [provincias, setProvincias] = useState<Provincia[]>(perfilInicial?.bolsas[0]?.provincias ?? []);
  const [filtro, setFiltro] = useState('');

  const alternar = <T,>(lista: T[], v: T) => (lista.includes(v) ? lista.filter((x) => x !== v) : [...lista, v]);

  const terminar = () => {
    const previas = new Map(perfilInicial?.bolsas.map((b) => [b.bolsaId, b]));
    const seguidas: BolsaSeguida[] = bolsas.map((id) => ({
      bolsaId: id,
      provincias,
      disponibilidad: previas.get(id)?.disponibilidad ?? 'no-indicado',
      registros: previas.get(id)?.registros ?? [],
    }));
    onTerminar({
      version: 1,
      nombre: nombre.trim() || undefined,
      comunidad: 'AND',
      bolsas: seguidas,
      creado: perfilInicial?.creado ?? hoyISO(),
    });
  };

  // Agrupadas por cuerpo; la búsqueda ignora tildes y mayúsculas.
  const grupos = useMemo(() => {
    const f = normalizar(filtro.trim());
    const visibles = catalogo.filter((b) => !f || normalizar(`${b.nombre} ${b.puesto}`).includes(f) || bolsas.includes(b.id));
    const mapa = new Map<string, Bolsa[]>();
    for (const b of visibles) mapa.set(b.cuerpo, [...(mapa.get(b.cuerpo) ?? []), b]);
    return [...mapa.entries()].sort(([a], [b]) => nombreCuerpo(a).localeCompare(nombreCuerpo(b), 'es'));
  }, [catalogo, filtro, bolsas]);

  return (
    <div className="app bienvenida">
      <BarraSuperior />
      <main className="contenido">
        <p className="pasos">Paso {paso} de 3</p>

        {paso === 1 && (
          <section>
            <h1>Bienvenida a Bolsa al Día</h1>
            <p className="grande">Sigue tus bolsas docentes de Andalucía de forma sencilla.</p>
            <ul className="lista-check">
              <li><Icono nombre="check" tam={20} /> Gratis, sin anuncios y sin registro.</li>
              <li><Icono nombre="check" tam={20} /> <span>Tus datos se quedan <strong>solo en este dispositivo</strong>.</span></li>
              <li><Icono nombre="check" tam={20} /> Nunca te pediremos tu contraseña de SIPRI.</li>
            </ul>
            <p className="nota">Herramienta independiente. No pertenece a la Junta de Andalucía.</p>
            <label className="campo">
              ¿Cómo te llamamos? <span className="opcional">(opcional)</span>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="given-name" maxLength={30} />
            </label>
            <button className="boton principal" onClick={() => setPaso(2)}>Empezar</button>
          </section>
        )}

        {paso === 2 && (
          <section>
            <h1>¿Qué bolsas quieres seguir?</h1>
            <p>Puedes elegir varias especialidades. {bolsas.length > 0 && <strong>Elegidas: {bolsas.length}</strong>}</p>
            <label className="campo">
              Buscar especialidad
              <input type="search" value={filtro} onChange={(e) => setFiltro(e.target.value)} placeholder="Ej.: inglés, primaria, 00597038…" />
            </label>
            {cargando && <p className="nota">Cargando la lista completa de especialidades…</p>}
            {grupos.map(([cuerpo, lista]) => (
              <fieldset key={cuerpo} className="grupo">
                <legend>{nombreCuerpo(cuerpo)}</legend>
                <div className="opciones">
                  {lista.map((b) => (
                    <label key={b.id} className={`opcion ${bolsas.includes(b.id) ? 'marcada' : ''}`}>
                      <input type="checkbox" checked={bolsas.includes(b.id)} onChange={() => setBolsas(alternar(bolsas, b.id))} />
                      <span>{b.nombre}<small> · {b.puesto}</small></span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
            {!grupos.length && <p className="vacio">No hay especialidades con ese nombre.</p>}
            <div className="botones fijos">
              {onCancelar ? <button className="boton" onClick={onCancelar}>Cancelar</button> : <button className="boton" onClick={() => setPaso(1)}>Atrás</button>}
              <button className="boton principal" disabled={!bolsas.length} onClick={() => setPaso(3)}>Siguiente</button>
            </div>
          </section>
        )}

        {paso === 3 && (
          <section>
            <h1>¿En qué provincias?</h1>
            <p>Las que pediste en SIPRI. Sirve para mostrarte solo las plazas que te interesan.</p>
            <div className="opciones dos-columnas">
              {PROVINCIAS_AND.map((p) => (
                <label key={p} className={`opcion ${provincias.includes(p) ? 'marcada' : ''}`}>
                  <input type="checkbox" checked={provincias.includes(p)} onChange={() => setProvincias(alternar(provincias, p))} />
                  <span>{p}</span>
                </label>
              ))}
            </div>
            <button className="enlace" onClick={() => setProvincias([...PROVINCIAS_AND])}>Marcar todas</button>
            <p className="nota">Tu número en la bolsa lo podrás apuntar después, en "Mis bolsas".</p>
            <div className="botones">
              <button className="boton" onClick={() => setPaso(2)}>Atrás</button>
              <button className="boton principal" disabled={!provincias.length} onClick={terminar}>Guardar</button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
