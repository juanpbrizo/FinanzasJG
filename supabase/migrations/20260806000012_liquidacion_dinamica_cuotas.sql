-- =============================================================================
-- app-finanzas :: Liquidacion dinamica de cuotas de tarjeta por periodo
-- =============================================================================
-- Objetivo:
--   * Registrar la compra en `compras_cuotas` sin crear gastos corrientes
--     inmediatos.
--   * Liquidar automaticamente las cuotas en el mes que corresponda cuando el
--     periodo se inicializa o se sincroniza.
--   * Mantener el proceso idempotente para que init/sync se puedan ejecutar
--     mas de una vez sin duplicar movimientos.

-- -----------------------------------------------------------------------------
-- 1. Helper: liquida en un periodo todas las cuotas que vencen ese mes.
-- -----------------------------------------------------------------------------
create or replace function public.liquidar_cuotas_tarjetas_periodo(p_periodo date)
returns integer language plpgsql security definer set search_path = '' as $$
declare
  v_usuario_id uuid := (select auth.uid());
  v_periodo_id uuid;
  v_periodo_estado public.estado_periodo;
  v_insertados integer := 0;
begin
  if v_usuario_id is null then
    raise exception 'No autenticado';
  end if;

  p_periodo := date_trunc('month', p_periodo)::date;

  select id, estado into v_periodo_id, v_periodo_estado
  from public.periodos_mes
  where usuario_id = v_usuario_id and periodo = p_periodo;

  if v_periodo_id is null then
    return 0;
  end if;

  if v_periodo_estado = 'cerrado' then
    raise exception 'El periodo % esta cerrado y no admite liquidacion de cuotas',
      to_char(p_periodo, 'YYYY-MM');
  end if;

  insert into public.movimientos (
    usuario_id,
    categoria_mensual_id,
    descripcion,
    monto,
    fecha_transaccion,
    medio_pago,
    compra_cuota_id,
    numero_cuota,
    total_cuotas,
    monto_teorico,
    ajustado_manualmente
  )
  select
    v_usuario_id,
    cm.id as categoria_mensual_id,
    cc.descripcion || ' (' ||
      (((extract(year from p_periodo)::int - extract(year from cc.primer_periodo_impacto)::int) * 12)
        + (extract(month from p_periodo)::int - extract(month from cc.primer_periodo_impacto)::int)
        + 1)::text || '/' || cc.cantidad_cuotas || ')',
    round((cc.monto_total / cc.cantidad_cuotas)::numeric, 2) as monto,
    p_periodo,
    'credito',
    cc.id,
    ((extract(year from p_periodo)::int - extract(year from cc.primer_periodo_impacto)::int) * 12)
      + (extract(month from p_periodo)::int - extract(month from cc.primer_periodo_impacto)::int)
      + 1 as numero_cuota,
    cc.cantidad_cuotas,
    round((cc.monto_total / cc.cantidad_cuotas)::numeric, 2) as monto_teorico,
    false
  from public.compras_cuotas cc
  join public.tarjetas_credito tc
    on tc.id = cc.tarjeta_id
   and tc.usuario_id = v_usuario_id
  join public.categorias_mensuales cm
    on cm.plantilla_id = cc.categoria_plantilla_id
  join public.fondos_mensuales fm
    on fm.id = cm.fondo_mensual_id
   and fm.periodo_id = v_periodo_id
  where cc.primer_periodo_impacto <= p_periodo
    and (cc.primer_periodo_impacto + ((cc.cantidad_cuotas - 1) || ' months')::interval)::date >= p_periodo
  on conflict do nothing;

  get diagnostics v_insertados = row_count;
  return v_insertados;
end
$$;

comment on function public.liquidar_cuotas_tarjetas_periodo(date) is
  'Crea los movimientos de cuotas que vencen en un periodo, de forma idempotente.';

grant execute on function public.liquidar_cuotas_tarjetas_periodo(date) to authenticated;

