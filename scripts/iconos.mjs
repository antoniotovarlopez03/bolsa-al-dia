// Genera los iconos de Bolsa Sur (logo «Lista de clase»: cuaderno con tu fila resaltada).
// Uso: npm run iconos  (solo hace falta al cambiar el diseño del icono)
import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';

const VERDE = '#007a33';
const AMARILLO = '#ffcf3f';

/** Cuaderno de espiral con renglones y una fila resaltada (lienzo de 512). */
const cuaderno = () => `
  <rect x="126" y="76" width="286" height="360" rx="28" fill="#ffffff"/>
  ${[126, 186, 246, 306, 366, 412].map((y) => `<circle cx="126" cy="${y}" r="17" fill="${VERDE}"/>`).join('')}
  <g stroke="#cfe3d6" stroke-width="16" stroke-linecap="round">
    <line x1="178" y1="146" x2="378" y2="146"/><line x1="178" y1="206" x2="378" y2="206"/>
    <line x1="178" y1="330" x2="378" y2="330"/><line x1="178" y1="390" x2="348" y2="390"/>
  </g>
  <rect x="162" y="240" width="232" height="58" rx="18" fill="${AMARILLO}"/>`;

const svg = ({ redondeado, escala }) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" ${redondeado ? 'rx="112"' : ''} fill="${VERDE}"/>
  <g transform="translate(256 256) scale(${escala}) translate(-260 -256)">${cuaderno()}</g></svg>`);

const salidas = [
  // [archivo, tamaño, redondeado, escala del dibujo]
  ['public/icono-192.png', 192, true, 0.92],
  ['public/icono-512.png', 512, true, 0.92],
  ['public/icono-maskable-512.png', 512, false, 0.72], // Android recorta: dibujo dentro de la zona segura
  ['public/apple-touch-icon.png', 180, false, 0.85], // iPhone redondea las esquinas por su cuenta
  ['public/favicon-32.png', 32, true, 1],
];

for (const [archivo, tam, redondeado, escala] of salidas) {
  await writeFile(archivo, await sharp(svg({ redondeado, escala })).resize(tam, tam).png().toBuffer());
  console.log('✔', archivo);
}
// Versión vectorial para el navegador.
await writeFile('public/icono.svg', svg({ redondeado: true, escala: 0.92 }).toString() + '\n');
console.log('✔ public/icono.svg');

// Icono de la app de iPhone (1024×1024, sin esquinas: iOS las redondea). Solo si existe el proyecto ios/.
import { existsSync } from 'node:fs';
const RUTA_IOS = 'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png';
if (existsSync(RUTA_IOS)) {
  await writeFile(RUTA_IOS, await sharp(svg({ redondeado: false, escala: 0.85 })).resize(1024, 1024).flatten({ background: VERDE }).png().toBuffer());
  console.log('✔', RUTA_IOS);
}
