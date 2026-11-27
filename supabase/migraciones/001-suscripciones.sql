-- Bolsa Sur · suscripciones a avisos (notificaciones web).
-- Ejecutar UNA vez en Supabase → SQL Editor. Plan gratuito.
-- Solo se guarda lo imprescindible para enviar el aviso: la dirección del "buzón" de avisos del navegador
-- y qué especialidades/provincias quiere seguir. Sin nombres, correos ni contraseñas.

create table if not exists public.suscripciones (
  endpoint     text primary key,             -- dirección de avisos que da el navegador
  p256dh       text not null,                -- clave pública del navegador (cifrado del aviso)
  auth         text not null,
  puestos      text[] not null default '{}', -- códigos de especialidad (p. ej. 00590018)
  provincias   text[] not null default '{}',
  tipos        text[] not null default '{convocatoria,adjudicacion,notas}',
  creada       timestamptz not null default now(),
  actualizada  timestamptz not null default now()
);

-- Seguridad: nadie puede leer ni escribir desde fuera; solo las funciones de Vercel con la clave de servicio.
alter table public.suscripciones enable row level security;
