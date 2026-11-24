// Iconos de línea propios (SVG), sobrios y del mismo grosor. Sin emojis ni librerías.
import type { SVGProps } from 'react';

const TRAZOS = {
  inicio: 'M3 10.5 12 4l9 6.5M5.5 9v10.5h4.75V14h3.5v5.5h4.75V9',
  bolsas: 'M4 19.5h16M6 16l4-5 3.5 3L18 7.5M18 7.5h-3.5M18 7.5V11',
  sipri: 'M8 4.5h8M8 4.5a1.5 1.5 0 0 0-1.5 1.5v0H5.5v14h13V6h-1a1.5 1.5 0 0 0-1.5-1.5M9 11h6M9 14.5h6M9 18h3.5',
  mas: 'M4.5 7h15M4.5 12h15M4.5 17h15',
  calendario: 'M5 6.5h14v13H5zM5 10.5h14M9 4.5v4M15 4.5v4',
  adjudicacion: 'M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0ZM8.5 12.2l2.4 2.4 4.6-4.9',
  estadisticas: 'M5 19.5V13M10 19.5V6.5M15 19.5v-9M20 19.5V9.5M3.5 19.5h17',
  convocatoria: 'M4 9.5v5h3l6 4v-13l-6 4H4ZM16.5 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11',
  info: 'M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM12 11v5M12 8h.01',
  alerta: 'M12 4 3 19.5h18L12 4ZM12 10v4.5M12 17h.01',
  abajo: 'M6 9l6 6 6-6',
  cerrar: 'M6.5 6.5l11 11M17.5 6.5l-11 11',
  bajar: 'M12 5v14M6.5 13.5 12 19l5.5-5.5',
  subir: 'M12 19V5M6.5 10.5 12 5l5.5 5.5',
  check: 'M5 12.5 9.5 17 19 7.5',
  descargar: 'M12 4.5v10M7.5 10.5 12 15l4.5-4.5M5 19.5h14',
  externo: 'M14 5h5v5M19 5l-8 8M17 14v5H5V7h5',
} as const;

export type NombreIcono = keyof typeof TRAZOS;

export function Icono({ nombre, tam = 22, ...resto }: { nombre: NombreIcono; tam?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={tam}
      height={tam}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...resto}
    >
      <path d={TRAZOS[nombre]} />
    </svg>
  );
}
