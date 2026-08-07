-- =============================================================================
-- app-finanzas :: Suscripciones recurrentes (Netflix, Spotify, etc)
-- =============================================================================
-- Objetivo:
--   * Permitir registrar suscripciones mensuales/anuales/etc cobradas en tarjeta
--   * Liquidar automáticamente el gasto al inicializar/sincronizar el período
--   * Descontar del límite disponible como gasto comprometido permanente

-- =============================================================================
-- 1. ENUM y TABLA suscripciones
-- =============================================================================
do $$ begin
  create type public.frecuencia_suscripcion as enum ('MENSUAL', 'BIMESTRAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL');
exception when duplicate_object then null;
end $$;

create table if not exists public.suscripciones (
  id                    uuid primary key default gen_random_uuid(),
  usuario_id            uuid not null references auth.users (id) on delete cascade,
  nombre                text not null check (length(trim(nombre)) > 0),
  monto                 numeric(14, 2) not null check (monto > 0),
  tarjeta_id              uuid not null references public.tarjetas_credito (id) on delete restrict,
  categoria_plantilla_id  uuid references public.categorias_plantilla (id) on delete set null,
  frecuencia              public.frecuencia_suscripcion not null default 'MENSUAL',
  mes_cobro_anual       integer check (mes_cobro_anual is null or (mes_cobro_anual >= 1 and mes_cobro_anual <= 12)),
  dia_vencimiento       integer not null check (dia_vencimiento >= 1 and dia_vencimiento <= 31),
  activa                boolean not null default true,
  created_at            timestamptz not null default now(),
  constraint suscripciones_usuario_nombre_uq unique (usuario_id, nombre),
  constraint suscripciones_anual_requiere_mes_chk
    check (frecuencia != 'ANUAL' or mes_cobro_anual is not null)
);

comment on table public.suscripciones is
  'Servicios de cobro recurrente (Netflix, Spotify, etc) vinculados a tarjeta y categoría.';
comment on column public.suscripciones.tarjeta_id is
  'Tarjeta de crédito contra la que se cobra.';
comment on column public.suscripciones.categoria_plantilla_id is
  'Categoría plantilla para buscar la categoría_mensual correspondiente en cada período.';
comment on column public.suscripciones.frecuencia is
  'Periodicidad: MENSUAL, ANUAL, etc.';
comment on column public.suscripciones.mes_cobro_anual is
  'Mes de cobro (1-12) para suscripciones anuales. NULL para otras frecuencias.';
comment on column public.suscripciones.dia_vencimiento is
  'Día del mes en que se cobra (1-31).';

-- RLS: usuario solo ve/edita sus suscripciones
alter table public.suscripciones enable row level security;

do $$ begin
  create policy suscripciones_acceso_usuario on public.suscripciones
    using (usuario_id = auth.uid())
    with check (usuario_id = auth.uid());
exception when duplicate_object then null;
end $$;

-- Índices para búsquedas
create index if not exists suscripciones_usuario_idx on public.suscripciones (usuario_id);
create index if not exists suscripciones_tarjeta_idx on public.suscripciones (tarjeta_id);
create index if not exists suscripciones_activa_idx on public.suscripciones (activa);

-- =============================================================================
-- 2. Helper: determina si una suscripción aplica en un período dado
-- =============================================================================
create or replace function public.suscripcion_aplica_en_periodo(
  p_frecuencia public.frecuencia_suscripcion,
  p_mes_cobro_anual integer,
  p_periodo date
)
returns boolean language plpgsql immutable as $$
declare
  v_mes_periodo integer;
begin
  if p_periodo is null then
    return false;
  end if;

  v_mes_periodo := extract(month from p_periodo)::integer;

  case p_frecuencia
    when 'MENSUAL' then
      return true;
    when 'BIMESTRAL' then
      return (v_mes_periodo % 2) = 1;
    when 'TRIMESTRAL' then
      return (v_mes_periodo % 3) = 1;
    when 'SEMESTRAL' then
      return (v_mes_periodo % 6) = 1;
    when 'ANUAL' then
      return v_mes_periodo = coalesce(p_mes_cobro_anual, 0);
    else
      return false;
  end case;
end;
$$;

comment on function public.suscripcion_aplica_en_periodo(public.frecuencia_suscripcion, integer, date) is
  'Valida si una suscripción debe liquidarse en un período.';

grant execute on function public.suscripcion_aplica_en_periodo(public.frecuencia_suscripcion, integer, date)
  to authenticated;

