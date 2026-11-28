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
- **Notificaciones** (27-11-2026, código hecho en local, falta configurar claves): `api/suscribir.ts` y `api/avisar.ts` (funciones de Vercel), `public/sw-avisos.js`, `src/avisos.ts` y tarjeta "Avisos en el móvil" (Más e Inicio). Suscripciones en Upstash Redis (Vercel Storage, gratis; Supabase gratis ya tenía 2 proyectos: Pulso y Repasa). El robot detecta convocatoria, adjudicación y notas nuevas y llama a `/api/avisar`; modo rápido cada 10 min mar/jue 9–15 h y lun 9–12 h (5 lecturas si no hay nada nuevo). Botón "aviso de prueba" en GitHub Actions. Pasos para Antonio: `docs/02-avisos-configuracion.md`.

- **App de iPhone (prueba técnica)** (27-11-2026, subida): App ID `es.bolsasur.app` registrado (con Push) y app "Bolsa Sur" creada en App Store Connect (Apple ID 6840082105). Capacitor 7 + carpeta `ios/` (bundle `es.bolsasur.app`), botón "Actualizar desde SIPRI" (navegador interno `cordova-plugin-inappbrowser`; `src/sipri/leer.ts` lee orden, situación y provincias en el móvil; pruebas `npm run test:sipri`). `codemagic.yaml` como Repasa FP (TestFlight interno). Pasos con Apple y Codemagic: `docs/03-app-iphone.md`.
  - 27-11: perfil de firma «Bolsa Sur App Store» (Apple) cargado en Codemagic (`bolsasur_app_store`, mismo certificado que Repasa). Build #2 correcta (versión 1.0 (1)) subida a TestFlight; grupo interno «Equipo Bolsa Sur» con Antonio y distribución automática. Logo cambiado a «Pizarra» (web, iconos e iPhone). `Info.plist` con `ITSAppUsesNonExemptEncryption=false` (sin pregunta de cifrado en próximas builds).

## Pendiente
1. Corregir errata en la descripción del repo de GitHub ("Andaucía").
2. Vigilar que el robot termina bien en GitHub (corrección subida y probada el 26-11).
3. Páginas de privacidad/aviso legal con contacto genérico.
4. Avisos configurados (27-11): Upstash conectado, VAPID y AVISOS_SECRET en Vercel, AVISOS_SECRET en GitHub. Falta: activar avisos en el móvil y probar con el aviso de prueba (GitHub Actions → Robot SIPRI → Run workflow).
5. Fase 6: pruebas en Android, iPhone y ordenador reales.
6. Más adelante: fichero de series por especialidad si el histórico crece mucho (ahora se cargan las 16 últimas convocatorias).

## Para retomar
`npm install`, `npm run dev` → http://localhost:5173. Leer `CLAUDE.md`. `npm run robot` hace ≈10 lecturas reales a SIPRI: usar con moderación.
  - 28-11: dominio **bolsasur.es** (OVH, 7,25 € 1.er año, renueva 6,99 €+IVA). Vercel: www.bolsasur.es principal, bolsasur.es → 308 www; bolsa-al-dia.vercel.app sigue igual (la app nativa y avisos la usan). DNS OVH: A @ 216.198.79.1, CNAME www → 9915f9c383c9e2e6.vercel-dns-017.com; MX/SPF de OVH intactos. Pendiente que Red.es publique el .es (horas) y añadir bolsasur.es a Zimbra (daba «recently created, retry») para crear hola@bolsasur.es (contraseña la pone Antonio).
  - 28-11: `/privacidad` (public/privacidad.html, vercel.json cleanUrls) enlazada en Más. Android: Capacitor android/ (es.bolsasur.app, iconos pizarra adaptables), firma en `firma-android/` (fuera de Git, contraseña en LEEME.txt: hacer copia), workflow Codemagic `android-play` (.aab; falta subir la llave a Codemagic como `bolsasur_subida`). Play: cuenta «AT Desarrollo Web» (personal → prueba cerrada 12 testers × 14 días).
  - 28-11 madrugada: **Google Play** (cuenta «AT Desarrollo Web»): app «Bolsa Sur: bolsas docentes» (es.bolsasur.app) creada; ficha (textos docs/04-fichas-tiendas.md, icono, gráfico y 4 capturas en capturas/play), categoría Educación, contacto hola@bolsasur.es, web www.bolsasur.es; cuestionarios completos (privacidad, sin anuncios, sin login, sin ID publicidad, no gubernamental, sin finanzas/salud, 18+, sin recogida de datos, IARC). Prueba cerrada Alpha: España, lista «Probadores Repasa FP» (17), versión 1.0 (4) (minSdk 24, target 36, AGP 8.9.1) **ENVIADA A REVISIÓN** (hasta 7 días). Después: 12 testers × 14 días → pedir producción. Firma: .aab sin firmar de Codemagic + `node scripts/firmar-android.mjs <aab>`.
  - Pendiente: correo hola@bolsasur.es (añadir bolsasur.es a Zimbra cuando OVH lo permita), ficha y envío App Store (textos ya en docs/04), comprobar que www.bolsasur.es resuelve.
  - 28-11: **App Store** ficha 1.0: textos (docs/04), URLs (vercel.app/privacidad y vercel.app), copyright «2026 AT Desarrollo Web», 4 capturas iPhone 1206×2622 y 4 iPad 2048×2732 (capturas/), compilación 1, notas en inglés, sin login. Información: subtítulo «Interinos de Andalucía · SIPRI», Educación/Productividad, contenido de terceros con derechos (datos públicos SIPRI), edad 4+. Privacidad: URL + «No se recopilan datos» (falta que Antonio pulse «Publicar»). Precio gratis; disponible solo en España. Falta (Antonio): contacto de revisión (nombre, teléfono +34, correo) y «Añadir a revisión» → «Enviar».
  - 28-11: Privacidad publicada por Antonio; contacto de revisión puesto. **App Store 1.0 ENVIADA A REVISIÓN** («Pendiente de revisión»). Esperar correo de Apple (1-2 días). Si pide información (2.1): vídeo en iPhone + notas en inglés (ver skill publicar-apps).
