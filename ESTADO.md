# Estado — BOLSA AL DÍA

**Última actualización:** 24-11-2026

## Hecho
- Fase 1 (investigación): `docs/01-analisis-inicial.md`. Arquitectura aprobada por Antonio (Cloudflare Pages + GitHub público + Telegram).
- Fase 3 (prototipo, v0.1) con **DATOS DE EJEMPLO** marcados:
  - React + TypeScript + Vite + PWA (instalable, funciona sin internet).
  - Bienvenida en 3 pasos, Inicio, Mis bolsas (apuntar orden en bolsa / situación en tiempo real, gráfica, historial), SIPRI (convocatorias, estadísticas, calendario con exportación .ics), Más (perfil, copia de seguridad, privacidad, borrar datos, aviso legal).
  - Datos del usuario solo en el navegador (localStorage). Probado en vista móvil: sin errores.
- SIPRI: el desplegable de Adjudicados usa códigos de cuerpo (590, 597...) y de puesto de 8 cifras (p. ej. 00597038).

## Pendiente
1. ✅ Fuentes comprobadas: Convocados (con **número de orden**), Plazas, Adjudicados y No cubiertas devuelven JSON con el mismo sistema; ~6–8 peticiones por convocatoria. Ver docs, apartado 2.6.
2. Verificar el catálogo de especialidades (`src/datos/catalogo.ts`) contra el desplegable oficial.
3. Iconos PNG para instalar en iPhone (ahora solo SVG).
4. Fase 4: robot de lectura (GitHub Actions) → JSON sin nombres.
5. Aún no hay repositorio git ni nada publicado.

## Para retomar
`npm install` y luego `npm run dev` → http://localhost:5173. Leer `CLAUDE.md`.
