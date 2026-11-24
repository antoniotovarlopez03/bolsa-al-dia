# Estado — BOLSA AL DÍA

**Última actualización:** 24-11-2026

## Hecho
- Fase 1 (investigación): `docs/01-analisis-inicial.md`. Arquitectura aprobada por Antonio (Cloudflare Pages + GitHub público + Telegram).
- Fase 3 (prototipo, v0.1) con **DATOS DE EJEMPLO** marcados:
  - React + TypeScript + Vite + PWA (instalable, funciona sin internet).
  - Bienvenida en 3 pasos, Inicio, Mis bolsas (apuntar orden en bolsa / situación en tiempo real, gráfica, historial), SIPRI (convocatorias, estadísticas, calendario con exportación .ics), Más (perfil, copia de seguridad, privacidad, borrar datos, aviso legal).
  - Datos del usuario solo en el navegador (localStorage). Probado en vista móvil: sin errores.
- SIPRI: el desplegable de Adjudicados usa códigos de cuerpo (590, 597...) y de puesto de 8 cifras (p. ej. 00597038).

- Fase 4 (robot), primera versión:
  - `robot/sipri.mjs` lee Convocados, Plazas, Adjudicados y No cubiertas (~10 peticiones, pausa 2 s, máx. 40) y guarda **solo cifras** en `public/datos/and/` (`indice.json` + `convocatorias/AAAA-MM-DD.json`).
  - 8 pruebas (`npm run test:robot`) incluyen la comprobación de que no se guardan nombres/NIF.
  - Primera lectura real (24-11-2026): 2.123 convocados (98 especialidades), 486 plazas; adjudicación del 19-11: 199 adjudicados, 22 sin cubrir. Totales verificados.
  - `.github/workflows/robot-sipri.yml` preparado (lun–vie, 4 veces/día). **Inactivo** hasta subir a GitHub.

## Pendiente
1. ✅ Fuentes comprobadas: Convocados (con **número de orden**), Plazas, Adjudicados y No cubiertas devuelven JSON con el mismo sistema; ~6–8 peticiones por convocatoria. Ver docs, apartado 2.6.
2. Verificar el catálogo de especialidades (`src/datos/catalogo.ts`) contra el desplegable oficial.
3. Iconos PNG para instalar en iPhone (ahora solo SVG).
4. Fase 5: conectar la app a `public/datos/and/` (sustituir datos de ejemplo) y ampliar el catálogo con los 98 puestos de `indice.json` (incluidas bolsas bilingües).
5. Subir a GitHub (repo público) — **requiere permiso de Antonio y que cree su cuenta**.
6. Explicar en la app que "convocados" va de un orden mínimo a uno máximo (no es un corte único).

## Para retomar
`npm install` y luego `npm run dev` → http://localhost:5173. Leer `CLAUDE.md`.
