-- =============================================================================
-- app-finanzas :: Fix — Producto cartesiano en v_resumen_periodo
-- =============================================================================
-- La version original hacia LEFT JOIN directo de ingresos + fondos_mensuales +
-- categorias_mensuales + movimientos y luego sum() sobre el resultado. Cada
-- ingreso se repetia una vez por cada fila del cruce fondos x categorias, por
-- lo que total_ingresos y total_presupuestado quedaban multiplicados.
--
-- Solucion: agregar cada metrica en su propia subconsulta y unirlas 1:1 por
-- periodo_id.

drop view if exists public.v_resumen_periodo;

create view public.v_resumen_periodo
with (security_invoker = true) as
select
  pm.id         as periodo_id,
  pm.usuario_id,
  pm.periodo,
  coalesce(i.total_ingresos, 0)      as total_ingresos,
  coalesce(f.total_presupuestado, 0) as total_presupuestado,
  coalesce(g.total_gastado, 0)       as total_gastado,
  coalesce(i.total_ingresos, 0) - coalesce(f.total_presupuestado, 0) as dinero_sin_asignar
from public.periodos_mes pm
left join (
  select periodo_id, sum(monto) as total_ingresos
  from public.ingresos
  group by periodo_id
) i on i.periodo_id = pm.id
left join (
  select periodo_id, sum(monto_presupuestado) as total_presupuestado
  from public.fondos_mensuales
  group by periodo_id
) f on f.periodo_id = pm.id
left join (
  select fm.periodo_id, sum(mov.monto) as total_gastado
  from public.movimientos mov
  join public.categorias_mensuales cm on cm.id = mov.categoria_mensual_id
  join public.fondos_mensuales fm on fm.id = cm.fondo_mensual_id
  group by fm.periodo_id
) g on g.periodo_id = pm.id;

comment on view public.v_resumen_periodo is
  'Resumen agregado de un mes: ingresos, presupuesto, gasto y dinero sin asignar. Cada metrica se agrega por separado para evitar multiplicacion de filas.';

grant select on public.v_resumen_periodo to authenticated;

-- -----------------------------------------------------------------------------
-- v_analytics_anual sufre exactamente el mismo problema de multiplicacion.
-- -----------------------------------------------------------------------------
drop view if exists public.v_analytics_anual;

create view public.v_analytics_anual
with (security_invoker = true) as
select
  pm.periodo,
  pm.id                              as periodo_id,
  coalesce(i.total_ingresos, 0)      as total_ingresos,
  coalesce(f.total_presupuestado, 0) as total_presupuestado,
  coalesce(g.total_gastado, 0)       as total_gastado,
  (select coalesce(sum(fm2.monto_presupuestado), 0)
   from public.fondos_mensuales fm2
   where fm2.periodo_id = pm.id and fm2.tipo in ('ahorro', 'inversion'))
                                     as monto_ahorro_inversion,
  (select coalesce(sum(cc.monto_total - coalesce(p.sum_pagado, 0)), 0)
   from public.compras_cuotas cc
   join public.tarjetas_credito tc on tc.id = cc.tarjeta_id
   left join (
     select compra_cuota_id, sum(monto) as sum_pagado
     from public.movimientos
     where compra_cuota_id is not null
     group by compra_cuota_id
   ) p on p.compra_cuota_id = cc.id
   where tc.usuario_id = pm.usuario_id
     and cc.primer_periodo_impacto <= pm.periodo
     and cc.primer_periodo_impacto + ((cc.cantidad_cuotas - 1) || ' months')::interval > pm.periodo)
                                     as deuda_tc_comprometida
from public.periodos_mes pm
left join (
  select periodo_id, sum(monto) as total_ingresos
  from public.ingresos
  group by periodo_id
) i on i.periodo_id = pm.id
left join (
  select periodo_id, sum(monto_presupuestado) as total_presupuestado
  from public.fondos_mensuales
  group by periodo_id
) f on f.periodo_id = pm.id
left join (
  select fm.periodo_id, sum(mov.monto) as total_gastado
  from public.movimientos mov
  join public.categorias_mensuales cm on cm.id = mov.categoria_mensual_id
  join public.fondos_mensuales fm on fm.id = cm.fondo_mensual_id
  group by fm.periodo_id
) g on g.periodo_id = pm.id
order by pm.periodo desc;

comment on view public.v_analytics_anual is
  'Analytics anual: ingresos, presupuesto, gasto, ahorro y deuda TC por mes, sin multiplicacion de filas.';

grant select on public.v_analytics_anual to authenticated;
