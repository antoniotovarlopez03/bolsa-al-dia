// Genera los iconos PNG de la app a partir de un dibujo SVG.
// Uso: npm run iconos  (solo hace falta al cambiar el diseño del icono)
import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';

const VERDE = '#007a33';
const barras = (escala = 1) => {
  // Tres barras ascendentes centradas en un lienzo de 512.
  const s = escala, c = 256;
  const r = (x, y, w, h, o) =>
    `<rect x="${c + (x - c) * s}" y="${c + (y - c) * s}" width="${w * s}" height="${h * s}" rx="${18 * s}" fill="#fff" opacity="${o}"/>`;
  return r(120, 282, 72, 118, 0.7) + r(220, 206, 72, 194, 0.85) + r(320, 112, 72, 288, 1);
};

const svg = ({ redondeado, escala }) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" ${redondeado ? 'rx="112"' : ''} fill="${VERDE}"/>${barras(escala)}</svg>`);

const salidas = [
  // [archivo, tamaño, redondeado, escala del dibujo]
  ['public/icono-192.png', 192, true, 1],
  ['public/icono-512.png', 512, true, 1],
  ['public/icono-maskable-512.png', 512, false, 0.78], // Android recorta: dibujo dentro de la zona segura
  ['public/apple-touch-icon.png', 180, false, 0.9], // iPhone redondea las esquinas por su cuenta
  ['public/favicon-32.png', 32, true, 1.1],
];

for (const [archivo, tam, redondeado, escala] of salidas) {
  await writeFile(archivo, await sharp(svg({ redondeado, escala })).resize(tam, tam).png().toBuffer());
  console.log('✔', archivo);
}
