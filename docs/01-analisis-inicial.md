# BOLSA AL DÍA — Análisis inicial (Fase 1)

Fecha: 24 de noviembre de 2026 · Estado: propuesta para revisar con Antonio. No hay código todavía.

> Herramienta informativa **independiente**. No pertenece a la Junta de Andalucía ni a SIPRI.

---

## Resumen en 6 líneas

1. **Es viable y puede costar 0 €**: una web instalable (PWA) estática + un "robot" gratuito que lee SIPRI dos veces por semana.
2. **La posición del docente en su bolsa NO es pública**: solo la ve cada persona entrando en SIPRI con su usuario. Por eso **el docente escribirá su número a mano** en la app (sin contraseñas).
3. **Lo que sí es público** (sin entrar): plazas convocadas, convocados, adjudicados, plazas no cubiertas, etc. Son páginas web (tablas HTML) y PDF. **No hay API ni datos abiertos.**
4. Los listados públicos **contienen nombres de personas**. La app **no guardará ni mostrará nombres ni NIF**: solo cifras (por bolsa, provincia y fecha).
5. Los datos del docente se guardan **solo en su móvil** (no hay cuentas, ni servidor con datos personales).
6. Avisos: empezar por un **canal de Telegram gratuito**; las notificaciones push en el móvil, más adelante y solo si siguen siendo gratis.

---

## 1. Análisis de viabilidad

| Aspecto | Valoración | Comentario |
|---|---|---|
| Técnica | ✅ Alta | Web estática + script programado. Tecnología muy probada. |
| Económica (0 €) | ✅ Alta | Todo cabe en planes gratuitos sin tarjeta. Ver apartado 4 y 7. |
| Datos | ⚠️ Media | Hay datos públicos semanales, pero sin API: hay que leer páginas web. La posición individual no es pública. |
| Legal / privacidad | ⚠️ Media | Se puede reutilizar información pública, **pero no los datos personales** (nombres). Diseño "sin nombres" y "sin cuentas". |
| Competencia | ⚠️ | Ya existen MiraBolsa, sipri.es, sipriandalucia.es (todas privadas). Nuestra diferencia: gratis total, sin anuncios, muy sencilla, privada y transparente con las fuentes. |
| Mantenimiento | ⚠️ | Si la Junta cambia el diseño de su web, el robot deja de leer y hay que ajustarlo. Es el riesgo principal. |

**Conclusión:** viable. La primera versión será útil aunque el docente tenga que escribir su número de orden a mano.

---

## 2. Investigación: cómo obtener los datos de SIPRI

### 2.1 Fuente oficial

- Única web oficial (según aviso de la propia web, 10-nov-2026): **https://sipri.juntadeandalucia.es/sipri/**
- Normativa base: **Orden de 10 de junio de 2020** (bolsas de trabajo docentes).
- Portal de bolsas de la Consejería: juntadeandalucia.es › educación › profesorado › bolsas de trabajo e interinidades.

### 2.2 Cómo funciona SIPRI (según sus preguntas frecuentes oficiales)

- **Dos convocatorias por semana: martes y jueves**, para sustituciones y vacantes sobrevenidas.
- Plazo de **24 horas hábiles** para participar; después se publica la adjudicación y sus anexos.
- La situación en las bolsas cambia **al terminar cada convocatoria**, no a diario.
- El tiempo de servicio solo se actualiza al final de curso (30 de junio).
- SIPRI **ya envía correo/SMS** a los convocados (no compite con esto: la app informa, no sustituye).

### 2.3 ⚠️ Dos conceptos distintos (no se deben confundir)

| Concepto | Qué es | Quién lo ve |
|---|---|---|
| **Orden en bolsa** (posición general) | Puesto que ocupas entre **todas** las personas de tu bolsa este curso. Cambia poco. | Solo tú, entrando en SIPRI. |
| **Situación en tiempo real** (posición efectiva) | Cuántas personas tienes **realmente delante**, sin contar quien ya trabaja, está no disponible, inactivo o excluido. Cambia tras cada convocatoria. | Solo tú, entrando en SIPRI. |
| **Convocado en una convocatoria** | Haber sido llamado en una convocatoria concreta (martes/jueves) para pedir plazas. | Listado público de convocados. |

La app mostrará siempre estos tres conceptos **por separado y con su nombre oficial**.

