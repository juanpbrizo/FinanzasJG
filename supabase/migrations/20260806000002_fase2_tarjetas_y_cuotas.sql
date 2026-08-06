-- =============================================================================
-- app-finanzas :: Fase 2 — Motor de Tarjetas de Crédito y Compras en Cuotas
-- =============================================================================

-- 1. RPC registrar_compra_cuotas: Crea atomicamente una compra y sus N cuotas.
-- Regla R2: Calcula primer_periodo_impacto segun dia_cierre de la tarjeta.
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
  v_primer_periodo_impacto date;
  v_monto_cuota numeric;
  v_i integer;
  v_periodo_id uuid;
  v_categoria_mensual_id uuid;
begin
  if v_usuario_id is null then
    raise exception 'No autenticado';
  end if;

  -- Valida que la tarjeta pertenezca al usuario y obtiene config.
  select * into v_tarjeta
  from public.tarjetas_credito
  where id = p_tarjeta_id and usuario_id = v_usuario_id;

  if v_tarjeta is null then
    raise exception 'Tarjeta no encontrada o sin permiso';
  end if;

  if p_monto_total <= 0 or p_cantidad_cuotas < 1 then
    raise exception 'Monto y cantidad de cuotas invalidos';
  end if;

  -- REGLA R2: Calcula primer_periodo_impacto segun dia_cierre.
  -- Si dia(fecha_compra) <= dia_cierre: impacta en el mes de la compra.
  -- Si dia(fecha_compra) > dia_cierre: impacta en el mes siguiente.
  if extract(day from p_fecha_compra) <= v_tarjeta.dia_cierre then
    v_primer_periodo_impacto := date_trunc('month', p_fecha_compra)::date;
  else
    v_primer_periodo_impacto := date_trunc('month', p_fecha_compra + interval '1 month')::date;
  end if;

  -- Valida que primer_periodo_impacto sea dia 1.
  if extract(day from v_primer_periodo_impacto) <> 1 then
    raise exception 'Error interno: primer_periodo_impacto no es dia 1';
  end if;

  -- Inserta la compra en compras_cuotas.
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
    p_es_monto_variable
  )
  returning id into v_compra_id;

  -- Calcula monto teorico por cuota.
  v_monto_cuota := p_monto_total / p_cantidad_cuotas;

  -- Genera N movimientos, uno por cada cuota.
  for v_i in 1..p_cantidad_cuotas loop
    declare
      v_periodo_fecha date := v_primer_periodo_impacto + ((v_i - 1) || ' months')::interval;
    begin
      -- Asegura que el periodo existe (inicializa si es necesario).
      select id into v_periodo_id
      from public.periodos_mes
      where usuario_id = v_usuario_id and periodo = v_periodo_fecha;

      if v_periodo_id is null then
        -- Crea periodo automaticamente (sera estado 'borrador').
        insert into public.periodos_mes (usuario_id, periodo, estado)
        values (v_usuario_id, v_periodo_fecha, 'borrador')
        returning id into v_periodo_id;
      end if;

      -- Obtiene la categoria_mensual_id de la compra (si se asigno una categoria).
      -- Para simplificar esta fase, asumimos que si p_categoria_plantilla_id fue dado,
      -- existe ya una categoria_mensual vinculada (ej. creada durante inicializar_periodo).
      -- En Fase 3 mejoraremos esto con busqueda dinamica.
      if p_categoria_plantilla_id is not null then
        select id into v_categoria_mensual_id
        from public.categorias_mensuales cm
        join public.fondos_mensuales fm on fm.id = cm.fondo_mensual_id
        where fm.periodo_id = v_periodo_id
          and cm.plantilla_id = p_categoria_plantilla_id
        limit 1;
      end if;

      -- Si no hay categoria_mensual valida, falla.
      if v_categoria_mensual_id is null and p_categoria_plantilla_id is not null then
        raise exception 'Categoria mensual no encontrada para periodo % y categoria %', v_periodo_fecha, p_categoria_plantilla_id;
      end if;

      -- Si no se asigno categoria, rechaza la cuota.
      if v_categoria_mensual_id is null then
        raise exception 'Categoria plantilla requerida para generar cuotas';
      end if;

      -- Inserta el movimiento de cuota.
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
      values (
        v_usuario_id,
        v_categoria_mensual_id,
        p_descripcion || ' (' || v_i || '/' || p_cantidad_cuotas || ')',
        v_monto_cuota,
        v_periodo_fecha,
        'credito',
        v_compra_id,
        v_i,
        p_cantidad_cuotas,
        v_monto_cuota,
        false
      );
    end;
  end loop;

  return v_compra_id;
