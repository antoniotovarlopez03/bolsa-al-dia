// Botón «Actualizar desde SIPRI» (solo en la app de iPhone/Android).
import { useState } from 'react';
import { CATALOGO_RESPALDO_NOMBRE } from '../datos/catalogo';
import { PROVINCIAS_AND, type BolsaSeguida, type Perfil, type Provincia, type RegistroPosicion } from '../datos/tipos';
import { esAppNativa } from '../nativo';
import { conectarConSipri } from '../sipri/conectar';
import type { BolsaLeida } from '../sipri/leer';
import { hoyISO, num } from '../utilidades';
import { Icono } from './Iconos';

/** Pasa lo leído de SIPRI al perfil: actualiza las bolsas seguidas y añade las nuevas. */
export function aplicarLectura(perfil: Perfil, leidas: BolsaLeida[]): Perfil {
  const fecha = hoyISO();
  const bolsas: BolsaSeguida[] = [...perfil.bolsas];
  for (const b of leidas) {
    const id = `AND-${b.puesto}`;
    const registro: RegistroPosicion = {
      fecha,
      ordenEnBolsa: b.ordenEnBolsa,
      situacionTrasAdjudicacion: b.situacionTrasAdjudicacion,
      situacionTiempoReal: b.situacionTiempoReal,
      ...(Object.keys(b.porProvincia).length ? { porProvincia: b.porProvincia } : {}),
    };
    const i = bolsas.findIndex((s) => s.bolsaId === id);
    if (i >= 0) {
      bolsas[i] = { ...bolsas[i], registros: [...bolsas[i].registros.filter((r) => r.fecha !== fecha), registro] };
    } else {
      const provincias = (Object.keys(b.porProvincia) as Provincia[]).filter((p) => PROVINCIAS_AND.includes(p));
      bolsas.push({ bolsaId: id, provincias: provincias.length ? provincias : perfil.bolsas[0]?.provincias ?? [], disponibilidad: 'activo', registros: [registro] });
    }
  }
  return { ...perfil, bolsas };
}

export function ConectarSipri({ perfil, setPerfil }: { perfil: Perfil; setPerfil: (p: Perfil) => void }) {
  const [estado, setEstado] = useState<'listo' | 'abierto' | 'hecho' | 'nada'>('listo');
  const [leidas, setLeidas] = useState<BolsaLeida[]>([]);
  if (!esAppNativa()) return null;

  const conectar = async () => {
    setEstado('abierto');
    const r = await conectarConSipri();
    if (!r) return setEstado('nada');
    setLeidas(r);
    setPerfil(aplicarLectura(perfil, r));
    setEstado('hecho');
  };

  return (
    <section className="tarjeta tarjeta-aviso-activar">
      <h2><Icono nombre="sipri" tam={20} /> Tus números de SIPRI</h2>
      {estado !== 'hecho' && (
        <p>
          Entra en SIPRI con tu localizador, usuario IdEA o certificado y abre <strong>Consultas → Situación provisional en bolsa</strong>.
          La app leerá tus números sola. Tu contraseña no sale de tu móvil.
        </p>
      )}
      {estado === 'nada' && <p className="nota">No se han leído números. Asegúrate de abrir tu consulta de bolsa antes de cerrar.</p>}
      {estado === 'hecho' && (
        <ul className="lista-check">
          {leidas.map((b) => (
            <li key={b.puesto}>
              <Icono nombre="check" tam={20} />
              <span>
                <strong>{CATALOGO_RESPALDO_NOMBRE(b.puesto, b.nombre)}</strong>: orden {num(b.ordenEnBolsa)} · situación{' '}
                {num(b.situacionTrasAdjudicacion ?? b.situacionTiempoReal)}
                {Object.keys(b.porProvincia).length > 0 && ` · ${Object.entries(b.porProvincia).map(([p, v]) => `${p} ${v}`).join(', ')}`}
              </span>
            </li>
          ))}
        </ul>
      )}
      <button className="boton principal" disabled={estado === 'abierto'} onClick={conectar}>
        {estado === 'abierto' ? 'Esperando a SIPRI…' : estado === 'hecho' ? 'Volver a actualizar' : 'Actualizar desde SIPRI'}
      </button>
    </section>
  );
}
