// Genera los iconos de Bolsa Sur (logo «Pizarra»: pizarra verde con marco de madera y una línea que sube).
// Uso: npm run iconos  (solo hace falta al cambiar el diseño del icono)
import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';

const MADERA = '#7b4a26';
const VERDE = '#1d7a3c';
const AMARILLO = '#ffcf3f';

/** Pizarra (lienzo de 512): marco de madera, encerado verde, línea de tiza que sube, punto amarillo, borrador. */
const pizarra = () => `
  <rect x="24" y="24" width="464" height="464" rx="104" fill="${MADERA}"/>
  <rect x="70" y="70" width="372" height="310" rx="34" fill="${VERDE}"/>
  <polyline points="122,316 210,256 256,290 334,190 400,160" fill="none" stroke="#fff" stroke-width="26" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="400" cy="160" r="26" fill="${AMARILLO}"/>
  <rect x="104" y="410" width="304" height="26" rx="13" fill="#5a3418"/>
  <rect x="300" y="396" width="64" height="28" rx="10" fill="#ffffff"/>`;

const svg = ({ redondeado, escala }) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  ${redondeado ? '' : `<rect width="512" height="512" fill="${MADERA}"/>`}
  <g transform="translate(256 256) scale(${escala}) translate(-256 -256)">${pizarra()}</g></svg>`);

const salidas = [
  // [archivo, tamaño, redondeado, escala del dibujo]
  ['public/icono-192.png', 192, true, 1],
  ['public/icono-512.png', 512, true, 1],
  ['public/icono-maskable-512.png', 512, false, 0.8], // Android recorta: dibujo dentro de la zona segura
  ['public/apple-touch-icon.png', 180, false, 1.08], // iPhone redondea las esquinas por su cuenta
  ['public/favicon-32.png', 32, true, 1],
];

for (const [archivo, tam, redondeado, escala] of salidas) {
  await writeFile(archivo, await sharp(svg({ redondeado, escala })).resize(tam, tam).png().toBuffer());
  console.log('✔', archivo);
}
// Versión vectorial para el navegador.
await writeFile('public/icono.svg', svg({ redondeado: true, escala: 1 }).toString() + '\n');
console.log('✔ public/icono.svg');

// Icono de la app de iPhone (1024×1024, sin esquinas: iOS las redondea). Solo si existe el proyecto ios/.
import { existsSync } from 'node:fs';
const RUTA_IOS = 'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png';
if (existsSync(RUTA_IOS)) {
  await writeFile(RUTA_IOS, await sharp(svg({ redondeado: false, escala: 1.08 })).resize(1024, 1024).flatten({ background: MADERA }).png().toBuffer());
  console.log('✔', RUTA_IOS);
}

// Iconos de la app de Android (solo si existe el proyecto android/). Icono adaptable: fondo madera + pizarra.
const RES = 'android/app/src/main/res';
if (existsSync(RES)) {
  const densidades = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
  // Primer plano sin fondo: Android recorta el icono (zona segura ≈ 61 % del lienzo).
  const primerPlano = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <g transform="translate(256 256) scale(0.66) translate(-256 -256)">${pizarra()}</g></svg>`);
  const redondo = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <circle cx="256" cy="256" r="256" fill="${MADERA}"/>
  <g transform="translate(256 256) scale(0.8) translate(-256 -256)">${pizarra()}</g></svg>`);
  for (const [d, f] of Object.entries(densidades)) {
    const dir = `${RES}/mipmap-${d}`;
    await writeFile(`${dir}/ic_launcher.png`, await sharp(svg({ redondeado: true, escala: 1 })).resize(48 * f, 48 * f).png().toBuffer());
    await writeFile(`${dir}/ic_launcher_round.png`, await sharp(redondo).resize(48 * f, 48 * f).png().toBuffer());
    await writeFile(`${dir}/ic_launcher_foreground.png`, await sharp(primerPlano).resize(108 * f, 108 * f).png().toBuffer());
  }
  await writeFile(`${RES}/values/ic_launcher_background.xml`,
    `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${MADERA}</color>\n</resources>\n`);
  console.log('✔ iconos de Android');
}