### 2.4 Secciones públicas comprobadas (sin iniciar sesión)

| Sección | Dirección (dentro de sipri.juntadeandalucia.es) | Formato |
|---|---|---|
| Plazas convocadas | `/sipri/plazas/plaza` | Tabla web |
| Convocados | `/sipri/convocados/convocados` | Tabla web |
| Adjudicados | `/sipri/adjudicaciones/adjudicacion` | Tabla web con filtros (cuerpo, puesto, provincia, NIF) |
| No disponibles / inactivos voluntarios | `/sipri/adjudicaciones/andeinac` | Tabla web |
| Inactivos de oficio | `/sipri/adjudicaciones/inactivos` | Tabla web |
| Propuestas de exclusión | `/sipri/adjudicaciones/exclusion` | Tabla web |
| Plazas no cubiertas | `/sipri/adjudicaciones/nocubiertas` | Tabla web |
| No adjudicados | `/sipri/adjudicaciones/noadjudicados` | Tabla web |
| Normativa y resoluciones | `/sipri/normativa/normativa` | PDF |

Columnas de "Adjudicados": orden de plaza adjudicada, ID plaza, **nombre**, centro, provincia, localidad, puesto, fecha prevista de cese, participación, observaciones.

### 2.5 Lo que NO existe o NO es público

- ❌ No hay **API**, ni **datos abiertos**, ni **RSS**.
- ❌ No hay descarga en CSV/Excel.
- ❌ La **posición individual en bolsa** requiere acceso con usuario IdEA, localizador o certificado. **La app nunca pedirá esas credenciales.**
- ❌ El `robots.txt` de juntadeandalucia.es **prohíbe a robots** la ruta `/educacion/apl/consultabolsas/` (consulta de bolsas). **La respetaremos: no la leeremos.**
- ℹ️ Las rutas `/sipri/...` no tienen prohibición en robots.txt (el subdominio no tiene robots.txt propio).
- ℹ️ Las páginas solo muestran **la última convocatoria**: si no guardamos cada una, el histórico se pierde. Por eso nuestro robot guardará una copia (solo cifras) cada martes y jueves.

### 2.6 ✅ Comprobado el 24-11-2026 (convocatoria del 24 de noviembre)

- La página de **Convocados** carga sus filas pidiendo datos por dentro (formato JSON): `POST /sipri/convocados/buscar` con `pos`, `puesto` (código de 8 cifras), `offset`, `limit`. Hay que abrir antes la página para obtener la cookie de sesión.
- Respuesta: `{ total, rows: [{ orden, apellidoNombreNif, puesto }] }`.
  - **`orden` = número de orden en bolsa de cada persona convocada.** Ejemplo: Educación Primaria tenía 275 convocados.
  - `apellidoNombreNif` = dato personal → **el robot lo descartará siempre, sin guardarlo**.
  - No hay provincia en este listado: los convocados van por bolsa (especialidad).
- Con esto el robot puede calcular, por bolsa y convocatoria: **número de convocados y hasta qué número de orden se ha llegado**. Es lo que la app comparará con el número que escribe el docente.
- Sin filtrar especialidad (`puesto` vacío) devuelve **todas** las bolsas a la vez (2.123 convocados el 24-11).

#### Los cuatro listados (todos con el mismo sistema, comprobado el 24-11-2026)

Todos: abrir la página (cookie) → `POST` con `pos=0`, `offset`, `limit` (hasta 1000) y filtros vacíos → JSON `{ total, rows }`.

| Listado | Dirección de datos | Campos útiles | Campo personal (se descarta) | Filas 24-11 |
|---|---|---|---|---|
| Convocados | `/sipri/convocados/buscar` | `orden` (orden en bolsa), `puesto` | `apellidoNombreNif` | 2.123 |
| Plazas convocadas | `/sipri/plazas/buscar` | `idPlaza`, `centro`, `provincia`, `localidad`, `puesto`, `tipo` (sustitución/vacante), `numPla`, `participacion` (O/V…), `fFinAus` (cese previsto), `latitud`, `longitud` | — | 486 |
| Adjudicados (conv. anterior) | `/sipri/adjudicaciones/buscar` | `idPlaza`, `centro`, `dProvincia`, `dLocalidad`, `puesto`, `participacion` | `apellidosNombreDni` | 199 |
| Plazas no cubiertas | `/sipri/adjudicaciones/buscarNoCubiertas` | igual que Plazas + `observaciones` (p. ej. "Desierta/as") | — | 22 |

