-- =============================================================================
-- app-finanzas :: Fix — Trigger equivocado en fondos_mensuales
-- =============================================================================
-- La migracion de Fase 3 definio fn_bloquear_cambios_fondos_cerrado() pero el
-- trigger tr_bloquear_cambios_fondos_cerrado quedo apuntando a
-- fn_bloquear_cambios_periodo_cerrado(), que lee new.categoria_mensual_id.
-- Esa columna no existe en fondos_mensuales, asi que CUALQUIER update sobre la
-- tabla aborta con 42703 (PostgREST responde 400).
--
-- Se manifiesta al:
--   * editar el presupuesto de un fondo del mes,
--   * borrar un fondo_plantilla (el ON DELETE SET NULL hace un UPDATE sobre
--     fondos_mensuales.plantilla_id).

drop trigger if exists tr_bloquear_cambios_fondos_cerrado on public.fondos_mensuales;

create trigger tr_bloquear_cambios_fondos_cerrado
before update on public.fondos_mensuales
for each row
execute function public.fn_bloquear_cambios_fondos_cerrado();
