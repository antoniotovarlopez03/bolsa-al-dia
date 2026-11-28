// Icono 512×512 y gráfico de cabecera 1024×500 para Google Play (salen en capturas/play/).
import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'node:fs';
mkdirSync('capturas/play', { recursive: true });
const icono = readFileSync('public/icono.svg', 'utf8');
await sharp(Buffer.from(icono)).resize(512, 512).png().toFile('capturas/play/icono-512.png');
const dibujo = icono.replace(/^[\s\S]*?<g /, '<g ').replace(/<\/svg>\s*$/, '');
const cabecera = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500">
  <rect width="1024" height="500" fill="#007a33"/>
  <svg x="70" y="90" width="320" height="320" viewBox="0 0 512 512">${dibujo}</svg>
  <text x="440" y="215" font-family="Segoe UI, Arial, sans-serif" font-size="86" font-weight="700" fill="#ffffff">Bolsa Sur</text>
  <text x="444" y="285" font-family="Segoe UI, Arial, sans-serif" font-size="36" fill="#e6f3eb">Tus bolsas docentes de Andalucía</text>
  <text x="444" y="345" font-family="Segoe UI, Arial, sans-serif" font-size="28" fill="#ffcf3f">Gratis · Sin anuncios · App no oficial</text>
</svg>`;
await sharp(Buffer.from(cabecera)).png().toFile('capturas/play/grafico-1024x500.png');
console.log('✔ capturas/play/icono-512.png y grafico-1024x500.png');