Notas:
- En Adjudicados, `orden` parece el orden de la plaza adjudicada (valores 1, 1, 2…), **no** el orden en bolsa. No se usará como posición hasta aclararlo.
- Los códigos de puesto tienen prefijos distintos según la bolsa: `005…` (ordinaria), `105…`/`115…` (bilingües, p. ej. `11597034` Educación Física bilingüe inglés). El catálogo de la app debe incluirlos.
- **Coste por convocatoria: unas 6–8 peticiones** (3 páginas de convocados + plazas + adjudicados + no cubiertas). Muy por debajo de cualquier uso abusivo.
- Las páginas solo muestran la convocatoria vigente: el histórico depende de que el robot guarde cada una.

### 2.6 bis — Lo que se planteaba comprobar (histórico)

Hoy (martes) las tablas estaban vacías porque la convocatoria aún no se había publicado. Hay que mirar una convocatoria real para confirmar:

1. Si el listado de **convocados** muestra el **número de orden** de cada persona (clave: permitiría decir "esta semana se ha convocado hasta el número X de tu bolsa").
2. Si se puede saber **la bolsa/especialidad y provincia** de cada fila.
3. Si las tablas se cargan directamente o mediante JavaScript (cambia cómo se programa el robot).

**Si el número de orden no aparece**, la app seguirá siendo útil con: número de plazas por especialidad y provincia, plazas no cubiertas, calendario y la posición que el docente escriba a mano. No inventaremos ningún dato.

### 2.7 Uso responsable de la web oficial

- Máximo **unas pocas lecturas los martes y jueves** (y una revisión diaria ligera de la portada y normativa). Nunca consultas por cada usuario.
- Identificación honesta del robot y pausa entre peticiones.
- **Descartar nombres y NIF en el momento de leer**: solo se guardan recuentos y números.
- Enlazar siempre a la fuente oficial y mostrar la fecha de cada dato.

---

## 3. Arquitectura propuesta a 0 €

```
 ┌──────────────────────────┐   martes/jueves    ┌──────────────────────────┐
 │  Web oficial SIPRI       │ ◄────────────────  │  ROBOT (GitHub Actions)  │
 │  (solo lectura pública)  │   pocas lecturas   │  - lee tablas públicas   │
 └──────────────────────────┘                    │  - QUITA nombres/NIF     │
                                                 │  - guarda cifras en JSON │
                                                 │  - avisa por Telegram    │
                                                 └────────────┬─────────────┘
                                                              │ publica
                                                              ▼
 ┌──────────────────────────┐   descarga JSON    ┌──────────────────────────┐
 │  MÓVIL DEL DOCENTE (PWA) │ ◄────────────────  │  Web estática gratuita   │
 │  - su perfil y números   │                    │  (Cloudflare Pages o     │
 │    guardados SOLO aquí   │                    │   GitHub Pages)          │
 │  - gráficas, calendario  │                    └──────────────────────────┘
 └──────────────────────────┘
```

**Ideas clave:**

- **Sin servidor propio y sin base de datos en la nube.** Los datos públicos son ficheros JSON pequeños que se publican junto a la web.
- **Sin cuentas de usuario.** El perfil (especialidades, número de orden, provincias) vive en el móvil (IndexedDB). Borrar = un botón.
- **Copia de seguridad opcional**: exportar/importar un fichero, sin nube.
- **Multicomunidad desde el diseño**: cada comunidad será un "conector" con el mismo formato de datos (`comunidad / cuerpo / especialidad / provincia / fecha`). Andalucía es el primero.
- **Si algo falla, se apaga solo lo secundario**: si el robot no puede leer SIPRI, la app sigue funcionando y muestra "Datos actualizados por última vez el …".

### 3.1 Comparativa de alternativas (resumida)

