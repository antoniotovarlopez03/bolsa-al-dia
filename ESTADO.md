# Estado — BOLSA SUR (antes Bolsa al Día)

**Última actualización:** 27-11-2026 · versión 0.4

## Hecho
- **Fase 1** (investigación): `docs/01-analisis-inicial.md`. Arquitectura aprobada (Cloudflare Pages + GitHub público + Telegram).
- **Fase 3** (prototipo): PWA React + TypeScript + Vite, instalable y usable sin conexión.
- **Fase 4** (robot): `robot/sipri.mjs` lee Convocados (con nº de orden), Plazas, Adjudicados y No cubiertas (~10 peticiones) y guarda **solo cifras** en `public/datos/and/`. 9 pruebas (`npm run test:robot`). Catálogo de 116 especialidades (incl. bilingües, ZTS, puestos específicos). Tarea de GitHub Actions preparada, **inactiva** hasta subir a GitHub.
- **Fase 5** (app con datos reales): sin datos de ejemplo. Inicio, Mis bolsas (rango de orden convocado y comparación orientativa con tu número, evolución, historial), SIPRI (convocatorias, estadísticas, calendario de martes/jueves habituales), aviso si los datos tienen más de 7 días. Datos guardados para uso sin conexión (NetworkFirst). Probado en vista móvil.

- **Publicado (24-11-2026)**, con permiso de Antonio:
  - App: https://bolsa-al-dia.vercel.app (Vercel Hobby, gratis; se republica sola con cada commit).
  - Código: https://github.com/antoniotovarlopez03/bolsa-al-dia (público, decisión de Antonio).
  - Robot activo en GitHub Actions (lun–vie, 4 veces/día). Primera ejecución en GitHub: correcta.

- **Detalle de plazas** (26-11-2026): el robot guarda cada plaza sin personas en `convocatorias/AAAA-MM-DD.plazas.json` (centro, localidad, tipo, participación, cese, coordenadas, motivo); la app lo muestra en SIPRI y en Mis bolsas. Robot: reintento de red y error visible como anotación en GitHub (fallaba el 25 y 26-11 porque no reconocía el aviso de SIPRI entre convocatoria y adjudicación; corregido en local).
- **Diseño v0.3** (24-11-2026, publicado): verde Junta #007A33, barra superior con logotipo y "no oficial", iconos SVG de línea propios (`src/componentes/Iconos.tsx`), sin emojis. Iconos PNG de la app (Android, iPhone, favicon) generados con `npm run iconos`.

- **Situación por provincias** (26-11-2026, en local): "Mis bolsas" permite apuntar orden, situación tras la última adjudicación (la principal, como en SIPRI), situación por provincia y tiempo real (opcional). Inicio muestra cada provincia con su cambio; gráfica por provincia. SIPRI actualiza tras cada adjudicación (jueves y lunes) y cuando alguien vuelve a la bolsa.

- **Mejoras sin nombres** (26-11-2026, en local): el robot guarda los números de orden convocados por bolsa (sin nombres), las observaciones de cada plaza (jornada reducida, centro voluntario…) y las notas informativas de la portada de SIPRI (`novedades.json`). La app dice "¿Estás convocado?" con tu orden, filtra plazas obligatorias/voluntarias, muestra "Avisos de SIPRI" en Inicio y el caso "estás trabajando".
- **Decisiones del cliente** (26-11-2026): prioridad app de tiendas (Capacitor + Codemagic, como Repasa FP) con conexión a SIPRI dentro de la app y notificaciones. Sin buscador por nombre (RGPD). Sin colaborar con Radar Docente; histórico propio desde `/sipri/normativa/historico` (~477 convocatorias desde 2018). Antonio quiere probar antes la web.

- **Nombre y logo** (27-11-2026, en local): la app pasa a llamarse **Bolsa Sur**; logo «Lista de clase» (cuaderno con tu fila resaltada en amarillo), iconos regenerados con `npm run iconos`. La clave de guardado local sigue siendo `bolsa-al-dia:` para no perder datos. La dirección web y el repositorio siguen como `bolsa-al-dia` (cambiarlos rompería los enlaces ya enviados).
- **Notificaciones** (decidido): igual que Repasa FP — notificaciones web (VAPID, web-push) + avisos de Apple en la app de iPhone, Supabase para las suscripciones y Vercel para enviar; el robot revisa SIPRI más a menudo en las franjas de publicación.

## Pendiente
1. Corregir errata en la descripción del repo de GitHub ("Andaucía").
2. Vigilar que el robot termina bien en GitHub (corrección subida y probada el 26-11).
3. Páginas de privacidad/aviso legal con contacto genérico.
4. Notificaciones (lo que más pide el cliente), con el sistema de Repasa FP: suscripciones en Supabase, envío desde Vercel, el robot revisa SIPRI cada pocos minutos en las franjas de publicación. Recordatorio "actualiza tu número" tras cada adjudicación.
5. Fase 6: pruebas en Android, iPhone y ordenador reales.
6. Más adelante: fichero de series por especialidad si el histórico crece mucho (ahora se cargan las 16 últimas convocatorias).

## Para retomar
`npm install`, `npm run dev` → http://localhost:5173. Leer `CLAUDE.md`. `npm run robot` hace ≈10 lecturas reales a SIPRI: usar con moderación.