-- -----------------------------------------------------------------------------
-- 2. Inicializacion de periodo: ademas de fondos e ingresos, liquida cuotas.
-- -----------------------------------------------------------------------------
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
begin
  if v_usuario_id is null then
    raise exception 'No autenticado';
  end if;

  if extract(day from p_periodo) <> 1 then
    raise exception 'Periodo debe ser dia 1 del mes';
  end if;

  select id into v_periodo_id
  from public.periodos_mes
  where usuario_id = v_usuario_id and periodo = p_periodo;

  if v_periodo_id is not null then
    perform public.liquidar_cuotas_tarjetas_periodo(p_periodo);
    return v_periodo_id;
  end if;

  v_periodo_anterior := (p_periodo - interval '1 month')::date;

  select id into v_periodo_anterior_id
  from public.periodos_mes
  where usuario_id = v_usuario_id and periodo = v_periodo_anterior;

  if v_periodo_anterior_id is not null and p_arrastrar_saldos then
    select coalesce(sum(m.monto), 0) into v_gastado_anterior
    from public.movimientos m
    join public.categorias_mensuales cm on cm.id = m.categoria_mensual_id
    join public.fondos_mensuales fm on fm.id = cm.fondo_mensual_id
    where fm.periodo_id = v_periodo_anterior_id;

    select coalesce(sum(monto_presupuestado), 0) into v_saldo_anterior
    from public.fondos_mensuales
    where periodo_id = v_periodo_anterior_id;

    v_saldo_anterior := v_saldo_anterior - v_gastado_anterior;
  end if;

  insert into public.periodos_mes (usuario_id, periodo, estado, inicializado_at)
  values (v_usuario_id, p_periodo, 'borrador', now())
  returning id into v_periodo_id;

  for v_fondo_plantilla in
    select * from public.fondos_plantilla
    where usuario_id = v_usuario_id and activo = true
    order by prioridad asc
  loop
    declare
      v_monto_base numeric := v_fondo_plantilla.monto_sugerido;
      v_monto_final numeric;
    begin
      if v_saldo_anterior > 0 and v_fondo_plantilla.tipo in ('ahorro', 'inversion') then
        v_monto_final := v_monto_base + v_saldo_anterior;
        v_saldo_anterior := 0;
      else
        v_monto_final := v_monto_base;
      end if;

      insert into public.fondos_mensuales (periodo_id, plantilla_id, nombre, monto_presupuestado, tipo, prioridad)
      values (v_periodo_id, v_fondo_plantilla.id, v_fondo_plantilla.nombre, v_monto_final, v_fondo_plantilla.tipo, v_fondo_plantilla.prioridad)
      returning id into v_fondo_mensual_id;

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

  if v_periodo_anterior_id is not null then
    for v_ingreso_fijo in
      select * from public.ingresos
      where periodo_id = v_periodo_anterior_id and es_fijo = true
    loop
      insert into public.ingresos (periodo_id, descripcion, monto, es_fijo, fecha)
      values (
        v_periodo_id,
        v_ingreso_fijo.descripcion,
        v_ingreso_fijo.monto,
        v_ingreso_fijo.es_fijo,
        (p_periodo + (extract(day from v_ingreso_fijo.fecha)::int - 1) * interval '1 day')::date
      );
    end loop;
  end if;

  perform public.liquidar_cuotas_tarjetas_periodo(p_periodo);

  return v_periodo_id;
end
$$;

comment on function public.inicializar_periodo(date, boolean) is
  'Inicializa un periodo clonando fondos/categorias/ingresos fijos, con arrastre opcional de saldos y liquidacion de cuotas.';

grant execute on function public.inicializar_periodo(date, boolean)
  to authenticated;

-- -----------------------------------------------------------------------------
-- 3. Sincronizacion de fondos: luego de clonar plantilla, liquida cuotas.
-- -----------------------------------------------------------------------------
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

  perform public.liquidar_cuotas_tarjetas_periodo(p_periodo);

  return v_creados;
end
$$;

comment on function public.sincronizar_fondos_desde_plantilla(date) is
  'Re-clona los fondos/categorias de la plantilla hacia un periodo ya existente sin pisar montos editados y liquida cuotas del mes.';

grant execute on function public.sincronizar_fondos_desde_plantilla(date) to authenticated;

-- -----------------------------------------------------------------------------
-- 4. Registro de compra: guarda la compra y deja la liquidacion al helper.
-- -----------------------------------------------------------------------------
create or replace function public.registrar_compra_cuotas(
  p_tarjeta_id uuid,
  p_descripcion text,
  p_monto_total numeric,
  p_cantidad_cuotas integer,
  p_fecha_compra date,
  p_categoria_plantilla_id uuid default null,
  p_es_monto_variable boolean default false
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

  if extract(day from p_fecha_compra) <= v_tarjeta.dia_cierre then
    v_primer_periodo_impacto := date_trunc('month', p_fecha_compra)::date;
  else
    v_primer_periodo_impacto := date_trunc('month', p_fecha_compra + interval '1 month')::date;
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

  perform public.liquidar_cuotas_tarjetas_periodo(v_primer_periodo_impacto);

  return v_compra_id;
end
$$;

comment on function public.registrar_compra_cuotas(uuid, text, numeric, integer, date, uuid, boolean) is
  'Registra la compra en cuotas sin generar gastos inmediatos; la liquidacion se ejecuta por periodo.';

grant execute on function public.registrar_compra_cuotas(uuid, text, numeric, integer, date, uuid, boolean)
  to authenticated;
