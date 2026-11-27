import { useState } from 'react';
import { URL_SIPRI } from '../datos/catalogo';
import { PROVINCIAS_AND, type BolsaSeguida, type Disponibilidad, type Perfil, type RegistroPosicion } from '../datos/tipos';
import {
  Ayuda, Cambio, Fuente, TEXTO_CONVOCADO, TEXTO_ORDEN, TEXTO_PROVINCIAS, TEXTO_RANGO, TEXTO_TIEMPO_REAL, TEXTO_TRAS_ADJ,
} from '../componentes/Comunes';
import { GraficaLinea } from '../componentes/Graficas';
import { ResumenConvocados } from '../componentes/ResumenBolsa';
import { Icono } from '../componentes/Iconos';
import { ListaPlazas } from '../componentes/ListaPlazas';
import { useDetalle } from '../datos/cargar';
import {
  type Datos, avancePorMes, fechaCorta, hoyISO, nombreMes, num, puestoDe, serie, sumarPlazas, ultimaCon, ultimosDos, valorOrden,
  valorProvincia,
  valorSituacion,
} from '../utilidades';

const DISPONIBILIDAD: Record<Disponibilidad, string> = {
  'no-indicado': 'Sin indicar',
  activo: 'Activo (puedo ser convocado)',
  trabajando: 'Trabajando ahora',
  'activo-no-disponible': 'Activo no disponible',
  inactivo: 'Inactivo',
};

interface Props {
  perfil: Perfil;
  datos: Datos;
  setPerfil: (p: Perfil) => void;
}

export default function MisBolsas({ perfil, datos, setPerfil }: Props) {
  const [abierta, setAbierta] = useState(perfil.bolsas[0]?.bolsaId);

  const actualizar = (id: string, cambio: (s: BolsaSeguida) => BolsaSeguida) =>
    setPerfil({ ...perfil, bolsas: perfil.bolsas.map((s) => (s.bolsaId === id ? cambio(s) : s)) });

  return (
    <>
      <header className="cabecera">
        <h1>Mis bolsas</h1>
        <p className="sub">Copia aquí los números que ves en tu consulta personal de SIPRI.</p>
      </header>

      <div className="pildoras" role="tablist">
        {perfil.bolsas.map((s) => (
          <button key={s.bolsaId} role="tab" aria-selected={abierta === s.bolsaId} className={abierta === s.bolsaId ? 'activa' : ''} onClick={() => setAbierta(s.bolsaId)}>
            {datos.bolsa(s.bolsaId)?.nombre ?? s.bolsaId}
          </button>
        ))}
      </div>

      {perfil.bolsas.filter((s) => s.bolsaId === abierta).map((s) => (
        <DetalleBolsa key={s.bolsaId} s={s} datos={datos} actualizar={(c) => actualizar(s.bolsaId, c)} />
      ))}
    </>
  );
}

