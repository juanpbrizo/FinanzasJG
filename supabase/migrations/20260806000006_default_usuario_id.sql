-- =============================================================================
-- app-finanzas :: Fix — usuario_id por defecto en tablas de usuario
-- =============================================================================
-- Los inserts desde el cliente no envian usuario_id, por lo que la policy RLS
-- (usuario_id = auth.uid()) falla con HTTP 403. Se agrega el default a nivel de
-- base para que PostgREST no dependa de que el frontend lo complete.
-- Nota: el DEFAULT no admite subqueries, se llama a auth.uid() directamente.

alter table public.fondos_plantilla
  alter column usuario_id set default auth.uid();

alter table public.tarjetas_credito
  alter column usuario_id set default auth.uid();
