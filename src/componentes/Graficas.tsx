// Gráficas sencillas en SVG (sin librerías: menos peso y más rápido en móviles).
import { fechaCorta } from '../utilidades';

interface Punto { etiqueta: string; valor: number }

export function GraficaLinea({ puntos, titulo, invertida = true }: { puntos: Punto[]; titulo: string; invertida?: boolean }) {
  if (puntos.length < 2)
    return <p className="vacio">Apunta tu número al menos dos días distintos para ver la gráfica.</p>;
  const W = 320, H = 160, M = { i: 44, d: 12, a: 12, b: 28 };
  const vals = puntos.map((p) => p.valor);
  const min = Math.min(...vals), max = Math.max(...vals);
  const rango = max - min || 1;
  const x = (i: number) => M.i + (i * (W - M.i - M.d)) / (puntos.length - 1);
  // Invertida: los números más bajos (mejor posición) aparecen más arriba.
  const y = (v: number) => (invertida ? M.a + ((v - min) / rango) * (H - M.a - M.b) : H - M.b - ((v - min) / rango) * (H - M.a - M.b));
  const d = puntos.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.valor)}`).join(' ');
  return (
    <figure className="grafica">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${titulo}: de ${vals[0]} a ${vals.at(-1)}`}>
        <line x1={M.i} x2={W - M.d} y1={y(min)} y2={y(min)} className="eje" />
        <line x1={M.i} x2={W - M.d} y1={y(max)} y2={y(max)} className="eje" />
        <text x={M.i - 6} y={y(min) + 4} textAnchor="end" className="txt">{min.toLocaleString('es-ES')}</text>
        <text x={M.i - 6} y={y(max) + 4} textAnchor="end" className="txt">{max.toLocaleString('es-ES')}</text>
        <path d={d} className="linea" />
        {puntos.map((p, i) => <circle key={i} cx={x(i)} cy={y(p.valor)} r={4} className="punto" />)}
        <text x={x(0)} y={H - 8} textAnchor="start" className="txt">{puntos[0].etiqueta}</text>
        <text x={x(puntos.length - 1)} y={H - 8} textAnchor="end" className="txt">{puntos.at(-1)!.etiqueta}</text>
      </svg>
      <figcaption>{titulo}</figcaption>
    </figure>
  );
}

export function GraficaBarras({ datos, titulo }: { datos: Array<{ fecha: string; valor: number }>; titulo: string }) {
  if (!datos.length) return <p className="vacio">Sin datos.</p>;
  const max = Math.max(...datos.map((d) => d.valor), 1);
  return (
    <figure className="grafica">
      <div className="barras" role="img" aria-label={titulo}>
        {datos.map((d) => (
          <div key={d.fecha} className="barra-col" title={`${fechaCorta(d.fecha)}: ${d.valor}`}>
            <span className="barra-num">{d.valor}</span>
            <div className="barra" style={{ height: `${(d.valor / max) * 100}%` }} />
            <span className="barra-fecha">{fechaCorta(d.fecha).slice(0, 5)}</span>
          </div>
        ))}
      </div>
      <figcaption>{titulo}</figcaption>
    </figure>
  );
}