function DetalleBolsa({ s, datos, actualizar }: { s: BolsaSeguida; datos: Datos; actualizar: (c: (s: BolsaSeguida) => BolsaSeguida) => void }) {
  const [orden, setOrden] = useState('');
  const [trasAdj, setTrasAdj] = useState('');
  const [real, setReal] = useState('');
  const [provs, setProvs] = useState<Record<string, string>>({});
  const [fecha, setFecha] = useState(hoyISO());
  const [error, setError] = useState('');
  const [guardado, setGuardado] = useState(false);
  const [serieVista, setSerieVista] = useState('general');

  const regs = [...s.registros].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const provinciasForm: string[] = s.provincias.length ? s.provincias : [...PROVINCIAS_AND];
  const soloDigitos = (v: string) => v.replace(/\D/g, '').slice(0, 6);

  const guardar = () => {
    const aNum = (v: string) => (v ? Number(v) : undefined);
    const o = aNum(orden), t = aNum(trasAdj), r = aNum(real);
    const porProvincia = Object.fromEntries(
      Object.entries(provs).filter(([, v]) => v).map(([p, v]) => [p, Number(v)]),
    ) as RegistroPosicion['porProvincia'];
    const todos = [o, t, r, ...Object.values(porProvincia ?? {})];
    if (todos.every((n) => n === undefined)) return setError('Escribe al menos un número.');
    if (todos.some((n) => n !== undefined && (!Number.isInteger(n) || n < 1 || n > 200000)))
      return setError('Los números deben ser enteros positivos.');
    setError('');
    const nuevo: RegistroPosicion = { fecha, ordenEnBolsa: o, situacionTrasAdjudicacion: t, situacionTiempoReal: r };
    if (Object.keys(porProvincia ?? {}).length) nuevo.porProvincia = porProvincia;
    actualizar((x) => ({ ...x, registros: [...x.registros.filter((g) => g.fecha !== fecha), nuevo] }));
    setOrden('');
    setTrasAdj('');
    setReal('');
    setProvs({});
    setGuardado(true);
  };

  // Provincias con algún número apuntado (para la gráfica y el historial).
  const provConDatos = PROVINCIAS_AND.filter((p) => regs.some((r) => r.porProvincia?.[p] !== undefined));
  const lectorSerie = serieVista === 'general' ? valorSituacion : valorProvincia(serieVista);
  const mesesGeneral = avancePorMes(regs, valorSituacion);

  const borrarRegistro = (f: string) => actualizar((x) => ({ ...x, registros: x.registros.filter((g) => g.fecha !== f) }));

  const puesto = puestoDe(s.bolsaId);
  const ultimas = datos.convocatorias.slice().reverse();
  const conConvocados = datos.convocatorias.filter((c) => c.secciones.convocados?.porPuesto[puesto]?.ordenMax != null);
  const miOrden = ultimosDos(s.registros, valorOrden).actual;

  return (
    <>
      <section className="tarjeta">
        <h2>Última convocatoria de esta bolsa</h2>
        <ResumenConvocados conv={ultimaCon(datos.convocatorias, 'convocados')} puesto={puesto} miOrden={miOrden} />
        <Fuente />
      </section>

      <section className="tarjeta">
        <h2>Apuntar mis números</h2>
        <p className="nota">
          Los encontrarás en <a href={URL_SIPRI} target="_blank" rel="noopener noreferrer">SIPRI</a> → acceso con tu usuario → consulta de bolsas. Nosotros nunca entramos con tu usuario.
        </p>
        <p className="nota">Copia los números tal cual aparecen. Puedes dejar en blanco los que no veas.</p>

        <label className="campo">
          Orden en bolsa
          <input inputMode="numeric" value={orden} onChange={(e) => setOrden(soloDigitos(e.target.value))} placeholder="Ej.: 603" />
        </label>
        <Ayuda titulo="¿Qué es el orden en bolsa?">{TEXTO_ORDEN}</Ayuda>

        <label className="campo">
          Situación tras la última adjudicación
          <input inputMode="numeric" value={trasAdj} onChange={(e) => setTrasAdj(soloDigitos(e.target.value))} placeholder="Ej.: 37" />
        </label>
        <Ayuda titulo="¿Qué es la situación tras la última adjudicación?">{TEXTO_TRAS_ADJ}</Ayuda>

        <fieldset className="grupo">
          <legend>Situación por provincias</legend>
          <div className="rejilla-provincias">
            {provinciasForm.map((p) => (
              <label key={p} className="campo-provincia">
                <span>{p}</span>
                <input
                  inputMode="numeric"
                  value={provs[p] ?? ''}
                  onChange={(e) => setProvs({ ...provs, [p]: soloDigitos(e.target.value) })}
                  placeholder="—"
                  aria-label={`Situación en ${p}`}
                />
              </label>
            ))}
          </div>
          <Ayuda titulo="¿De dónde saco estos números?">{TEXTO_PROVINCIAS}</Ayuda>
        </fieldset>

        <label className="campo">
          Situación en tiempo real <span className="opcional">(si te aparece)</span>
          <input inputMode="numeric" value={real} onChange={(e) => setReal(soloDigitos(e.target.value))} placeholder="Ej.: 40" />
        </label>
        <Ayuda titulo="¿Qué es la situación en tiempo real?">{TEXTO_TIEMPO_REAL}</Ayuda>

        <label className="campo">
          Fecha de la consulta
          <input type="date" value={fecha} max={hoyISO()} onChange={(e) => setFecha(e.target.value)} />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        {guardado && !error && <p className="exito" role="status"><Icono nombre="check" tam={18} /> Guardado en este dispositivo.</p>}
        <button className="boton principal" onClick={guardar}>Guardar</button>
      </section>

      <section className="tarjeta">
        <h2>Evolución de mi situación</h2>
        {provConDatos.length > 0 && (
          <div className="pildoras pequenas" role="tablist" aria-label="Elegir qué situación ver">
            {['general', ...provConDatos].map((p) => (
              <button key={p} role="tab" aria-selected={serieVista === p} className={serieVista === p ? 'activa' : ''} onClick={() => setSerieVista(p)}>
                {p === 'general' ? 'General' : p}
              </button>
            ))}
          </div>
        )}
        <GraficaLinea
          titulo={`Personas por delante${serieVista === 'general' ? '' : ` en ${serieVista}`} (cuanto más bajo, más cerca)`}
          puntos={serie(regs, lectorSerie)}
        />
      </section>

      {mesesGeneral.length > 0 && (
        <section className="tarjeta">
          <h2>Avance por meses</h2>
          {mesesGeneral[0].avance > 0 && (
            <p className="destacado-mes">
              En {nombreMes(mesesGeneral[0].mes).split(' ')[0]} has avanzado <strong>{num(mesesGeneral[0].avance)} {mesesGeneral[0].avance === 1 ? 'puesto' : 'puestos'}</strong>
              {provConDatos.length > 0 && (() => {
                const p = provConDatos.map((pr) => ({ pr, a: avancePorMes(regs, valorProvincia(pr)).find((m) => m.mes === mesesGeneral[0].mes)?.avance ?? 0 }))
                  .filter((x) => x.a > 0).map((x) => `${x.a} en ${x.pr}`);
                return p.length ? ` (${p.join(', ')})` : '';
              })()}
              .
            </p>
          )}
          <div className="tabla-scroll">
            <table className="tabla">
              <thead>
                <tr><th>Mes</th><th>General</th>{provConDatos.map((p) => <th key={p}>{p}</th>)}</tr>
              </thead>
              <tbody>
                {mesesGeneral.map((m) => (
                  <tr key={m.mes}>
                    <td>{nombreMes(m.mes)}</td>
                    <td><CeldaAvance a={m.avance} /></td>
                    {provConDatos.map((p) => (
                      <td key={p}><CeldaAvance a={avancePorMes(regs, valorProvincia(p)).find((x) => x.mes === m.mes)?.avance} /></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="nota">Puestos que has subido cada mes según los números que apuntas. Cuantas más veces los apuntes, más exacto.</p>
        </section>
      )}

      {regs.length > 0 && (
        <section className="tarjeta">
          <h2>Historial</h2>
          <div className="tabla-scroll">
            <table className="tabla">
              <thead>
                <tr><th>Fecha</th><th>Orden</th><th>Situación</th><th>Provincias</th><th><span className="oculto">Borrar</span></th></tr>
              </thead>
              <tbody>
                {regs.slice().reverse().map((r) => {
                  const prev = regs.filter((x) => x.fecha < r.fecha && valorSituacion(x) !== undefined).at(-1);
                  const textoProv = Object.entries(r.porProvincia ?? {}).map(([p, v]) => `${p} ${v}`).join(' · ');
                  return (
                    <tr key={r.fecha}>
                      <td>{fechaCorta(r.fecha)}</td>
                      <td>{num(r.ordenEnBolsa)}</td>
                      <td>
                        {num(valorSituacion(r))} <Cambio actual={valorSituacion(r)} anterior={prev && valorSituacion(prev)} />
                      </td>
                      <td className="celda-provincias">{textoProv || '—'}</td>
                      <td><button className="icono-boton" aria-label={`Borrar registro del ${fechaCorta(r.fecha)}`} onClick={() => borrarRegistro(r.fecha)}><Icono nombre="cerrar" tam={18} /></button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <PlazasDeLaBolsa datos={datos} puesto={puesto} provincias={s.provincias} listado="plazas" titulo="Plazas convocadas en tus provincias" />
      <PlazasDeLaBolsa datos={datos} puesto={puesto} provincias={s.provincias} listado="adjudicados" titulo="Última adjudicación en tus provincias" />

      <section className="tarjeta">
        <h2>Mi disponibilidad</h2>
        <select className="selector" value={s.disponibilidad} onChange={(e) => actualizar((x) => ({ ...x, disponibilidad: e.target.value as Disponibilidad }))}>
          {Object.entries(DISPONIBILIDAD).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <p className="nota">Solo para tu referencia. Los cambios oficiales se solicitan en SIPRI.</p>
      </section>

      <section className="tarjeta">
        <h2>Evolución de la bolsa</h2>
        <p className="nota">Mayor número de orden convocado en cada convocatoria (dato público).</p>
        <GraficaLinea
          titulo="Mayor número de orden convocado"
          invertida={false}
          puntos={conConvocados.map((c) => ({ etiqueta: fechaCorta(c.fecha), valor: c.secciones.convocados!.porPuesto[puesto].ordenMax! }))}
          textoVacio="Hacen falta al menos dos convocatorias leídas. El histórico crece cada martes y jueves."
        />
        <Ayuda titulo="¿Cómo interpretar esta gráfica?">{TEXTO_RANGO}</Ayuda>
      </section>

      <section className="tarjeta">
        <h2>Historial de convocatorias</h2>
        <Ayuda titulo="¿Qué significa estar convocado?">{TEXTO_CONVOCADO}</Ayuda>
        <div className="tabla-scroll">
          <table className="tabla">
            <thead>
              <tr><th>Fecha</th><th>Convocados (orden)</th><th>Plazas*</th><th>Adjud.*</th><th>Sin cubrir*</th></tr>
            </thead>
            <tbody>
              {ultimas.map((c) => {
                const conv = c.secciones.convocados?.porPuesto[puesto];
                const celda = (k: 'plazas' | 'adjudicados' | 'noCubiertas') =>
                  c.secciones[k] ? sumarPlazas(c.secciones[k]!.filas, [puesto], s.provincias).plazas : '—';
                return (
                  <tr key={c.id}>
                    <td>{fechaCorta(c.fecha)}</td>
                    <td>
                      {c.secciones.convocados ? (conv ? `${conv.convocados} (${num(conv.ordenMin)}–${num(conv.ordenMax)})` : '0') : '—'}
                    </td>
                    <td>{celda('plazas')}</td>
                    <td>{celda('adjudicados')}</td>
                    <td>{celda('noCubiertas')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="nota">* En tus provincias. "—" = listado aún no publicado o no leído.</p>
        <Fuente />
      </section>
    </>
  );
}

/** Plazas concretas de una bolsa en la convocatoria más reciente que tenga ese listado. */
function PlazasDeLaBolsa({ datos, puesto, provincias, listado, titulo }: {
  datos: Datos; puesto: string; provincias: string[]; listado: 'plazas' | 'adjudicados'; titulo: string;
}) {
  const conv = ultimaCon(datos.convocatorias, listado);
  const det = useDetalle(conv?.id);
  if (!conv) return null;
  const filas = det?.secciones[listado]?.filas.filter((p) => p.puesto === puesto && (!provincias.length || (p.provincia && provincias.includes(p.provincia))));
  const total = sumarPlazas(conv.secciones[listado]?.filas, [puesto], provincias).plazas;
  return (
    <section className="tarjeta">
      <h2>{titulo}</h2>
      <p className="nota">Convocatoria del {fechaCorta(conv.fecha)} · {total} {total === 1 ? 'plaza' : 'plazas'}</p>
      {filas ? (
        <ListaPlazas filas={filas} nombrePuesto={(c) => datos.bolsa(`AND-${c}`)?.nombre ?? c} conEspecialidad={false} />
      ) : det === undefined ? (
        <p className="nota">Cargando…</p>
      ) : (
        <p className="nota">El detalle plaza a plaza de esta convocatoria no está disponible (se guarda desde el 26-11-2026).</p>
      )}
      <Fuente fecha={conv.fecha} />
    </section>
  );
}

/** "+24 ↑" verde si has avanzado; en rojo si tienes más gente delante. */
function CeldaAvance({ a }: { a?: number }) {
  if (a === undefined) return <span className="nota">—</span>;
  if (a === 0) return <span className="nota">sin cambios</span>;
  return (
    <span className={`cambio ${a > 0 ? 'bueno' : 'malo'}`}>
      {a > 0 ? `${num(a)} puestos más cerca` : `${num(-a)} puestos más lejos`}
    </span>
  );
}
