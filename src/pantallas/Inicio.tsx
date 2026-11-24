import type { Pestana, SeccionSipri } from '../App';
import { buscarBolsa } from '../datos/catalogo';
import type { PaqueteDatos, Perfil } from '../datos/tipos';
import { Cambio, Fuente } from '../componentes/Comunes';
import { fechaCorta, fechaLarga, num, saludo, totales, ultimosDos } from '../utilidades';

interface Props {
  perfil: Perfil;
  datos: PaqueteDatos;
  irA: (p: Pestana, s?: SeccionSipri) => void;
}

export default function Inicio({ perfil, datos, irA }: Props) {
  const ultima = datos.convocatorias.at(-1);
  const misIds = perfil.bolsas.map((b) => b.bolsaId);
  const misProv = perfil.bolsas[0]?.provincias ?? [];

  return (
    <>
      <header className="cabecera">
        <h1>{saludo()}{perfil.nombre ? `, ${perfil.nombre}` : ''} 👋</h1>
        <p className="sub">
          {datos.esEjemplo ? 'Datos de ejemplo (aún sin conexión con SIPRI)' : `Datos de SIPRI actualizados: ${fechaLarga(datos.actualizado.slice(0, 10))}`}
        </p>
      </header>

      <section aria-labelledby="t-bolsas">
        <h2 id="t-bolsas">Mis bolsas</h2>
        {perfil.bolsas.map((s) => {
          const b = buscarBolsa(s.bolsaId);
          const orden = ultimosDos(s.registros, 'ordenEnBolsa');
          const real = ultimosDos(s.registros, 'situacionTiempoReal');
          const plazas = ultima ? totales(ultima, [s.bolsaId], s.provincias) : undefined;
          return (
            <article key={s.bolsaId} className="tarjeta">
              <h3>{b?.nombre ?? s.bolsaId}</h3>
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
              {real.actual && <p className="nota">Apuntado por ti el {fechaCorta(real.actual.fecha)}</p>}
              {plazas && (
                <p className="linea-dato">
                  Última convocatoria en tus provincias: <strong>{plazas.ofertadas} plazas</strong>
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
          {datos.convocatorias.slice(-3).reverse().map((c) => {
            const t = totales(c, misIds, misProv);
            return (
              <li key={c.id}>
                <strong>{fechaLarga(c.fechaConvocatoria)}</strong>
                <span>{t.ofertadas} plazas de tus especialidades · {t.adjudicadas} adjudicadas</span>
              </li>
            );
          })}
        </ul>
        <Fuente ejemplo={datos.esEjemplo} />
      </section>

      <section aria-labelledby="t-acc">
        <h2 id="t-acc">Accesos rápidos</h2>
        <div className="rejilla">
          <button className="acceso" onClick={() => irA('sipri', 'convocatorias')}>📋<span>Convocatorias</span></button>
          <button className="acceso" onClick={() => irA('sipri', 'convocatorias')}>✅<span>Adjudicaciones</span></button>
          <button className="acceso" onClick={() => irA('sipri', 'estadisticas')}>📊<span>Estadísticas</span></button>
          <button className="acceso" onClick={() => irA('sipri', 'calendario')}>📅<span>Calendario</span></button>
        </div>
      </section>
    </>
  );
}
