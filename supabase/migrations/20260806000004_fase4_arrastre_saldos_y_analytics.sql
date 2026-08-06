-- =============================================================================
-- app-finanzas :: Fase 4 — Arrastre de Saldos, Analytics y Vistas
-- =============================================================================

-- 1. MEJORA: RPC inicializar_periodo ahora con arrastre de saldos (Tarea 3.8).
-- Se reemplaza la versión anterior con lógica de:
--   a) Clonar fondos/categorías desde plantilla
--   b) Clonar ingresos fijos
--   c) Calcular saldo final del mes anterior (si existe)
--   d) Sumar/restar ese saldo al monto_presupuestado del mes N+1 (si p_arrastrar_saldos=true)
create or replace function public.inicializar_periodo(
  p_periodo date,
  p_arrastrar_saldos boolean default true
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_usuario_id uuid := (select auth.uid());
  v_periodo_id uuid;
  v_periodo_anterior date;
  v_periodo_anterior_id uuid;
  v_fondo_plantilla record;
  v_fondo_mensual_id uuid;
  v_categoria_plantilla record;
  v_ingreso_fijo record;
  v_saldo_anterior numeric := 0;
  v_gastado_anterior numeric := 0;
  v_fondo_anterior record;
begin
  if v_usuario_id is null then
    raise exception 'No autenticado';
  end if;

  if extract(day from p_periodo) <> 1 then
    raise exception 'Periodo debe ser dia 1 del mes';
  end if;

  -- Verifica si el periodo ya existe.
  select id into v_periodo_id
  from public.periodos_mes
  where usuario_id = v_usuario_id and periodo = p_periodo;

  if v_periodo_id is not null then
    -- Ya existe: devuelve su ID (idempotente).
    return v_periodo_id;
  end if;

  -- Calcula el periodo anterior (mes N-1).
  v_periodo_anterior := (p_periodo - interval '1 month')::date;

  -- Obtiene el periodo anterior si existe.
  select id into v_periodo_anterior_id
  from public.periodos_mes
  where usuario_id = v_usuario_id and periodo = v_periodo_anterior;

  -- Si existe mes anterior y p_arrastrar_saldos=true, calcula su saldo.
  if v_periodo_anterior_id is not null and p_arrastrar_saldos then
    -- Suma el gastado del mes anterior.
    select coalesce(sum(m.monto), 0) into v_gastado_anterior
    from public.movimientos m
    join public.categorias_mensuales cm on cm.id = m.categoria_mensual_id
    join public.fondos_mensuales fm on fm.id = cm.fondo_mensual_id
    where fm.periodo_id = v_periodo_anterior_id;

    -- Suma el presupuestado del mes anterior.
    select coalesce(sum(monto_presupuestado), 0) into v_saldo_anterior
    from public.fondos_mensuales
    where periodo_id = v_periodo_anterior_id;

    -- Calcula el saldo final: presupuestado - gastado.
    v_saldo_anterior := v_saldo_anterior - v_gastado_anterior;
  end if;

  -- Crea el nuevo periodo.
  insert into public.periodos_mes (usuario_id, periodo, estado, inicializado_at)
  values (v_usuario_id, p_periodo, 'borrador', now())
  returning id into v_periodo_id;

  -- Clona fondos desde plantilla (con arrastre de saldos si aplica).
  for v_fondo_plantilla in
    select * from public.fondos_plantilla
    where usuario_id = v_usuario_id and activo = true
    order by prioridad asc
  loop
    declare
      v_monto_base numeric := v_fondo_plantilla.monto_sugerido;
      v_monto_final numeric;
    begin
      -- Si hay saldo anterior y es fondo de ahorro/inversión, suma primero.
      if v_saldo_anterior > 0 and v_fondo_plantilla.tipo in ('ahorro', 'inversion') then
        v_monto_final := v_monto_base + v_saldo_anterior;
        v_saldo_anterior := 0; -- Solo se suma a un fondo (el primero por prioridad).
      else
        v_monto_final := v_monto_base;
      end if;

      insert into public.fondos_mensuales (periodo_id, plantilla_id, nombre, monto_presupuestado, tipo, prioridad)
      values (v_periodo_id, v_fondo_plantilla.id, v_fondo_plantilla.nombre, v_monto_final, v_fondo_plantilla.tipo, v_fondo_plantilla.prioridad)
      returning id into v_fondo_mensual_id;

      -- Clona categorías de ese fondo.
      for v_categoria_plantilla in
        select * from public.categorias_plantilla
        where fondo_plantilla_id = v_fondo_plantilla.id
        order by nombre asc
      loop
        insert into public.categorias_mensuales (fondo_mensual_id, plantilla_id, nombre)
        values (v_fondo_mensual_id, v_categoria_plantilla.id, v_categoria_plantilla.nombre);
      end loop;
    end;
  end loop;

  -- Clona ingresos fijos del mes anterior (si existen).
  if v_periodo_anterior_id is not null then
    for v_ingreso_fijo in
      select * from public.ingresos
      where periodo_id = v_periodo_anterior_id and es_fijo = true
    loop
      insert into public.ingresos (periodo_id, descripcion, monto, es_fijo, fecha)
      values (v_periodo_id, v_ingreso_fijo.descripcion, v_ingreso_fijo.monto, v_ingreso_fijo.es_fijo, 
              (p_periodo + (extract(day from v_ingreso_fijo.fecha)::int - 1) * interval '1 day')::date);
    end loop;
  end if;

  return v_periodo_id;
end
$$;

comment on function public.inicializar_periodo(date, boolean) is
  'Inicializa un periodo clonando fondos/categorias/ingresos fijos, con arrastre opcional de saldos.';

grant execute on function public.inicializar_periodo(date, boolean)
  to authenticated;

-- 2. Vista para Analytics anual (Tarea 4.7).
-- Agrupa los últimos 12 meses con resumen de ingresos, presupuesto, gasto, ahorro, deuda TC.
create or replace view public.v_analytics_anual as
select
  pm.periodo,
  pm.id                                                  as periodo_id,
  coalesce(sum(i.monto), 0)                             as total_ingresos,
  coalesce(sum(fm.monto_presupuestado), 0)              as total_presupuestado,
  coalesce(sum(m.monto), 0)                             as total_gastado,
  (select coalesce(sum(fm2.monto_presupuestado), 0)
   from public.fondos_mensuales fm2
   where fm2.periodo_id = pm.id and fm2.tipo in ('ahorro', 'inversion'))
                                                         as monto_ahorro_inversion,
  (select coalesce(sum(cc.monto_total - coalesce(sum_pagado, 0)), 0)
   from public.compras_cuotas cc
   left join (
     select compra_cuota_id, sum(monto) as sum_pagado
     from public.movimientos
     group by compra_cuota_id
   ) m_pago on m_pago.compra_cuota_id = cc.id
   join public.tarjetas_credito tc on tc.id = cc.tarjeta_id
   where tc.usuario_id = pm.usuario_id
     and cc.primer_periodo_impacto <= pm.periodo
     and cc.primer_periodo_impacto + (cc.cantidad_cuotas - 1 || ' months')::interval > pm.periodo)
                                                         as deuda_tc_comprometida
from public.periodos_mes pm
left join public.ingresos i on i.periodo_id = pm.id
left join public.fondos_mensuales fm on fm.periodo_id = pm.id
left join public.categorias_mensuales cm on cm.fondo_mensual_id = fm.id
left join public.movimientos m on m.categoria_mensual_id = cm.id
group by pm.id, pm.periodo, pm.usuario_id
order by pm.periodo desc;

comment on view public.v_analytics_anual is
  'Vista de analytics anual: resumen de 12 meses con ingresos, presupuesto, gasto, ahorro y deuda TC comprometida.';
