-- =============================================================================
-- app-finanzas :: Diferimiento real de cuotas + limite disponible por tarjeta
-- =============================================================================
-- BUG 1: `registrar_compra_cuotas` liquidaba la primera cuota en el acto, por lo
--        que una compra hecha antes del cierre aumentaba los gastos del mes en
--        curso. Ahora la compra solo se registra en `compras_cuotas`; el
--        movimiento lo crea `inicializar_periodo` / `sincronizar_fondos_desde_plantilla`
--        cuando llega el periodo de vencimiento.
-- BUG 2: el primer periodo de impacto ignoraba `tarjetas_credito.mes_impacto_offset`,
--        asi que el resumen que cierra este mes se imputaba a este mes en vez de
--        al mes de vencimiento (subsiguiente al cierre).
-- BUG 3: el limite disponible se calculaba contra los movimientos liquidados, de
--        modo que una compra en N cuotas solo descontaba la cuota del mes.

-- -----------------------------------------------------------------------------
-- 1. Helper puro: primer periodo de impacto de una compra.
--    cierre  = mes de la compra si dia <= dia_cierre, si no el mes siguiente.
--    impacto = cierre + mes_impacto_offset (1 = vence el mes siguiente al cierre).
-- -----------------------------------------------------------------------------
create or replace function public.calcular_primer_periodo_impacto(
  p_fecha_compra date,
  p_dia_cierre integer,
  p_mes_impacto_offset integer default 1
)
returns date language sql immutable set search_path = '' as $$
  select (
    date_trunc(
      'month',
      case
        when extract(day from p_fecha_compra) <= p_dia_cierre then p_fecha_compra
        else p_fecha_compra + interval '1 month'
      end
    ) + make_interval(months => coalesce(p_mes_impacto_offset, 1))
  )::date;
$$;

comment on function public.calcular_primer_periodo_impacto(date, integer, integer) is
  'Regla R2: mes de cierre de la compra desplazado por mes_impacto_offset de la tarjeta.';

grant execute on function public.calcular_primer_periodo_impacto(date, integer, integer) to authenticated;

-- -----------------------------------------------------------------------------
-- 2. Registro de compra: NO crea movimientos. Solo persiste la compra.
--    Se reemplaza la firma de 7 argumentos para admitir un primer vencimiento
--    elegido por el usuario (drop previo para no dejar overloads ambiguos).
-- -----------------------------------------------------------------------------
drop function if exists public.registrar_compra_cuotas(uuid, text, numeric, integer, date, uuid, boolean);

create or replace function public.registrar_compra_cuotas(
  p_tarjeta_id uuid,
  p_descripcion text,
  p_monto_total numeric,
  p_cantidad_cuotas integer,
  p_fecha_compra date,
  p_categoria_plantilla_id uuid default null,
  p_es_monto_variable boolean default false,
  p_primer_periodo_impacto date default null
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_usuario_id uuid := (select auth.uid());
  v_compra_id uuid;
  v_tarjeta public.tarjetas_credito%rowtype;
  v_cat_plantilla public.categorias_plantilla%rowtype;
  v_primer_periodo_impacto date;
begin
  if v_usuario_id is null then
    raise exception 'No autenticado';
  end if;

  select * into v_tarjeta
  from public.tarjetas_credito
  where id = p_tarjeta_id and usuario_id = v_usuario_id;

  if v_tarjeta is null then
    raise exception 'Tarjeta no encontrada o sin permiso';
  end if;

  if p_monto_total is null or p_monto_total <= 0 then
    raise exception 'El monto total debe ser mayor a 0';
  end if;

  if p_cantidad_cuotas is null or p_cantidad_cuotas < 1 then
    raise exception 'La cantidad de cuotas debe ser al menos 1';
  end if;

  if p_categoria_plantilla_id is null then
    raise exception 'Seleccioná la categoría del presupuesto donde se imputarán las cuotas';
  end if;

  select cp.* into v_cat_plantilla
  from public.categorias_plantilla cp
  join public.fondos_plantilla fp on fp.id = cp.fondo_plantilla_id
  where cp.id = p_categoria_plantilla_id and fp.usuario_id = v_usuario_id;

  if v_cat_plantilla is null then
    raise exception 'Categoria no encontrada o sin permiso';
  end if;

  if p_primer_periodo_impacto is not null then
    v_primer_periodo_impacto := date_trunc('month', p_primer_periodo_impacto)::date;
  else
    v_primer_periodo_impacto := public.calcular_primer_periodo_impacto(
      p_fecha_compra, v_tarjeta.dia_cierre, v_tarjeta.mes_impacto_offset
    );
  end if;

  if v_primer_periodo_impacto < date_trunc('month', p_fecha_compra)::date then
    raise exception 'El primer vencimiento no puede ser anterior al mes de la compra';
  end if;

  insert into public.compras_cuotas (
    tarjeta_id,
    descripcion,
    monto_total,
    cantidad_cuotas,
    fecha_compra,
    primer_periodo_impacto,
    categoria_plantilla_id,
    es_monto_variable
  )
  values (
    p_tarjeta_id,
    p_descripcion,
    p_monto_total,
    p_cantidad_cuotas,
    p_fecha_compra,
    v_primer_periodo_impacto,
    p_categoria_plantilla_id,
    coalesce(p_es_monto_variable, false)
  )
  returning id into v_compra_id;

  return v_compra_id;
end
$$;

comment on function public.registrar_compra_cuotas(uuid, text, numeric, integer, date, uuid, boolean, date) is
  'Registra la compra en cuotas sin tocar movimientos: cada cuota se liquida al inicializar/sincronizar su periodo.';

grant execute on function public.registrar_compra_cuotas(uuid, text, numeric, integer, date, uuid, boolean, date)
  to authenticated;

-- -----------------------------------------------------------------------------
-- 3. Vista v_resumen_tarjetas: limite disponible contra el saldo total pendiente.
--    Una cuota se considera pagada solo cuando su periodo quedo cerrado, por lo
--    que una compra recien registrada descuenta su monto TOTAL del disponible.
-- -----------------------------------------------------------------------------
drop view if exists public.v_resumen_tarjetas;

create view public.v_resumen_tarjetas
with (security_invoker = true) as
with pagado_por_compra as (
  select m.compra_cuota_id, sum(m.monto) as pagado
  from public.movimientos m
  join public.categorias_mensuales cm on cm.id = m.categoria_mensual_id
  join public.fondos_mensuales fm on fm.id = cm.fondo_mensual_id
  join public.periodos_mes pm on pm.id = fm.periodo_id
  where m.compra_cuota_id is not null
    and pm.estado = 'cerrado'
  group by m.compra_cuota_id
),
comprometido_por_tarjeta as (
  select
    cc.tarjeta_id,
    sum(greatest(cc.monto_total - coalesce(p.pagado, 0), 0)) as comprometido
  from public.compras_cuotas cc
  left join pagado_por_compra p on p.compra_cuota_id = cc.id
  group by cc.tarjeta_id
)
select
  tc.id                                            as tarjeta_id,
  tc.nombre,
  tc.limite_total,
  coalesce(c.comprometido, 0)                      as comprometido,
  tc.limite_total - coalesce(c.comprometido, 0)    as disponible
from public.tarjetas_credito tc
left join comprometido_por_tarjeta c on c.tarjeta_id = tc.id;

comment on view public.v_resumen_tarjetas is
  'Limite, saldo comprometido (monto total de compras aun no saldadas) y disponible por tarjeta.';

grant select on public.v_resumen_tarjetas to authenticated;
