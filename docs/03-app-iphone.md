# Bolsa Sur · App de iPhone (prueba técnica con TestFlight)

Mismo camino que Repasa FP: **Capacitor** (la app) + **Codemagic** (compila en un Mac en la nube) + **TestFlight** (pruebas).
Coste extra: **0 €** (la cuenta de Apple Developer ya está pagada; Codemagic tiene minutos gratis al mes).

## Qué hace esta primera versión
- Es la misma app de la web, pero instalada como app de iPhone (icono «Lista de clase», nombre «Bolsa Sur»).
- Botón **«Actualizar desde SIPRI»** (en Inicio y en Mis bolsas): abre la web **oficial** de SIPRI dentro de la app.
  El docente entra con su localizador / usuario IdEA / certificado y abre *Consultas → Situación provisional en bolsa*.
  La app lee en el propio móvil el orden en bolsa, la situación y la situación por provincias, y cierra SIPRI.
  **Nada se envía a ningún servidor.** Las contraseñas nunca se leen.
- Lo que se prueba: que SIPRI se abre bien dentro de la app y que los números se leen correctamente.
- Siguiente versión (si la prueba sale bien): guardar el localizador en el llavero del iPhone para actualizar con un toque,
  y avisos de Apple (convocatoria, adjudicación, notas de SIPRI).

## Pasos con Antonio (una sola vez)
1. **Identificador de la app** — developer.apple.com → Certificates, IDs & Profiles → Identifiers → «+» → App IDs →
   App → descripción «Bolsa Sur», Bundle ID explícito `es.bolsasur.app` → Continue → Register.
2. **App en App Store Connect** — appstoreconnect.apple.com → Apps → «+» → Nueva app: iOS, nombre «Bolsa Sur»
   (si está cogido: «Bolsa Sur · Docentes»), idioma español, bundle `es.bolsasur.app`, SKU `bolsasur`.
   Apuntar el **Apple ID** numérico de la app (Información de la app) → ponerlo en `codemagic.yaml` (`APP_STORE_APPLE_ID`).
3. **Codemagic con acceso al repositorio** — en GitHub, Settings → Applications → Codemagic → Configure →
   añadir el repositorio `bolsa-al-dia` (ahora solo tiene `repasa`).
4. **Codemagic** — codemagic.io → Add application → GitHub → `bolsa-al-dia` → detecta `codemagic.yaml` →
   **Start new build** (workflow «Bolsa Sur · iPhone (TestFlight)»). Tarda ~10–15 min.
5. **TestFlight** — en App Store Connect → la app → TestFlight → añadir el grupo interno (como «Equipo Repasa») y probar
   desde la app TestFlight del iPhone.

## Cómo probar
1. Abrir Bolsa Sur (TestFlight) → **Actualizar desde SIPRI**.
2. Entrar en SIPRI → *Consultas → Situación provisional en bolsa* → pulsar en tu bolsa.
3. La app debe cerrar SIPRI sola y mostrar «Orientación educativa: orden 603 · situación 37 · Almería 6, Granada 9…».
4. Si no lee nada: decir en qué pantalla de SIPRI estabas (captura sin nombre ni DNI) para ajustar el lector
   (`src/sipri/leer.ts`, pruebas en `robot/prueba-leer-sipri.mjs`).
