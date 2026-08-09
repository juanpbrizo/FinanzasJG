-- =============================================================================
-- app-finanzas :: Edicion y eliminacion de gastos en periodos abiertos
-- =============================================================================
-- Contexto:
--   * La policy "movimientos propios" (esquema inicial) es FOR ALL, asi que
--     UPDATE y DELETE sobre movimientos propios ya estaban permitidos por RLS.
--   * El trigger tr_bloquear_cambios_movimientos_cerrado solo cubria
--     INSERT y UPDATE: un DELETE sobre un periodo cerrado pasaba, violando R5.
--
-- Esta migracion:
--   1. Vuelve la funcion de bloqueo consciente de TG_OP (usa OLD en DELETE y
--      valida ambos lados en UPDATE, por si se mueve un movimiento entre
--      periodos).
--   2. Extiende el trigger a DELETE.

create or replace function public.fn_bloquear_cambios_periodo_cerrado()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_periodo_estado public.estado_periodo;
begin
  -- En UPDATE se controla tanto el periodo destino (new) como el origen (old).
  if tg_op in ('INSERT', 'UPDATE') then
    select pm.estado into v_periodo_estado
    from public.periodos_mes pm
    join public.fondos_mensuales fm on fm.periodo_id = pm.id
    join public.categorias_mensuales cm on cm.fondo_mensual_id = fm.id
    where cm.id = new.categoria_mensual_id;

    if v_periodo_estado = 'cerrado' then
      raise exception 'No se puede modificar un movimiento en un periodo cerrado';
    end if;
  end if;

  if tg_op in ('UPDATE', 'DELETE') then
    select pm.estado into v_periodo_estado
    from public.periodos_mes pm
    join public.fondos_mensuales fm on fm.periodo_id = pm.id
    join public.categorias_mensuales cm on cm.fondo_mensual_id = fm.id
    where cm.id = old.categoria_mensual_id;

    if v_periodo_estado = 'cerrado' then
      raise exception 'No se puede modificar un movimiento en un periodo cerrado';
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end
$$;

drop trigger if exists tr_bloquear_cambios_movimientos_cerrado on public.movimientos;
create trigger tr_bloquear_cambios_movimientos_cerrado
before insert or update or delete on public.movimientos
for each row
execute function public.fn_bloquear_cambios_periodo_cerrado();