| Opción | Pros | Contras | Decisión |
|---|---|---|---|
| **PWA estática** (React + Vite) | 0 €, instalable en Android e iPhone, sin tiendas | iPhone limita algunas funciones (push solo si se instala) | ✅ Elegida |
| App nativa (Play/App Store) | Push nativo | Google Play 25 € (pago único), Apple 99 €/año | ❌ No ahora |
| Next.js con servidor | Potente | Necesita servidor/funciones con límites y posible coste | ❌ Innecesario |
| Supabase / Firebase (BD en nube) | Cuentas y sincronización | Datos personales en la nube (más RGPD), Firebase pide tarjeta para planes ampliados, Supabase pausa proyectos inactivos | ❌ No en v1 |
| Robot en GitHub Actions | Gratis en repos públicos, programable | Puede retrasarse unos minutos; se desactiva si el repo no tiene actividad 60 días | ✅ Elegida |
| Robot en Cloudflare Workers (cron) | Gratis 100.000 peticiones/día | Límite de 10 ms de CPU, poco para leer muchas tablas | 🔁 Alternativa |

---

## 4. Límites realistas de esta arquitectura

| Recurso | Límite gratuito (comprobar antes de usar) | Uso previsto | Margen |
|---|---|---|---|
| Cloudflare Pages – visitas a la web estática | Ilimitadas | Cualquier número de docentes | ✅ Muy alto |
| Cloudflare Pages – publicaciones (builds) | 500 / mes | ~30–60 / mes | ✅ |
| GitHub Actions (repositorio público) | Minutos gratis en ejecutores estándar | ~5 min × 2–3 veces/semana | ✅ |
| GitHub – tamaño del repositorio | Recomendado < 1 GB | JSON de cifras: pocos MB/curso | ✅ |
| Telegram Bot API | Gratis; ~30 mensajes/segundo | Pocos mensajes por convocatoria | ✅ |
| Almacenamiento en el móvil | Varios MB por web | < 1 MB | ✅ |

**Qué no podrá hacer la v1:** conocer automáticamente tu posición (no es pública), avisos instantáneos al segundo (el robot pasa a horas fijas), ni sincronizar entre tu móvil y tu ordenador (salvo exportar/importar).

---

## 5. Tecnologías gratuitas recomendadas

| Para qué | Tecnología | Licencia |
|---|---|---|
| Interfaz | React + TypeScript + Vite | MIT |
| Instalable (PWA) | vite-plugin-pwa (Workbox) | MIT |
| Estilos | CSS propio con variables (o Tailwind) | MIT |
| Gráficas | Recharts o Chart.js | MIT |
| Datos en el móvil | IndexedDB con Dexie.js | Apache 2.0 |
| Calendario | Componente propio sencillo + exportar a `.ics` (Google/Apple Calendar) | — |
| Robot lector | Node.js + Cheerio (si las tablas vienen en HTML) o Playwright (si usan JavaScript) | MIT / Apache 2.0 |
| Lectura de PDF | pdf.js / pdfjs-dist | Apache 2.0 |
| Pruebas | Vitest + Playwright | MIT / Apache 2.0 |
| Código y robot | GitHub (repo público) + GitHub Actions | Plan gratuito |
| Alojamiento | Cloudflare Pages (alternativa: GitHub Pages) | Plan gratuito |
| Avisos | Canal de Telegram + bot | Gratuito |
| Dirección web | Subdominio gratuito `*.pages.dev` (dominio propio = ~10 €/año, opcional) | — |

---

## 6. Diseño inicial de pantallas

Navegación inferior con 4 botones grandes: **Inicio · Mis bolsas · SIPRI · Más**.

### 6.1 Inicio
```
┌─────────────────────────────────┐
│ Buenos días, Ana 👋              │  (nombre opcional, solo en el móvil)
│ Datos de SIPRI: jueves 20/11 ✔   │
├─────────────────────────────────┤
│ MIS BOLSAS                       │
│ ┌─────────────────────────────┐ │
│ │ 0597 Inglés · Primaria       │ │
│ │ Tu orden en bolsa: 1.245     │ │
│ │ Situación tiempo real: 312 ▼ │ │  (escrito por ti el 18/11)
│ │ Última convocatoria: hasta   │ │
│ │ nº 1.180 en Sevilla*         │ │  *solo si el dato es público
│ │ [ Actualizar mi número ]     │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ NOVEDADES SIPRI                  │
│ • Adjudicación 19/11 publicada   │
│ • 14 plazas de Inglés convocadas │
├─────────────────────────────────┤
│ [Convocatorias] [Adjudicaciones] │
│ [Estadísticas]  [Calendario]     │
└─────────────────────────────────┘
```