end
$$;

comment on function public.registrar_compra_cuotas(uuid, text, numeric, integer, date, uuid, boolean) is
  'Crea atomicamente una compra en cuotas y sus N movimientos segun la fecha de cierre de la tarjeta.';

grant execute on function public.registrar_compra_cuotas(uuid, text, numeric, integer, date, uuid, boolean)
  to authenticated;

-- 2. RPC actualizar_cuota_individual: Modifica el monto de UN solo movimiento.
-- Regla R5: Rechaza si el periodo asociado esta cerrado.
-- Regla R7: NO modifica monto_teorico ni afecta cuotas de otros meses.
create or replace function public.actualizar_cuota_individual(
  p_movimiento_id uuid,
  p_nuevo_monto numeric
)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_usuario_id uuid := (select auth.uid());
  v_movimiento public.movimientos%rowtype;
  v_periodo_id uuid;
  v_periodo_estado public.estado_periodo;
begin
  if v_usuario_id is null then
    raise exception 'No autenticado';
  end if;

  -- Obtiene el movimiento y verifica permisos.
  select * into v_movimiento
  from public.movimientos
  where id = p_movimiento_id and usuario_id = v_usuario_id;

  if v_movimiento is null then
    raise exception 'Movimiento no encontrado o sin permiso';
  end if;

  if p_nuevo_monto <= 0 then
    raise exception 'Nuevo monto debe ser positivo';
  end if;

  -- Obtiene el periodo asociado via categoria_mensual -> fondo_mensual.
  select pm.id, pm.estado into v_periodo_id, v_periodo_estado
  from public.periodos_mes pm
  join public.fondos_mensuales fm on fm.periodo_id = pm.id
  join public.categorias_mensuales cm on cm.fondo_mensual_id = fm.id
  where cm.id = v_movimiento.categoria_mensual_id;

  -- REGLA R5: Rechaza si el periodo esta cerrado.
  if v_periodo_estado = 'cerrado' then
    raise exception 'No se puede modificar una cuota de un periodo cerrado';
  end if;

  -- Actualiza el monto del movimiento y marca como ajustado manualmente.
  -- REGLA R7: NO modifica monto_teorico ni afecta otras cuotas.
  update public.movimientos
  set
    monto = p_nuevo_monto,
    ajustado_manualmente = true
  where id = p_movimiento_id;
end
$$;

comment on function public.actualizar_cuota_individual(uuid, numeric) is
  'Ajusta el monto de una unica cuota. Rechaza si el periodo esta cerrado.';

grant execute on function public.actualizar_cuota_individual(uuid, numeric)
  to authenticated;

-- 3. RPC recalcular_cuotas_pendientes: Redistribuye saldo entre cuotas futuras.
-- Regla R5: Solo afecta periodos en estado activo/borrador.
create or replace function public.recalcular_cuotas_pendientes(
  p_compra_cuota_id uuid,
  p_nuevo_saldo numeric
)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_usuario_id uuid := (select auth.uid());
  v_compra public.compras_cuotas%rowtype;
  v_cuotas_pendientes integer;
  v_monto_por_cuota numeric;
  v_total_ajustado numeric := 0;
  v_cursor record;
