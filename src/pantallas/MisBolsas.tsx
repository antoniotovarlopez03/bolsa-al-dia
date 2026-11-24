import { useState } from 'react';
import { buscarBolsa, URL_SIPRI } from '../datos/catalogo';
import type { BolsaSeguida, Disponibilidad, PaqueteDatos, Perfil } from '../datos/tipos';
import { Ayuda, Cambio, Fuente, TEXTO_CONVOCADO, TEXTO_ORDEN, TEXTO_TIEMPO_REAL } from '../componentes/Comunes';
import { GraficaLinea } from '../componentes/Graficas';
import { fechaCorta, hoyISO, num, totales } from '../utilidades';

const DISPONIBILIDAD: Record<Disponibilidad, string> = {
  'no-indicado': 'Sin indicar',
  activo: 'Activo (puedo ser convocado)',
  trabajando: 'Trabajando ahora',
  'activo-no-disponible': 'Activo no disponible',
  inactivo: 'Inactivo',
};

interface Props {
  perfil: Perfil;
  datos: PaqueteDatos;
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
            {buscarBolsa(s.bolsaId)?.nombre ?? s.bolsaId}
          </button>
        ))}
      </div>

      {perfil.bolsas.filter((s) => s.bolsaId === abierta).map((s) => (
        <DetalleBolsa key={s.bolsaId} s={s} datos={datos} actualizar={(c) => actualizar(s.bolsaId, c)} />
      ))}
    </>
  );
}

function DetalleBolsa({ s, datos, actualizar }: { s: BolsaSeguida; datos: PaqueteDatos; actualizar: (c: (s: BolsaSeguida) => BolsaSeguida) => void }) {
  const [orden, setOrden] = useState('');
  const [real, setReal] = useState('');
  const [fecha, setFecha] = useState(hoyISO());
  const [error, setError] = useState('');

  const regs = [...s.registros].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const conReal = regs.filter((r) => r.situacionTiempoReal !== undefined);

  const guardar = () => {
    const o = orden ? Number(orden) : undefined;
    const r = real ? Number(real) : undefined;
    if (o === undefined && r === undefined) return setError('Escribe al menos uno de los dos números.');
    if ([o, r].some((n) => n !== undefined && (!Number.isInteger(n) || n < 1 || n > 200000)))
      return setError('Los números deben ser enteros positivos.');
    setError('');
    actualizar((x) => ({
      ...x,
      registros: [...x.registros.filter((g) => g.fecha !== fecha), { fecha, ordenEnBolsa: o, situacionTiempoReal: r }],
    }));
    setOrden('');
    setReal('');
  };

  const borrarRegistro = (f: string) => actualizar((x) => ({ ...x, registros: x.registros.filter((g) => g.fecha !== f) }));

  const ultimas = datos.convocatorias.slice(-6).reverse();

  return (
    <>
      <section className="tarjeta">
        <h2>Apuntar mis números</h2>
        <p className="nota">
          Los encontrarás en <a href={URL_SIPRI} target="_blank" rel="noopener noreferrer">SIPRI</a> → acceso con tu usuario → consulta de bolsas. Nosotros nunca entramos con tu usuario.
        </p>
        <label className="campo">
          Orden en bolsa
          <input inputMode="numeric" value={orden} onChange={(e) => setOrden(e.target.value.replace(/\D/g, ''))} placeholder="Ej.: 1245" />
        </label>
        <Ayuda titulo="¿Qué es el orden en bolsa?">{TEXTO_ORDEN}</Ayuda>
        <label className="campo">
          Situación en tiempo real
          <input inputMode="numeric" value={real} onChange={(e) => setReal(e.target.value.replace(/\D/g, ''))} placeholder="Ej.: 312" />
        </label>
        <Ayuda titulo="¿Qué es la situación en tiempo real?">{TEXTO_TIEMPO_REAL}</Ayuda>
        <label className="campo">
          Fecha de la consulta
          <input type="date" value={fecha} max={hoyISO()} onChange={(e) => setFecha(e.target.value)} />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="boton principal" onClick={guardar}>Guardar</button>
      </section>

      <section className="tarjeta">
        <h2>Evolución de mi situación en tiempo real</h2>
        <GraficaLinea
          titulo="Personas por delante (cuanto más bajo, más cerca)"
          puntos={conReal.map((r) => ({ etiqueta: fechaCorta(r.fecha), valor: r.situacionTiempoReal! }))}
        />
      </section>

      {regs.length > 0 && (
        <section className="tarjeta">
          <h2>Historial</h2>
          <table className="tabla">
            <thead>
              <tr><th>Fecha</th><th>Orden</th><th>Tiempo real</th><th>Cambio</th><th><span className="oculto">Borrar</span></th></tr>
            </thead>
            <tbody>
              {regs.slice().reverse().map((r) => {
                const prev = conReal.filter((x) => x.fecha < r.fecha).at(-1);
                return (
                  <tr key={r.fecha}>
                    <td>{fechaCorta(r.fecha)}</td>
                    <td>{num(r.ordenEnBolsa)}</td>
                    <td>{num(r.situacionTiempoReal)}</td>
                    <td><Cambio actual={r.situacionTiempoReal} anterior={prev?.situacionTiempoReal} /></td>
                    <td><button className="enlace" aria-label={`Borrar registro del ${fechaCorta(r.fecha)}`} onClick={() => borrarRegistro(r.fecha)}>✕</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}

      <section className="tarjeta">
        <h2>Mi disponibilidad</h2>
        <select className="selector" value={s.disponibilidad} onChange={(e) => actualizar((x) => ({ ...x, disponibilidad: e.target.value as Disponibilidad }))}>
          {Object.entries(DISPONIBILIDAD).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <p className="nota">Solo para tu referencia. Los cambios oficiales se solicitan en SIPRI.</p>
      </section>

      <section className="tarjeta">
        <h2>Plazas de esta bolsa en tus provincias</h2>
        <Ayuda titulo="¿Qué significa estar convocado?">{TEXTO_CONVOCADO}</Ayuda>
        <table className="tabla">
          <thead><tr><th>Convocatoria</th><th>Plazas</th><th>Adjud.</th><th>Sin cubrir</th></tr></thead>
          <tbody>
            {ultimas.map((c) => {
              const t = totales(c, [s.bolsaId], s.provincias);
              return (
                <tr key={c.id}>
                  <td>{fechaCorta(c.fechaConvocatoria)}</td>
                  <td>{t.ofertadas}</td>
                  <td>{t.adjudicadas}</td>
                  <td>{t.noCubiertas}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <Fuente ejemplo={datos.esEjemplo} />
      </section>
    </>
  );
}
