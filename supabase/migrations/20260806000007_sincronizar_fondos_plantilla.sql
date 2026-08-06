-- =============================================================================
-- app-finanzas :: Sincronizacion de fondos plantilla -> instancia mensual
-- =============================================================================
-- inicializar_periodo() es idempotente: si el periodo ya existe devuelve su id
-- sin clonar nada. Eso deja meses vacios cuando el usuario configuro la
-- plantilla DESPUES de inicializar. Esta RPC permite re-sincronizar.
--
-- Comportamiento:
--   * Inserta los fondos de plantilla que aun no existen en el mes.
--   * Inserta las categorias faltantes de cada fondo ya existente.
--   * NO pisa montos editados manualmente en el mes (on conflict do nothing).

create or replace function public.sincronizar_fondos_desde_plantilla(p_periodo date)
returns integer language plpgsql security definer set search_path = '' as $$
declare
  v_usuario_id uuid := (select auth.uid());
  v_periodo_id uuid;
  v_estado text;
  v_fondo_plantilla record;
  v_fondo_mensual_id uuid;
  v_categoria_plantilla record;
  v_creados integer := 0;
begin
  if v_usuario_id is null then
    raise exception 'No autenticado';
  end if;

  select id, estado into v_periodo_id, v_estado
  from public.periodos_mes
  where usuario_id = v_usuario_id and periodo = p_periodo;

  if v_periodo_id is null then
    raise exception 'El periodo % no existe. Inicializalo primero.', p_periodo;
  end if;

  if v_estado = 'cerrado' then
    raise exception 'El periodo % esta cerrado y no admite cambios.', p_periodo;
  end if;

  for v_fondo_plantilla in
    select * from public.fondos_plantilla
    where usuario_id = v_usuario_id and activo = true
    order by prioridad asc
  loop
    select id into v_fondo_mensual_id
    from public.fondos_mensuales
    where periodo_id = v_periodo_id and nombre = v_fondo_plantilla.nombre;

    if v_fondo_mensual_id is null then
      insert into public.fondos_mensuales
        (periodo_id, plantilla_id, nombre, monto_presupuestado, tipo, prioridad)
      values
        (v_periodo_id, v_fondo_plantilla.id, v_fondo_plantilla.nombre,
         v_fondo_plantilla.monto_sugerido, v_fondo_plantilla.tipo, v_fondo_plantilla.prioridad)
      returning id into v_fondo_mensual_id;

      v_creados := v_creados + 1;
    end if;

    for v_categoria_plantilla in
      select * from public.categorias_plantilla
      where fondo_plantilla_id = v_fondo_plantilla.id and activo = true
      order by nombre asc
    loop
      insert into public.categorias_mensuales
        (fondo_mensual_id, plantilla_id, nombre, monto_presupuestado)
      values
        (v_fondo_mensual_id, v_categoria_plantilla.id, v_categoria_plantilla.nombre,
         v_categoria_plantilla.monto_sugerido)
      on conflict (fondo_mensual_id, nombre) do nothing;
    end loop;
  end loop;

  return v_creados;
end
$$;

comment on function public.sincronizar_fondos_desde_plantilla(date) is
  'Re-clona los fondos/categorias de la plantilla hacia un periodo ya existente sin pisar montos editados.';

grant execute on function public.sincronizar_fondos_desde_plantilla(date) to authenticated;