### 6.2 Mis bolsas (detalle de una bolsa)
- Tarjetas grandes con los **tres conceptos** del apartado 2.3, cada uno con un botón "¿Qué significa?".
- Gráfica de evolución de *tu* situación (con los números que vas apuntando).
- Historial: fecha · número · cambio respecto a la vez anterior.
- Plazas de esa especialidad por provincia (dato público).

### 6.3 SIPRI
- Lista de convocatorias (martes/jueves) con: plazas ofertadas, adjudicadas, no cubiertas, por especialidad y provincia. **Sin nombres.**
- Cada dato con su etiqueta "Fuente: SIPRI, publicado el …" y enlace oficial.

### 6.4 Estadísticas y previsiones
- Plazas por semana, por especialidad y provincia; comparación entre fechas y cursos.
- Previsión **orientativa** solo con datos suficientes, con aviso fijo: *"Estimación sin valor oficial. No es una fecha de llamamiento."*

### 6.5 Calendario
- Martes/jueves de convocatoria, adjudicaciones, plazos de alegaciones e incorporaciones publicadas. Botón "Añadir a mi calendario".

### 6.6 Más
- Mi perfil (especialidades, provincias, disponibilidad), Avisos (enlace al canal de Telegram), Privacidad, **Borrar todos mis datos**, Exportar/importar, Fuentes de datos, Aviso legal ("herramienta independiente, no oficial").

### 6.7 Estilo
- Azul petróleo + verde suave + fondo claro; modo oscuro.
- Letra del sistema, mínimo 16 px; botones de al menos 48 px; alto contraste (WCAG AA).
- Pantalla de bienvenida de 3 pasos: elegir especialidad → escribir número (opcional) → elegir provincias.
- Los **datos de demostración** del prototipo llevarán una franja visible: "DATOS DE EJEMPLO".

---

## 7. Riesgos técnicos y económicos

### 7.1 Tabla de costes y límites

| Servicio | Para qué sirve | Coste mensual | Límite gratuito | Si se supera | Riesgo de cargo automático | Alternativa gratuita |
|---|---|---|---|---|---|---|
| GitHub (repo público) | Guardar el código y los datos | 0 € | Repos públicos ilimitados | Avisos; no cobra sin tarjeta | **Nulo** sin tarjeta ni plan de pago | GitLab, Codeberg |
| GitHub Actions | Robot lector programado | 0 € | Gratis en repos públicos (ejecutores estándar) | No se ejecuta | **Nulo** sin tarjeta (límite de gasto 0 € por defecto) | Cloudflare Workers cron |
| Cloudflare Pages | Publicar la web | 0 € | Visitas estáticas ilimitadas; 500 builds/mes | Se pausan las publicaciones hasta el mes siguiente | **Nulo** en plan Free sin tarjeta | GitHub Pages, Netlify Free |
| Telegram (bot + canal) | Avisos de novedades | 0 € | Gratuito | Mensajes retrasados | **Nulo** | Correo con límite, RSS |
| Web Push (fase posterior) | Avisos en el móvil | 0 € | Gratis (servicios del navegador); necesita guardar suscripciones | — | Bajo si se usa Cloudflare KV Free | Telegram |
| Dominio propio (opcional) | Dirección bonita | ~1 €/mes (~10 €/año) | — | — | **Sí, renovación anual** → solo con tu permiso | `*.pages.dev` gratis |
| Google Play / App Store (no previsto) | Tiendas | 25 € único / 99 €/año | — | — | Sí | PWA |

### 7.2 Medidas para que nunca haya facturas

- **No se registrará ninguna tarjeta** en ningún servicio. Sin tarjeta, ninguno de los anteriores puede cobrar.
- Solo planes "Free"/"Hobby"; se documenta en `docs/` cada servicio dado de alta.
- El robot tiene **límite de tiempo** (máx. 10 min) y **límite de peticiones** fijo en el código.
- La app no tiene servidor propio: aunque la usen 100.000 docentes, el coste no crece.
- Si un servicio se agota: la app muestra los últimos datos guardados y un aviso; nunca se amplía el plan.

