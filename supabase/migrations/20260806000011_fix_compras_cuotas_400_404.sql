-- =============================================================================
-- app-finanzas :: Fix — HTTP 400 y 404 al registrar compras en cuotas
-- =============================================================================
-- CAUSA DEL 404: `v_estado_compra_cuotas` se creo sin `grant select` para el rol
-- `authenticated`, por lo que PostgREST no la incluye en su schema cache y
-- responde 404 (PGRST205, "Could not find the table in the schema cache").
-- Ademas le faltaba `security_invoker = true`: sin eso la vista se evalua con
-- los permisos del owner y expone las compras de TODOS los usuarios.
--
-- CAUSA DEL 400: `registrar_compra_cuotas` crea los periodos futuros vacios
-- (solo la fila en periodos_mes) y despues exige que ya exista una
-- categoria_mensual vinculada a la plantilla. Para una compra en N cuotas los
-- meses 2..N casi nunca estan inicializados, por lo que la RPC abortaba con
-- 'Categoria mensual no encontrada para periodo ...' y PostgREST devolvia 400.
-- Ahora la RPC clona el fondo y la categoria desde la plantilla cuando faltan.

-- -----------------------------------------------------------------------------
-- 1. Vista v_estado_compra_cuotas: RLS del invocante + permiso de lectura.
-- -----------------------------------------------------------------------------
drop view if exists public.v_estado_compra_cuotas;

create view public.v_estado_compra_cuotas
with (security_invoker = true) as
select
  cc.id                                          as compra_cuota_id,
  cc.tarjeta_id,
  cc.descripcion,
  cc.monto_total                                 as monto_pactado_original,
  coalesce(sum(m.monto), 0)                      as total_pagado_acumulado,
  cc.monto_total - coalesce(sum(m.monto), 0)     as saldo_pendiente,
  coalesce(sum(m.monto), 0) - cc.monto_total     as desvio_acumulado,
  cc.cantidad_cuotas                             as cuotas_totales,
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

grant select on public.v_estado_compra_cuotas to authenticated;

-- -----------------------------------------------------------------------------
-- 2. RPC registrar_compra_cuotas: auto-provisiona fondo/categoria por periodo.
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
  v_fondo_plantilla public.fondos_plantilla%rowtype;
  v_primer_periodo_impacto date;
  v_monto_cuota numeric;
  v_i integer;
  v_periodo_fecha date;
  v_periodo_id uuid;
  v_periodo_estado public.estado_periodo;
  v_fondo_mensual_id uuid;
  v_categoria_mensual_id uuid;
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

  -- La categoria debe pertenecer al usuario (la RPC corre como definer).
  select cp.* into v_cat_plantilla
  from public.categorias_plantilla cp
  join public.fondos_plantilla fp on fp.id = cp.fondo_plantilla_id
  where cp.id = p_categoria_plantilla_id and fp.usuario_id = v_usuario_id;

  if v_cat_plantilla is null then
    raise exception 'Categoria no encontrada o sin permiso';
  end if;

  select * into v_fondo_plantilla
  from public.fondos_plantilla
  where id = v_cat_plantilla.fondo_plantilla_id;

  -- REGLA R2: dia(fecha_compra) <= dia_cierre impacta el mes de la compra;
  -- si no, el mes siguiente.
  if extract(day from p_fecha_compra) <= v_tarjeta.dia_cierre then
    v_primer_periodo_impacto := date_trunc('month', p_fecha_compra)::date;
  else
    v_primer_periodo_impacto := date_trunc('month', p_fecha_compra + interval '1 month')::date;
  end if;

  insert into public.compras_cuotas (
    tarjeta_id, descripcion, monto_total, cantidad_cuotas, fecha_compra,
    primer_periodo_impacto, categoria_plantilla_id, es_monto_variable
  )
  values (
    p_tarjeta_id, p_descripcion, p_monto_total, p_cantidad_cuotas, p_fecha_compra,
    v_primer_periodo_impacto, p_categoria_plantilla_id, coalesce(p_es_monto_variable, false)
  )
  returning id into v_compra_id;

  v_monto_cuota := round(p_monto_total / p_cantidad_cuotas, 2);

  for v_i in 1..p_cantidad_cuotas loop
    v_periodo_fecha := (v_primer_periodo_impacto + ((v_i - 1) || ' months')::interval)::date;

    select id, estado into v_periodo_id, v_periodo_estado
    from public.periodos_mes
    where usuario_id = v_usuario_id and periodo = v_periodo_fecha;

    if v_periodo_id is null then
      insert into public.periodos_mes (usuario_id, periodo, estado)
      values (v_usuario_id, v_periodo_fecha, 'borrador')
      returning id, estado into v_periodo_id, v_periodo_estado;
    end if;

    if v_periodo_estado = 'cerrado' then
      raise exception 'El periodo % esta cerrado y no admite nuevas cuotas',
        to_char(v_periodo_fecha, 'YYYY-MM');
    end if;

    -- Clona el fondo de la plantilla si el mes todavia no lo tiene.
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
    end if;

    -- Idem con la categoria: sin esto los meses 2..N abortaban la compra.
    select id into v_categoria_mensual_id
    from public.categorias_mensuales
    where fondo_mensual_id = v_fondo_mensual_id
      and (plantilla_id = v_cat_plantilla.id or nombre = v_cat_plantilla.nombre)
    limit 1;

    if v_categoria_mensual_id is null then
      insert into public.categorias_mensuales
        (fondo_mensual_id, plantilla_id, nombre, monto_presupuestado)
      values
        (v_fondo_mensual_id, v_cat_plantilla.id, v_cat_plantilla.nombre,
         v_cat_plantilla.monto_sugerido)
      returning id into v_categoria_mensual_id;
    end if;

    insert into public.movimientos (
      usuario_id, categoria_mensual_id, descripcion, monto, fecha_transaccion,
      medio_pago, compra_cuota_id, numero_cuota, total_cuotas, monto_teorico,
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
  end loop;

  return v_compra_id;
end
$$;

comment on function public.registrar_compra_cuotas(uuid, text, numeric, integer, date, uuid, boolean) is
  'Crea atomicamente una compra en cuotas y sus N movimientos, clonando fondo/categoria desde la plantilla en los periodos que aun no existan.';

grant execute on function public.registrar_compra_cuotas(uuid, text, numeric, integer, date, uuid, boolean)
  to authenticated;
