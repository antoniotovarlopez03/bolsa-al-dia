import { useState } from 'react';
import type { SeccionSipri } from '../App';
import { buscarBolsa } from '../datos/catalogo';
import type { PaqueteDatos, Perfil } from '../datos/tipos';
import { Fuente } from '../componentes/Comunes';
import { GraficaBarras } from '../componentes/Graficas';
import { descargarICS, fechaCorta, fechaLarga, hoyISO, totales } from '../utilidades';

interface Props {
  perfil: Perfil;
  datos: PaqueteDatos;
  seccion: SeccionSipri;
  setSeccion: (s: SeccionSipri) => void;
}

const SECCIONES: Array<[SeccionSipri, string]> = [
  ['convocatorias', 'Convocatorias'],
  ['estadisticas', 'Estadísticas'],
  ['calendario', 'Calendario'],
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

function Convocatorias({ perfil, datos }: { perfil: Perfil; datos: PaqueteDatos }) {
  const [soloMias, setSoloMias] = useState(true);
  const [abierta, setAbierta] = useState<string | null>(datos.convocatorias.at(-1)?.id ?? null);
  const ids = soloMias ? perfil.bolsas.map((b) => b.bolsaId) : undefined;
  const prov = soloMias ? perfil.bolsas[0]?.provincias : undefined;

  return (
    <>
      <label className="interruptor">
        <input type="checkbox" checked={soloMias} onChange={(e) => setSoloMias(e.target.checked)} />
        Solo mis especialidades y provincias
      </label>
      {datos.convocatorias.slice().reverse().map((c) => {
        const t = totales(c, ids, prov);
        const filas = t.filas.filter((f) => f.plazasOfertadas > 0);
        return (
          <article key={c.id} className="tarjeta">
            <button className="cabecera-plegable" aria-expanded={abierta === c.id} onClick={() => setAbierta(abierta === c.id ? null : c.id)}>
              <span>
                <strong>{fechaLarga(c.fechaConvocatoria)}</strong>
                <small>{t.ofertadas} plazas · {t.adjudicadas} adjudicadas · {t.noCubiertas} sin cubrir</small>
              </span>
              <span aria-hidden="true">{abierta === c.id ? '▲' : '▼'}</span>
            </button>
            {abierta === c.id && (
              <>
                {c.fechaAdjudicacion && <p className="nota">Adjudicación: {fechaCorta(c.fechaAdjudicacion)} · Incorporación: {c.fechaIncorporacion ? fechaCorta(c.fechaIncorporacion) : 'no publicada'}</p>}
                <table className="tabla">
                  <thead><tr><th>Especialidad</th><th>Provincia</th><th>Plazas</th><th>Adjud.</th></tr></thead>
                  <tbody>
                    {filas.slice(0, 60).map((f) => (
                      <tr key={f.bolsaId + f.provincia}>
                        <td>{buscarBolsa(f.bolsaId)?.nombre ?? f.bolsaId}</td>
                        <td>{f.provincia}</td>
                        <td>{f.plazasOfertadas}</td>
                        <td>{f.plazasAdjudicadas}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filas.length > 60 && <p className="nota">Mostrando 60 de {filas.length} filas.</p>}
                <Fuente ejemplo={c.esEjemplo} fecha={c.fechaConvocatoria} />
              </>
            )}
          </article>
        );
      })}
    </>
  );
}

function Estadisticas({ perfil, datos }: { perfil: Perfil; datos: PaqueteDatos }) {
  const prov = perfil.bolsas[0]?.provincias;
  return (
    <>
      {perfil.bolsas.map((s) => {
        const serie = datos.convocatorias.map((c) => ({ fecha: c.fechaConvocatoria, valor: totales(c, [s.bolsaId], prov).ofertadas }));
        const total = serie.reduce((a, b) => a + b.valor, 0);
        const media = serie.length ? total / serie.length : 0;
        return (
          <section key={s.bolsaId} className="tarjeta">
            <h2>{buscarBolsa(s.bolsaId)?.nombre}</h2>
            <GraficaBarras titulo="Plazas por convocatoria en tus provincias" datos={serie} />
            <div className="cifras">
              <div><span className="etq">Total del periodo</span><span className="valor">{total}</span></div>
              <div><span className="etq">Media por convocatoria</span><span className="valor">{media.toLocaleString('es-ES', { maximumFractionDigits: 1 })}</span></div>
            </div>
            <p className="aviso-prevision">
              ⚠️ Estas cifras describen lo ocurrido. <strong>No son una previsión oficial</strong> ni indican cuándo te llamarán.
            </p>
            <Fuente ejemplo={datos.esEjemplo} />
          </section>
        );
      })}
    </>
  );
}

function Calendario({ datos }: { datos: PaqueteDatos }) {
  const hoy = hoyISO();
  const eventos = [...datos.eventos].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const proximos = eventos.filter((e) => e.fecha >= hoy);
  const pasados = eventos.filter((e) => e.fecha < hoy).reverse();
  const ICONO = { convocatoria: '📋', adjudicacion: '✅', incorporacion: '🏫', plazo: '⏳', otro: '•' } as const;

  const Lista = ({ lista }: { lista: typeof eventos }) => (
    <ul className="eventos">
      {lista.map((e, i) => (
        <li key={e.fecha + i}>
          <span className="ev-icono" aria-hidden="true">{ICONO[e.tipo]}</span>
          <span><strong>{fechaLarga(e.fecha)}</strong><br />{e.titulo}</span>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <section className="tarjeta">
        <h2>Próximas fechas</h2>
        {proximos.length ? <Lista lista={proximos} /> : <p className="vacio">No hay fechas próximas publicadas.</p>}
        <button className="boton" onClick={() => descargarICS(proximos)}>📅 Añadir a mi calendario</button>
        <p className="nota">Las convocatorias son habitualmente martes y jueves. Confirma siempre en SIPRI.</p>
      </section>
      <section className="tarjeta">
        <h2>Fechas anteriores</h2>
        <Lista lista={pasados} />
        <Fuente ejemplo={datos.esEjemplo} />
      </section>
    </>
  );
}
