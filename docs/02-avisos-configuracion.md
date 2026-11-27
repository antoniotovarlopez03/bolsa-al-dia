# Bolsa Sur · Cómo activar los avisos (notificaciones)

Coste: **0 €**. Todo con planes gratuitos y sin tarjeta. Mismo sistema de avisos que Repasa FP; las suscripciones se guardan en Upstash Redis (gratis, desde Vercel).

## Cómo funciona

```
Robot (GitHub)  ──detecta novedad en SIPRI──►  /api/avisar (Vercel)  ──►  avisos a los móviles suscritos
                                                     │
                                         Upstash Redis: lista de suscripciones
                                         (buzón anónimo + especialidades + provincias)
```

- El robot revisa SIPRI **cada 10 minutos** los martes y jueves de 9:00 a 14:59 y los lunes de 9:00 a 11:59
  (hora de España en invierno). Si no hay nada nuevo, solo hace 5 lecturas.
- Avisa de: **nueva convocatoria** (con cuántas plazas de tus especialidades hay en tus provincias),
  **adjudicación publicada** y **notas nuevas de SIPRI**.
- No se guarda ningún nombre, correo ni contraseña.

## Lo que tienes que hacer tú (una sola vez)

Las claves las copias y pegas tú. Nunca me las pases por el chat.

### 1. Upstash Redis (guardar las suscripciones)
1. Vercel → proyecto **bolsa-al-dia** → pestaña **Storage** → **Create Database** → **Upstash for Redis** → plan **Free**, región Frankfurt.
2. Nombre `bolsa-sur-avisos` → **Create** → **Connect Project** → elige `bolsa-al-dia` (entornos Production, Preview y Development).
3. Vercel añade solas las variables `KV_REST_API_URL` y `KV_REST_API_TOKEN`: no hay que copiar nada.

### 2. Claves de avisos (VAPID)
En la terminal de Visual Studio Code, dentro de la carpeta del proyecto:
```
npx web-push generate-vapid-keys
```
Salen dos claves: **Public Key** → `VAPID_PUBLIC_KEY` y **Private Key** → `VAPID_PRIVATE_KEY`.

### 3. Contraseña interna entre el robot y la web
En la misma terminal:
```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copia el resultado: será `AVISOS_SECRET` (se pone en Vercel **y** en GitHub, el mismo valor).

### 4. Vercel
Proyecto **bolsa-al-dia** → **Settings → Environment Variables** → añade estas 3 (entorno *Production*):
`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `AVISOS_SECRET`.
Después: **Deployments → … → Redeploy** (para que lea las variables).

### 5. GitHub
Repositorio **bolsa-al-dia** → **Settings → Secrets and variables → Actions → New repository secret**:
nombre `AVISOS_SECRET`, valor el mismo del paso 3.

### 6. Probar
1. En el móvil abre la app (en iPhone, **desde el icono de la pantalla de inicio**) → **Más → Activar avisos** → Permitir.
2. GitHub → **Actions → Robot SIPRI → Run workflow** → marca **“Enviar un aviso de prueba”** → Run.
3. En 1–2 minutos debe llegar: “Nuevo aviso de SIPRI · Aviso de SIPRI: Prueba: los avisos de Bolsa Sur funcionan.”

## Límites y riesgos

| Servicio | Límite gratuito | Si se supera |
|---|---|---|
| Upstash Redis Free | 256 MB y 500.000 comandos/mes (cada aviso masivo es 1 lectura) | Se detiene hasta el mes siguiente; nunca cobra sin tarjeta |
| Vercel Hobby | Funciones con límite de tiempo | Con muchísimos usuarios habría que repartir el envío en tandas |
| GitHub Actions | Gratis (repositorio público) | Las ejecuciones programadas pueden retrasarse algunos minutos |
| Avisos web | Gratis (los entregan Google/Apple/Mozilla) | — |

- **iPhone:** los avisos web solo llegan con la app añadida a la pantalla de inicio (iOS 16.4 o posterior).
- **Retrasos:** GitHub no garantiza la hora exacta de las ejecuciones; el aviso puede llegar unos minutos después
  de la publicación. Si hiciera falta más precisión, se puede pasar la revisión a Cloudflare (gratis).
