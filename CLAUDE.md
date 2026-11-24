# BOLSA AL DÍA — instrucciones del proyecto

PWA gratuita para que los docentes interinos de Andalucía sigan sus bolsas de trabajo y las convocatorias de SIPRI. Proyecto independiente (no oficial). Pensada para añadir otras comunidades en el futuro.

## Reglas del proyecto
- **Coste 0 €**: solo planes gratuitos, sin tarjeta. Pedir permiso a Antonio antes de cualquier servicio, dominio o cosa que pueda costar dinero.
- **Gratis para todos**: sin anuncios, suscripciones, versiones prémium ni compras.
- **Nunca** pedir contraseñas de SIPRI, IdEA, localizador, certificados, DNI ni NIF.
- **Sin nombres de personas**: los listados oficiales traen nombres; el robot los descarta al leer. Solo se guardan cifras.
- Datos del docente **solo en su dispositivo** (localStorage). Sin cuentas ni base de datos en la nube.
- No inventar datos. La app usa solo datos reales del robot; si alguna vez se usan datos de demostración, llevan la marca "DATOS DE EJEMPLO".
- Distinguir siempre: *Orden en bolsa* ≠ *Situación en tiempo real* ≠ *Convocado en una convocatoria*.
- Previsiones solo orientativas, con aviso de que no son oficiales.
- Respetar SIPRI: pocas lecturas (martes/jueves), no leer `/educacion/apl/consultabolsas/` (prohibido en robots.txt).
- No publicar ni desplegar sin permiso expreso. No poner el nombre de Antonio en la web.

## Arquitectura prevista
- PWA estática: React + TypeScript + Vite + vite-plugin-pwa. Alojamiento: **Vercel Hobby** (https://bolsa-al-dia.vercel.app), publica cada commit de `main`.
- Repo público: https://github.com/antoniotovarlopez03/bolsa-al-dia. Hacer push solo con permiso de Antonio.
- Robot: GitHub Actions (repo público) lee `https://sipri.juntadeandalucia.es/sipri/...` y genera JSON de cifras.
- Avisos: canal de Telegram (v1). Web Push más adelante si sigue siendo gratis.

## Código
- `src/datos/` tipos, catálogo (desde `indice.puestos`), `cargar.ts` (lee `/datos/and/`) · `src/pantallas/` las 5 pantallas · `src/almacen.ts` guardado local.
- `robot/` lector de SIPRI (`procesar.mjs` funciones puras con lista blanca de campos, `sipri.mjs` red y ficheros) → `public/datos/and/`.
- Comandos: `npm run dev` (local), `npm run build` (comprueba tipos y genera `dist/`), `npm run test:robot`, `npm run robot` (≈10 peticiones reales a SIPRI: no ejecutar sin necesidad).

## Documentos
- `docs/01-analisis-inicial.md` — viabilidad, fuentes SIPRI, arquitectura, costes, riesgos, fases.
- `ESTADO.md` — en qué punto está el proyecto.
- `NOTAS/` — decisiones relevantes (una línea cada una).
