import { useState } from 'react';
import type { SeccionSipri } from '../App';
import type { Convocatoria, FilaPlazas, Perfil } from '../datos/tipos';
import { Aviso, Fuente } from '../componentes/Comunes';
import { Icono } from '../componentes/Iconos';
import { ListaPlazas } from '../componentes/ListaPlazas';
import { useDetalle } from '../datos/cargar';
import { GraficaBarras } from '../componentes/Graficas';
import {
  type Datos, type EventoCalendario, descargarICS, fechaLarga, hoyISO, num, puestoDe, sumarPlazas,
} from '../utilidades';

interface Props {
  perfil: Perfil;
  datos: Datos;
  seccion: SeccionSipri;
  setSeccion: (s: SeccionSipri) => void;
}

const SECCIONES: Array<[SeccionSipri, string]> = [
  ['convocatorias', 'Convocatorias'],
  ['estadisticas', 'Estadísticas'],
  ['calendario', 'Calendario'],
];
const MAX_FILAS = 60;
const LISTADOS_PLAZAS: Array<['plazas' | 'adjudicados' | 'noCubiertas', string]> = [
  ['plazas', 'Plazas convocadas'],
  ['adjudicados', 'Plazas adjudicadas'],
  ['noCubiertas', 'Plazas sin cubrir'],
];

export default function Sipri({ perfil, datos, seccion, setSeccion }: Props) {
  return (
    <>
      <header className="cabecera">
        <h1>SIPRI</h1>
        <p className="sub">Información pública de las convocatorias. Sin nombres de personas.</p>
      </header>
      <div className="pildoras" role="tablist">
        {SECCIONES.map(([id, t]) => (
          <button key={id} role="tab" aria-selected={seccion === id} className={seccion === id ? 'activa' : ''} onClick={() => setSeccion(id)}>{t}</button>
        ))}
      </div>
      {seccion === 'convocatorias' && <Convocatorias perfil={perfil} datos={datos} />}
      {seccion === 'estadisticas' && <Estadisticas perfil={perfil} datos={datos} />}
      {seccion === 'calendario' && <Calendario datos={datos} />}
    </>
  );
}

function Convocatorias({ perfil, datos }: { perfil: Perfil; datos: Datos }) {
  const [soloMias, setSoloMias] = useState(true);
  const [abierta, setAbierta] = useState<string | null>(datos.convocatorias.at(-1)?.id ?? null);
  const puestos = soloMias ? perfil.bolsas.map((b) => puestoDe(b.bolsaId)) : undefined;
  const prov = soloMias ? perfil.bolsas[0]?.provincias : undefined;

  if (!datos.convocatorias.length) return <p className="vacio">Todavía no hay convocatorias leídas.</p>;

  return (
    <>
      <label className="interruptor">
        <input type="checkbox" checked={soloMias} onChange={(e) => setSoloMias(e.target.checked)} />
        Solo mis especialidades y provincias
      </label>
      {datos.convocatorias.slice().reverse().map((c) => (
        <article key={c.id} className="tarjeta">
          <button className="cabecera-plegable" aria-expanded={abierta === c.id} onClick={() => setAbierta(abierta === c.id ? null : c.id)}>
            <span>
              <strong>Convocatoria del {fechaLarga(c.fecha)}</strong>
              <small>{resumenLinea(c, puestos, prov)}</small>
            </span>
            <Icono nombre="abajo" />
          </button>
          {abierta === c.id && <DetalleConvocatoria c={c} datos={datos} puestos={puestos} prov={prov} />}
        </article>
      ))}
    </>
  );
}

