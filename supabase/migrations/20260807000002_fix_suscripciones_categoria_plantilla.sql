-- =============================================================================
-- app-finanzas :: Fix suscripciones - renombrar columna y agregar DEFAULT
-- =============================================================================
-- CAMBIOS:
--   1. Renombra categoria_mensual_id -> categoria_plantilla_id (para evitar
--      vincular a períodos específicos; la categoría_mensual se busca dinámicamente).
--   2. Agrega DEFAULT auth.uid() a usuario_id (necesario para que PostgREST
--      no rechace INSERT con 403 por RLS).

-- Primero: renombra la columna
alter table public.suscripciones
  rename column categoria_mensual_id to categoria_plantilla_id;

-- Después: actualiza la constraint de foreign key
alter table public.suscripciones
  drop constraint "suscripciones_categoria_mensual_id_fkey";

alter table public.suscripciones
  add constraint suscripciones_categoria_plantilla_id_fkey
    foreign key (categoria_plantilla_id)
    references public.categorias_plantilla (id)
    on delete set null;

-- Finalmente: agrega DEFAULT auth.uid()
alter table public.suscripciones
  alter column usuario_id set default auth.uid();

comment on column public.suscripciones.usuario_id is
  'Usuario propietario. Asignado automáticamente de auth.uid() en INSERT.';
comment on column public.suscripciones.categoria_plantilla_id is
  'Categoría plantilla. La categoría_mensual se busca dinámicamente en cada período.';
