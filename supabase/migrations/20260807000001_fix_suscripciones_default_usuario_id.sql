-- =============================================================================
-- app-finanzas :: Fix RLS suscripciones - agregar DEFAULT auth.uid()
-- =============================================================================
-- CAUSA: Las tablas con usuario_id NOT NULL necesitan DEFAULT auth.uid()
-- para que PostgREST envíe el uid automáticamente. Sin esto, la política RLS
-- rechaza el INSERT porque usuario_id llega como NULL.

alter table public.suscripciones
  alter column usuario_id set default auth.uid();

comment on column public.suscripciones.usuario_id is
  'Usuario propietario. Asignado automáticamente de auth.uid() en INSERT.';