function resumenLinea(c: Convocatoria, puestos?: string[], prov?: string[]) {
  const s = c.secciones;
  const convocados = s.convocados
    ? Object.entries(s.convocados.porPuesto).filter(([p]) => !puestos || puestos.includes(p)).reduce((a, [, r]) => a + r.convocados, 0)
    : null;
  return [
    convocados !== null && `${num(convocados)} convocados`,
    s.plazas && `${num(sumarPlazas(s.plazas.filas, puestos, prov).plazas)} plazas`,
    s.adjudicados && `${num(sumarPlazas(s.adjudicados.filas, puestos, prov).plazas)} adjudicadas`,
    s.noCubiertas && `${num(sumarPlazas(s.noCubiertas.filas, puestos, prov).plazas)} sin cubrir`,
  ].filter(Boolean).join(' · ') || 'Listados aún no publicados';
}

function DetalleConvocatoria({ c, datos, puestos, prov }: { c: Convocatoria; datos: Datos; puestos?: string[]; prov?: string[] }) {
  const nombre = (p: string) => datos.bolsa(`AND-${p}`)?.nombre ?? p;
  const s = c.secciones;
  const det = useDetalle(c.id);
  const convocados = s.convocados
    ? Object.entries(s.convocados.porPuesto).filter(([p]) => !puestos || puestos.includes(p)).sort((a, b) => b[1].convocados - a[1].convocados)
    : [];

  const TablaPlazas = ({ titulo, filas }: { titulo: string; filas?: FilaPlazas[] }) => {
    if (!filas) return null;
    const f = sumarPlazas(filas, puestos, prov).filas;
    return (
      <>
        <h3>{titulo}</h3>
        {f.length ? (
          <div className="tabla-scroll">
            <table className="tabla">
              <thead><tr><th>Especialidad</th><th>Provincia</th><th>Nº</th></tr></thead>
              <tbody>
                {f.slice(0, MAX_FILAS).map((r) => (
                  <tr key={r.puesto + r.provincia}><td>{nombre(r.puesto)}</td><td>{r.provincia}</td><td>{r.plazas}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="vacio">Ninguna.</p>}
        {f.length > MAX_FILAS && <p className="nota">Mostrando {MAX_FILAS} de {f.length} filas.</p>}
      </>
    );
  };

  return (
    <div className="detalle">
      {s.convocados && (
        <>
          <h3>Personas convocadas por bolsa</h3>
          {convocados.length ? (
            <div className="tabla-scroll">
              <table className="tabla">
                <thead><tr><th>Especialidad</th><th>Convocados</th><th>Nº de orden</th></tr></thead>
                <tbody>
                  {convocados.slice(0, MAX_FILAS).map(([p, r]) => (
                    <tr key={p}><td>{nombre(p)}</td><td>{r.convocados}</td><td>{num(r.ordenMin)}–{num(r.ordenMax)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="vacio">Nadie de tus bolsas.</p>}
        </>
      )}
      {LISTADOS_PLAZAS.map(([k, titulo]) => {
        if (!s[k]) return null;
        const filasDet = det?.secciones[k]?.filas.filter(
          (p) => (!puestos || puestos.includes(p.puesto)) && (!prov?.length || (p.provincia && prov.includes(p.provincia))),
        );
        return filasDet ? (
          <div key={k}>
            <h3>{titulo}</h3>
            <ListaPlazas filas={filasDet} nombrePuesto={nombre} conEspecialidad={!puestos || puestos.length > 1} />
          </div>
        ) : (
          <TablaPlazas key={k} titulo={titulo} filas={s[k]!.filas} />
        );
      })}
      {det === undefined && <p className="nota">Cargando el detalle de las plazas…</p>}
      {det === null && <p className="nota">De esta convocatoria solo hay totales: el detalle plaza a plaza se guarda desde el 26-11-2026.</p>}
      <Fuente fecha={c.fecha} />
    </div>
  );
}

function Estadisticas({ perfil, datos }: { perfil: Perfil; datos: Datos }) {
  const prov = perfil.bolsas[0]?.provincias;
  const conPlazas = datos.convocatorias.filter((c) => c.secciones.plazas);
  const conConv = datos.convocatorias.filter((c) => c.secciones.convocados);
  return (
    <>
      {conPlazas.length + conConv.length < 4 && (
        <Aviso tipo="info">
          Aún hay pocos datos: el robot empezó a guardar convocatorias el 24-11-2026. Las estadísticas mejorarán cada semana.
        </Aviso>
      )}
      {perfil.bolsas.map((s) => {
        const p = puestoDe(s.bolsaId);
        const plazas = conPlazas.map((c) => ({ fecha: c.fecha, valor: sumarPlazas(c.secciones.plazas!.filas, [p], prov).plazas }));
        const convocados = conConv.map((c) => ({ fecha: c.fecha, valor: c.secciones.convocados!.porPuesto[p]?.convocados ?? 0 }));
        const total = plazas.reduce((a, b) => a + b.valor, 0);
        return (
          <section key={s.bolsaId} className="tarjeta">
            <h2>{datos.bolsa(s.bolsaId)?.nombre ?? p}</h2>
            <GraficaBarras titulo="Plazas por convocatoria en tus provincias" datos={plazas} />
            <GraficaBarras titulo="Personas convocadas de esta bolsa" datos={convocados} />
            <div className="cifras">
              <div><span className="etq">Plazas en el periodo</span><span className="valor">{total}</span></div>
              <div>
                <span className="etq">Media por convocatoria</span>
                <span className="valor">{plazas.length ? (total / plazas.length).toLocaleString('es-ES', { maximumFractionDigits: 1 }) : '—'}</span>
              </div>
            </div>
            <Aviso>
              Estas cifras describen lo ocurrido. <strong>No son una previsión oficial</strong> ni indican cuándo te llamarán.
            </Aviso>
            <Fuente />
          </section>
        );
      })}
    </>
  );
}

function Calendario({ datos }: { datos: Datos }) {
  const hoy = hoyISO();
  // Próximos martes y jueves: patrón habitual que indica SIPRI en sus preguntas frecuentes (no son fechas oficiales).
  const proximos: EventoCalendario[] = [];
  const d = new Date();
  for (let k = 0; k < 21; k++) {
    const iso = d.toISOString().slice(0, 10);
    if ((d.getDay() === 2 || d.getDay() === 4) && iso >= hoy && !datos.indice.convocatorias.some((c) => c.fecha === iso))
      proximos.push({ fecha: iso, titulo: 'Convocatoria SIPRI habitual (martes/jueves)', tipo: 'habitual' });
    d.setDate(d.getDate() + 1);
  }
  const pasadas = [...datos.indice.convocatorias].reverse();

  return (
    <>
      <section className="tarjeta">
        <h2>Próximas fechas habituales</h2>
        <ul className="eventos">
          {proximos.map((e) => (
            <li key={e.fecha}>
              <span className="punto-icono"><Icono nombre="calendario" tam={18} /></span>
              <span><strong>{fechaLarga(e.fecha)}</strong><br />{e.titulo}</span>
            </li>
          ))}
        </ul>
        <p className="nota">SIPRI suele convocar los martes y los jueves. No son fechas oficiales: confirma siempre en SIPRI.</p>
        <button className="boton" onClick={() => descargarICS(proximos)}><Icono nombre="descargar" tam={20} /> Añadir a mi calendario</button>
      </section>
      <section className="tarjeta">
        <h2>Convocatorias publicadas</h2>
        <ul className="eventos">
          {pasadas.map((c) => (
            <li key={c.id}>
              <span className="punto-icono"><Icono nombre={c.totales.adjudicados !== null ? 'adjudicacion' : 'convocatoria'} tam={18} /></span>
              <span>
                <strong>{fechaLarga(c.fecha)}</strong>
                <br />
                {c.totales.adjudicados !== null ? 'Convocatoria con adjudicación publicada' : 'Convocatoria (adjudicación pendiente)'}
              </span>
            </li>
          ))}
        </ul>
        <p className="nota">Las fechas de incorporación aparecerán cuando el robot pueda leerlas de forma fiable.</p>
        <Fuente />
      </section>
    </>
  );
}
