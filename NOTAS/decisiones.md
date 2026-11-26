# Decisiones

- 2026-11-24 — Arquitectura sin servidor ni cuentas: PWA estática + robot en GitHub Actions + datos del usuario solo en el móvil (coste 0 € y menos riesgo RGPD).
- 2026-11-24 — Antonio aprueba: Cloudflare Pages + código público en GitHub + avisos por Telegram.
- 2026-11-24 — Gráficas en SVG propio (sin librería) y localStorage en vez de IndexedDB en v0.1: menos dependencias; perfil < 1 MB.
- 2026-11-24 — Antonio elige repo **público** (sabiendo que se ve su usuario) y publicar en **Vercel** (como sus otras webs) en vez de Cloudflare.
- 2026-11-24 — Antonio pide verde Junta y nada de emojis: iconos SVG propios. Para no parecer web oficial: "no oficial" visible y sin escudo ni logotipo de la Junta.
- 2026-11-26 — Sin colaborar con Radar Docente (decisión de Antonio): el histórico se construye desde la fuente oficial (`/sipri/normativa/historico`, ~477 convocatorias desde 2018), nunca copiando su web.
- 2026-11-26 — Prioridad del cliente: app personal, que se actualice y notifique → app nativa (Antonio ya tiene cuentas Apple y Google) con acceso a SIPRI dentro de la app; credenciales solo en el móvil.
- 2026-11-24 — Fuente principal del robot: `POST /sipri/convocados/buscar` (JSON con `orden` por bolsa). El campo `apellidoNombreNif` se descarta al leer.
- 2026-11-24 — No guardar nombres/NIF de los listados de SIPRI; solo cifras agregadas.
