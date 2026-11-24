# Estado — BOLSA AL DÍA

**Última actualización:** 24-11-2026 · versión 0.2

## Hecho
- **Fase 1** (investigación): `docs/01-analisis-inicial.md`. Arquitectura aprobada (Cloudflare Pages + GitHub público + Telegram).
- **Fase 3** (prototipo): PWA React + TypeScript + Vite, instalable y usable sin conexión.
- **Fase 4** (robot): `robot/sipri.mjs` lee Convocados (con nº de orden), Plazas, Adjudicados y No cubiertas (~10 peticiones) y guarda **solo cifras** en `public/datos/and/`. 9 pruebas (`npm run test:robot`). Catálogo de 116 especialidades (incl. bilingües, ZTS, puestos específicos). Tarea de GitHub Actions preparada, **inactiva** hasta subir a GitHub.
- **Fase 5** (app con datos reales): sin datos de ejemplo. Inicio, Mis bolsas (rango de orden convocado y comparación orientativa con tu número, evolución, historial), SIPRI (convocatorias, estadísticas, calendario de martes/jueves habituales), aviso si los datos tienen más de 7 días. Datos guardados para uso sin conexión (NetworkFirst). Probado en vista móvil.

- **Publicado (24-11-2026)**, con permiso de Antonio:
  - App: https://bolsa-al-dia.vercel.app (Vercel Hobby, gratis; se republica sola con cada commit).
  - Código: https://github.com/antoniotovarlopez03/bolsa-al-dia (público, decisión de Antonio).
  - Robot activo en GitHub Actions (lun–vie, 4 veces/día). Primera ejecución en GitHub: correcta.

## Pendiente
1. Corregir errata en la descripción del repo de GitHub ("Andaucía").
2. Vigilar las primeras ejecuciones automáticas del robot (jueves 26-11).
3. Iconos PNG para iPhone; páginas de privacidad/aviso legal con contacto genérico.
4. Canal de Telegram para avisos.
5. Fase 6: pruebas en Android, iPhone y ordenador reales.
6. Más adelante: fichero de series por especialidad si el histórico crece mucho (ahora se cargan las 16 últimas convocatorias).

## Para retomar
`npm install`, `npm run dev` → http://localhost:5173. Leer `CLAUDE.md`. `npm run robot` hace ≈10 lecturas reales a SIPRI: usar con moderación.
