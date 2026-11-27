import { ConectarSipri } from '../componentes/ConectarSipri';
import { TarjetaAvisos } from '../componentes/TarjetaAvisos';
import type { Pestana, SeccionSipri } from '../App';
import type { Perfil } from '../datos/tipos';
import { Aviso, Cambio, Fuente } from '../componentes/Comunes';
import { NotasSipri } from '../componentes/NotasSipri';
import { ResumenConvocados } from '../componentes/ResumenBolsa';
import { Icono, type NombreIcono } from '../componentes/Iconos';
import {
  type Datos, avancePorMes, fechaCorta, fechaLarga, hoyISO, num, puestoDe, saludo, sumarPlazas, ultimaCon, ultimosDos, valorOrden, valorProvincia,
  valorSituacion,
} from '../utilidades';
import { PROVINCIAS_AND } from '../datos/tipos';

const ACCESOS: Array<[string, NombreIcono, SeccionSipri]> = [
  ['Convocatorias', 'convocatoria', 'convocatorias'],
  ['Adjudicaciones', 'adjudicacion', 'convocatorias'],
  ['Estadísticas', 'estadisticas', 'estadisticas'],
  ['Calendario', 'calendario', 'calendario'],
];

interface Props {
  perfil: Perfil;
  datos: Datos;
  irA: (p: Pestana, s?: SeccionSipri) => void;
  setPerfil: (p: Perfil) => void;
}

export default function Inicio({ perfil, datos, irA, setPerfil }: Props) {
  const convConvocados = ultimaCon(datos.convocatorias, 'convocados');
  const convPlazas = ultimaCon(datos.convocatorias, 'plazas');
  const misPuestos = perfil.bolsas.map((b) => puestoDe(b.bolsaId));
  const misProv = perfil.bolsas[0]?.provincias ?? [];

  return (
    <>
      <header className="cabecera">
        <h1>{saludo()}{perfil.nombre ? `, ${perfil.nombre}` : ''}</h1>
        <p className="sub">Así están tus bolsas hoy.</p>
      </header>

      <ConectarSipri perfil={perfil} setPerfil={setPerfil} />

      <section aria-labelledby="t-bolsas">
        <h2 id="t-bolsas">Mis bolsas</h2>
        {perfil.bolsas.map((s) => {
          const puesto = puestoDe(s.bolsaId);
          const orden = ultimosDos(s.registros, valorOrden);
          const sit = ultimosDos(s.registros, valorSituacion);
          const provincias = PROVINCIAS_AND.map((p) => ({ p, ...ultimosDos(s.registros, valorProvincia(p)) })).filter((x) => x.actual !== undefined);
          const ultimaFecha = [orden.fecha, sit.fecha, ...provincias.map((x) => x.fecha)].filter(Boolean).sort().at(-1);
          const plazas = convPlazas && sumarPlazas(convPlazas.secciones.plazas?.filas, [puesto], s.provincias).plazas;
          return (
            <article key={s.bolsaId} className="tarjeta tarjeta-bolsa">
              <h3>{datos.bolsa(s.bolsaId)?.nombre ?? puesto}</h3>
              <div className="cifras">
                <div>
                  <span className="etq">Orden en bolsa</span>
                  <span className="valor">{num(orden.actual)}</span>
                </div>
                <div>
                  <span className="etq">Situación</span>
                  <span className="valor">{num(sit.actual)}</span>
                  <Cambio actual={sit.actual} anterior={sit.anterior} />
                </div>
              </div>
              {provincias.length > 0 && (
                <ul className="provincias-mini" aria-label="Situación por provincias">
                  {provincias.map((x) => (
                    <li key={x.p}>
                      <span>{x.p}</span>
                      <strong>{num(x.actual)}</strong>
                      <Cambio actual={x.actual} anterior={x.anterior} />
                    </li>
                  ))}
                </ul>
              )}
              {(() => {
                const m = avancePorMes(s.registros, valorSituacion)[0];
                return m && m.mes === hoyISO().slice(0, 7) && m.avance > 0 ? (
                  <p className="destacado-mes">Este mes has avanzado <strong>{num(m.avance)} {m.avance === 1 ? 'puesto' : 'puestos'}</strong>.</p>
                ) : null;
              })()}
              {ultimaFecha && <p className="nota">Apuntado por ti el {fechaCorta(ultimaFecha)}</p>}
              {s.disponibilidad === 'trabajando' && (
                <Aviso tipo="info">
                  Estás trabajando: SIPRI no muestra tu situación mientras ocupas una plaza. Volverá a aparecer cuando regreses a la bolsa.
                </Aviso>
              )}
              <ResumenConvocados conv={convConvocados} puesto={puesto} miOrden={orden.actual} />
              {convPlazas && (
                <p className="linea-dato">
                  Plazas en tus provincias (convocatoria del {fechaCorta(convPlazas.fecha)}): <strong>{plazas}</strong>
                </p>
              )}
              <button className="boton" onClick={() => irA('bolsas')}>
                {s.registros.length ? 'Ver evolución / actualizar' : 'Apuntar mi número'}
              </button>
            </article>
          );
        })}
      </section>

      <TarjetaAvisos perfil={perfil} compacta />

      {datos.novedades.length > 0 && (
        <section aria-labelledby="t-notas">
          <h2 id="t-notas">Avisos de SIPRI</h2>
          <div className="tarjeta"><NotasSipri notas={datos.novedades} /></div>
        </section>
      )}

      <section aria-labelledby="t-nov">
        <h2 id="t-nov">Últimas convocatorias</h2>
        <ul className="novedades">
          {datos.convocatorias.slice(-4).reverse().map((c) => {
            const s = c.secciones;
            const mias = s.plazas ? sumarPlazas(s.plazas.filas, misPuestos, misProv).plazas : null;
            const partes = [
              s.convocados && `${num(s.convocados.total)} convocados`,
              s.plazas && `${num(sumarPlazas(s.plazas.filas).plazas)} plazas (${mias} de tus bolsas y provincias)`,
              s.adjudicados && `${num(s.adjudicados.total)} adjudicadas`,
              s.noCubiertas && `${num(sumarPlazas(s.noCubiertas.filas).plazas)} sin cubrir`,
            ].filter(Boolean);
            return (
              <li key={c.id}>
                <span className="punto-icono"><Icono nombre={s.adjudicados ? 'adjudicacion' : 'convocatoria'} tam={18} /></span>
                <div>
                  <strong>Convocatoria del {fechaLarga(c.fecha)}</strong>
                  <br />
                  <span>{partes.join(' · ')}</span>
                </div>
              </li>
            );
          })}
        </ul>
        <Fuente />
      </section>

      <section aria-labelledby="t-acc">
        <h2 id="t-acc">Accesos rápidos</h2>
        <div className="rejilla">
          {ACCESOS.map(([texto, icono, s]) => (
            <button key={texto} className="acceso" onClick={() => irA('sipri', s)}>
              <span className="punto-icono"><Icono nombre={icono} /></span>
              {texto}
            </button>
          ))}
        </div>
      </section>
    </>
  );
}