-- =============================================================================
-- 3. RPC: liquidar suscripciones de un período
-- =============================================================================
create or replace function public.liquidar_suscripciones_periodo(p_periodo date)
returns integer language plpgsql security definer set search_path = '' as $$
declare
  v_usuario_id uuid := (select auth.uid());
  v_periodo_id uuid;
  v_periodo_estado public.estado_periodo;
  v_suscripcion record;
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
    raise exception 'El periodo % está cerrado y no admite liquidación de suscripciones',
      to_char(p_periodo, 'YYYY-MM');
  end if;

  -- Itera sobre suscripciones activas que aplican en este período
  for v_suscripcion in
    select s.* from public.suscripciones s
    where s.usuario_id = v_usuario_id
      and s.activa = true
      and public.suscripcion_aplica_en_periodo(s.frecuencia, s.mes_cobro_anual, p_periodo)
  loop
    declare
      v_categoria_mensual_id uuid;
    begin
      if v_suscripcion.categoria_plantilla_id is null then
        -- Si la categoría plantilla no está definida, salta.
        continue;
      end if;

      -- Busca la categoría_mensual en el período actual que corresponde a esta plantilla.
      select cm.id into v_categoria_mensual_id
      from public.categorias_mensuales cm
      join public.fondos_mensuales fm on fm.id = cm.fondo_mensual_id
      where fm.periodo_id = v_periodo_id
        and cm.plantilla_id = v_suscripcion.categoria_plantilla_id
      limit 1;

      if v_categoria_mensual_id is null then
        -- La categoría no existe en este período, salta.
        continue;
      end if;

      insert into public.movimientos (
        usuario_id,
        categoria_mensual_id,
        descripcion,
        monto,
        fecha_transaccion,
        medio_pago,
        numero_cuota,
        total_cuotas,
        monto_teorico,
        ajustado_manualmente
      )
      values (
        v_usuario_id,
        v_categoria_mensual_id,
        v_suscripcion.nombre || ' (suscripción)',
        v_suscripcion.monto,
        p_periodo + (v_suscripcion.dia_vencimiento - 1) * interval '1 day',
        'credito',
        null,
        null,
        v_suscripcion.monto,
        false
      )
      on conflict do nothing;

      get diagnostics v_insertados = row_count;
    end;
  end loop;

  return v_insertados;
end;
$$;

comment on function public.liquidar_suscripciones_periodo(date) is
  'Inserta automáticamente los gastos de suscripciones activas de un período, de forma idempotente.';

grant execute on function public.liquidar_suscripciones_periodo(date) to authenticated;

-- =============================================================================
-- 4. Modificar inicializar_periodo para liquidar suscripciones
-- =============================================================================
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
    perform public.liquidar_suscripciones_periodo(p_periodo);
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
  perform public.liquidar_suscripciones_periodo(p_periodo);

  return v_periodo_id;
end;
$$;

comment on function public.inicializar_periodo(date, boolean) is
  'Inicializa un periodo clonando fondos/categorias/ingresos fijos, liquidando cuotas y suscripciones.';

grant execute on function public.inicializar_periodo(date, boolean) to authenticated;

-- =============================================================================
-- 5. Modificar sincronizar_fondos_desde_plantilla para liquidar suscripciones
-- =============================================================================
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
  perform public.liquidar_suscripciones_periodo(p_periodo);

  return v_creados;
end;
$$;

comment on function public.sincronizar_fondos_desde_plantilla(date) is
  'Re-clona los fondos/categorias de la plantilla hacia un periodo ya existente y liquida cuotas/suscripciones del mes.';

grant execute on function public.sincronizar_fondos_desde_plantilla(date) to authenticated;

-- =============================================================================
-- 6. Actualizar vista v_resumen_tarjetas para incluir suscripciones activas
-- =============================================================================
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
comprometido_cuotas as (
  select
    cc.tarjeta_id,
    sum(greatest(cc.monto_total - coalesce(p.pagado, 0), 0)) as comprometido
  from public.compras_cuotas cc
  left join pagado_por_compra p on p.compra_cuota_id = cc.id
  group by cc.tarjeta_id
),
comprometido_suscripciones as (
  select
    tarjeta_id,
    sum(monto) as comprometido
  from public.suscripciones
  where activa = true
  group by tarjeta_id
),
comprometido_total as (
  select
    tc.id as tarjeta_id,
    coalesce(cc.comprometido, 0) + coalesce(cs.comprometido, 0) as comprometido_total
  from public.tarjetas_credito tc
  left join comprometido_cuotas cc on cc.tarjeta_id = tc.id
  left join comprometido_suscripciones cs on cs.tarjeta_id = tc.id
)
select
  tc.id                                            as tarjeta_id,
  tc.nombre,
  tc.limite_total,
  coalesce(ct.comprometido_total, 0)              as comprometido,
  tc.limite_total - coalesce(ct.comprometido_total, 0) as disponible
from public.tarjetas_credito tc
left join comprometido_total ct on ct.tarjeta_id = tc.id;

comment on view public.v_resumen_tarjetas is
  'Limite, saldo comprometido (cuotas + suscripciones activas) y disponible por tarjeta.';

grant select on public.v_resumen_tarjetas to authenticated;
