-- =============================================================================
-- app-finanzas :: Fix — Resolver sobrecarga de inicializar_periodo
-- =============================================================================
-- La migracion de Fase 1 creo public.inicializar_periodo(date) y la de Fase 4
-- creo public.inicializar_periodo(date, boolean). Ambas coexisten en la base y
-- PostgREST no puede resolver la llamada cuando solo se envia p_periodo:
--   "Could not choose the best candidate function between: ..."
--
-- La version de Fase 4 es la vigente (incluye arrastre de saldos), asi que se
-- elimina la version de un solo argumento.

drop function if exists public.inicializar_periodo(date);

-- Reasegura los permisos sobre la version vigente.
grant execute on function public.inicializar_periodo(date, boolean) to authenticated;