begin
  if v_usuario_id is null then
    raise exception 'No autenticado';
  end if;

  -- Obtiene la compra y verifica que pertenezca al usuario.
  select * into v_compra
  from public.compras_cuotas cc
  join public.tarjetas_credito tc on tc.id = cc.tarjeta_id
  where cc.id = p_compra_cuota_id and tc.usuario_id = v_usuario_id;

  if v_compra is null then
    raise exception 'Compra no encontrada o sin permiso';
  end if;

  if p_nuevo_saldo <= 0 then
    raise exception 'Nuevo saldo debe ser positivo';
  end if;

  -- Cuenta cuotas en periodos activos (no cerrados).
  select count(*) into v_cuotas_pendientes
  from public.movimientos m
  join public.categorias_mensuales cm on cm.id = m.categoria_mensual_id
  join public.fondos_mensuales fm on fm.id = cm.fondo_mensual_id
  join public.periodos_mes pm on pm.id = fm.periodo_id
  where m.compra_cuota_id = p_compra_cuota_id
    and pm.estado != 'cerrado'
    and m.usuario_id = v_usuario_id;

  if v_cuotas_pendientes = 0 then
    raise exception 'No hay cuotas pendientes para recalcular';
  end if;

  -- Calcula monto por cuota (distribucion uniforme).
  v_monto_por_cuota := p_nuevo_saldo / v_cuotas_pendientes;

  -- Actualiza cada cuota pendiente.
  for v_cursor in
    select m.id
    from public.movimientos m
    join public.categorias_mensuales cm on cm.id = m.categoria_mensual_id
    join public.fondos_mensuales fm on fm.id = cm.fondo_mensual_id
    join public.periodos_mes pm on pm.id = fm.periodo_id
    where m.compra_cuota_id = p_compra_cuota_id
      and pm.estado != 'cerrado'
      and m.usuario_id = v_usuario_id
    order by m.fecha_transaccion asc
  loop
    update public.movimientos
    set monto = v_monto_por_cuota
    where id = v_cursor.id;
  end loop;
end
$$;

comment on function public.recalcular_cuotas_pendientes(uuid, numeric) is
  'Redistribuye un saldo entre las cuotas de periodos no cerrados de una compra.';

grant execute on function public.recalcular_cuotas_pendientes(uuid, numeric)
  to authenticated;

-- 4. Vista v_estado_compra_cuotas: Resumen del estado de una compra.
create or replace view public.v_estado_compra_cuotas as
select
  cc.id                                                   as compra_cuota_id,
  cc.descripcion,
  cc.monto_total                                         as monto_pactado_original,
  coalesce(sum(m.monto), 0)                             as total_pagado_acumulado,
  cc.monto_total - coalesce(sum(m.monto), 0)           as saldo_pendiente,
  coalesce(sum(m.monto), 0) - cc.monto_total           as desvio_acumulado,
  cc.cantidad_cuotas                                    as cuotas_totales,
  (select count(*) from public.movimientos m2
   join public.categorias_mensuales cm2 on cm2.id = m2.categoria_mensual_id
   join public.fondos_mensuales fm2 on fm2.id = cm2.fondo_mensual_id
   join public.periodos_mes pm2 on pm2.id = fm2.periodo_id
   where m2.compra_cuota_id = cc.id and pm2.estado = 'cerrado')
                                                       as cuotas_pagadas,
  cc.cantidad_cuotas - (select count(*) from public.movimientos m3
   join public.categorias_mensuales cm3 on cm3.id = m3.categoria_mensual_id
   join public.fondos_mensuales fm3 on fm3.id = cm3.fondo_mensual_id
   join public.periodos_mes pm3 on pm3.id = fm3.periodo_id
   where m3.compra_cuota_id = cc.id and pm3.estado = 'cerrado')
                                                       as cuotas_pendientes
from public.compras_cuotas cc
left join public.movimientos m on m.compra_cuota_id = cc.id
group by cc.id;

comment on view public.v_estado_compra_cuotas is
  'Resumen agregado del estado de una compra: montos, cuotas pagadas/pendientes, desvios.';