### 7.3 Riesgos técnicos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| La Junta cambia el diseño de SIPRI y el robot deja de leer | Media | Alto | Pruebas automáticas que detectan el fallo y avisan; la app muestra "datos desactualizados". |
| El número de orden no aparece en listados públicos | Media | Medio | La app se apoya en el número que escribe el docente. |
| La Junta bloquea o pide no hacer lecturas automáticas | Baja | Alto | Pocas lecturas; si lo piden, se para y se pasa a introducción manual de datos. |
| GitHub desactiva el robot tras 60 días sin actividad | Media | Medio | El propio robot guarda datos (actividad) y un recordatorio en verano. |
| iPhone: notificaciones solo con la app instalada (iOS 16.4+) | Alta | Bajo | Telegram como canal principal. |
| Errores en la lectura dan datos falsos | Media | Alto | Validaciones (totales cuadrados, comparar con la portada), mostrar fuente y fecha. |
| Confusión de usuarios con la web oficial | Media | Medio | Aviso visible "no oficial", nombre y colores distintos a los de la Junta. |

### 7.4 Privacidad (RGPD)

- No se piden contraseñas, certificados, DNI ni NIF.
- Nombres de los listados oficiales: **se descartan** al leer; nunca se guardan ni se publican.
- Datos del docente: **solo en su dispositivo**. Sin cookies de seguimiento ni analítica (o, como mucho, Cloudflare Web Analytics, sin cookies).
- Página de privacidad clara y botón "Borrar mis datos".
- El nombre de Antonio **no aparecerá** en la web salvo que lo pida (hará falta un contacto genérico para el aviso legal).

---

## 8. Plan de desarrollo por fases

| Fase | Qué se hace | Resultado | Coste |
|---|---|---|---|
| **1. Investigación** (hecha en parte) | Fuentes, normativa, apps existentes. **Falta:** revisar una convocatoria real (2.6). | Este documento + nota de verificación | 0 € |
| **2. Diseño** | Modelo de datos multicomunidad, textos de ayuda, maqueta navegable de pantallas | Maqueta para que la pruebes en el móvil | 0 € |
| **3. Prototipo** | PWA en React con **datos de ejemplo marcados**. Perfil, bolsas, gráficas, calendario. Funciona sin internet. | Web en tu ordenador (sin publicar) | 0 € |
| **4. Datos reales** | Robot que lee SIPRI martes/jueves, quita nombres, guarda cifras y lo validamos contra la web oficial varias semanas | JSON reales verificados | 0 € |
| **5. App funcional** | Conectar la app a los datos reales, estadísticas, canal de Telegram | Versión completa | 0 € |
| **6. Pruebas** | Android, iPhone, ordenador; accesibilidad; seguridad; lectores de pantalla | Informe de pruebas | 0 € |
| **7. Publicación** | Publicar en Cloudflare Pages (**solo con tu permiso**), páginas de privacidad y aviso legal | Enlace instalable | 0 € |

### Próximo paso propuesto

1. **Comprobar una convocatoria real de SIPRI** (el jueves o el próximo martes) para confirmar si el número de orden aparece en "Convocados". Solo lectura, una visita.
2. Mientras tanto, empezar la **Fase 2 (diseño)** y el esqueleto del **prototipo** con datos de ejemplo.

### Decisiones que necesito de ti

- ¿Te parece bien **Cloudflare Pages** para publicar (o prefieres GitHub Pages)? Ambas gratuitas; requieren crear cuenta **tú mismo**.
- ¿Te parece bien que el código sea **público** en GitHub? (Necesario para que el robot sea gratis; no contiene datos personales.)
- ¿Avisos por **Telegram** en la primera versión?

---

## Fuentes consultadas (24-11-2026)

- Web oficial SIPRI: https://sipri.juntadeandalucia.es/sipri/ (secciones de plazas, convocados y adjudicaciones)
- Preguntas frecuentes oficiales SIPRI: https://sipri.juntadeandalucia.es/sipri/doc/faqs.pdf
- robots.txt de la Junta: https://www.juntadeandalucia.es/robots.txt
- Bolsas de trabajo e interinidades (Junta): https://www.juntadeandalucia.es/educacion/portales/web/educacion/profesorado/bolsas-de-trabajo-e-interinidades
- Apps/webs no oficiales existentes: https://sipri.es/ · https://sipriandalucia.es/ · MiraBolsa (App Store)
- Límites de Cloudflare: https://developers.cloudflare.com/pages/platform/limits · https://developers.cloudflare.com/workers/platform/limits
- Servicio de avisos por correo de SIPRI (CSIF): https://www.csif.es/eu/noticia/portada/andaluciaeducacion/articulo/30932

Los límites de servicios gratuitos pueden cambiar: se revisarán antes de dar de alta cada servicio.
