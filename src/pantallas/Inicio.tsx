import type { Pestana, SeccionSipri } from '../App';
import type { Perfil } from '../datos/tipos';
import { Cambio, Fuente } from '../componentes/Comunes';
import { ResumenConvocados } from '../componentes/ResumenBolsa';
import { Icono, type NombreIcono } from '../componentes/Iconos';
import { type Datos, fechaCorta, fechaLarga, num, puestoDe, saludo, sumarPlazas, ultimaCon, ultimosDos } from '../utilidades';

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
}

export default function Inicio({ perfil, datos, irA }: Props) {
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

      <section aria-labelledby="t-bolsas">
        <h2 id="t-bolsas">Mis bolsas</h2>
        {perfil.bolsas.map((s) => {
          const puesto = puestoDe(s.bolsaId);
          const orden = ultimosDos(s.registros, 'ordenEnBolsa');
          const real = ultimosDos(s.registros, 'situacionTiempoReal');
          const plazas = convPlazas && sumarPlazas(convPlazas.secciones.plazas?.filas, [puesto], s.provincias).plazas;
          return (
            <article key={s.bolsaId} className="tarjeta tarjeta-bolsa">
              <h3>{datos.bolsa(s.bolsaId)?.nombre ?? puesto}</h3>
              <div className="cifras">
                <div>
                  <span className="etq">Orden en bolsa</span>
                  <span className="valor">{num(orden.actual?.ordenEnBolsa)}</span>
                </div>
                <div>
                  <span className="etq">Situación en tiempo real</span>
                  <span className="valor">{num(real.actual?.situacionTiempoReal)}</span>
                  <Cambio actual={real.actual?.situacionTiempoReal} anterior={real.anterior?.situacionTiempoReal} />
                </div>
              </div>
              {(orden.actual || real.actual) && (
                <p className="nota">Apuntado por ti el {fechaCorta((real.actual ?? orden.actual)!.fecha)}</p>
              )}
              <ResumenConvocados conv={convConvocados} puesto={puesto} miOrden={orden.actual?.ordenEnBolsa} />
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

      <section aria-labelledby="t-nov">
        <h2 id="t-nov">Últimas novedades de SIPRI</h2>
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
