// Capturas para Google Play (1080×1920) y App Store (iPhone 6,9" 1320×2868) con datos públicos reales de SIPRI.
// El perfil solo elige especialidades y provincias (sin números personales inventados).
// Uso: PLAYWRIGHT=ruta/a/playwright-core node scripts/capturas-tiendas.mjs
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const require = createRequire(process.env.PLAYWRIGHT + '/package.json');
const { chromium } = require('playwright-core');
const BASE = process.env.BASE ?? 'https://bolsa-al-dia.vercel.app';
const CHROME = process.env.CHROME ?? join(homedir(), 'AppData', 'Local', 'ms-playwright', 'chromium-1234', 'chrome-win64', 'chrome.exe');

const perfil = {
  version: 1,
  comunidad: 'AND',
  creado: new Date().toISOString(),
  bolsas: [
    { bolsaId: 'AND-00590018', provincias: ['Granada', 'Málaga', 'Almería'], disponibilidad: 'activo', registros: [] },
    { bolsaId: 'AND-00597038', provincias: ['Granada', 'Jaén'], disponibilidad: 'activo', registros: [] },
  ],
};

const tamanos = [
  ['play', 360, 640],
  ['iphone69', 440, 956],
];
const pantallas = [
  ['1-inicio', null],
  ['2-sipri', 'SIPRI'],
  ['3-bolsas', 'Mis bolsas'],
  ['4-mas', 'Más'],
];

const b = await chromium.launch({ executablePath: CHROME });
try {
  for (const [nombre, w, h] of tamanos) {
    const dir = `capturas/${nombre}`;
    mkdirSync(dir, { recursive: true });
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: 'es-ES', serviceWorkers: 'block' });
    await ctx.addInitScript((p) => localStorage.setItem('bolsa-al-dia:perfil', JSON.stringify(p)), perfil);
    const pag = await ctx.newPage();
    await pag.goto(BASE, { waitUntil: 'networkidle' });
    for (const [archivo, pestana] of pantallas) {
      if (pestana) await pag.locator('nav button', { hasText: pestana }).first().click();
      await pag.waitForTimeout(1200);
      await pag.evaluate(() => window.scrollTo(0, 0));
      await pag.screenshot({ path: `${dir}/${archivo}.png` });
      console.log('✔', `${dir}/${archivo}.png`);
    }
    await ctx.close();
  }
} finally {
  await b.close();
}
