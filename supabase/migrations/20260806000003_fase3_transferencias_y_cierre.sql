-- =============================================================================
-- app-finanzas :: Fase 3 — Transferencias y Cierre de Mes
-- =============================================================================

-- 1. RPC transferir_entre_fondos: Transferencia atómica entre fondos del mismo período.
-- Regla: resta de origen, suma a destino. Operación atómica en una transacción.
create or replace function public.transferir_entre_fondos(
  p_periodo_id uuid,
  p_origen_id uuid,
  p_destino_id uuid,
  p_monto numeric,
  p_motivo text default 'Reasignación de fondos'
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_usuario_id uuid := (select auth.uid());
  v_periodo public.periodos_mes%rowtype;
  v_origen public.fondos_mensuales%rowtype;
  v_destino public.fondos_mensuales%rowtype;
  v_transferencia_id uuid;
begin
  if v_usuario_id is null then
    raise exception 'No autenticado';
  end if;

  if p_origen_id = p_destino_id then
    raise exception 'Origen y destino no pueden ser el mismo fondo';
  end if;

  if p_monto <= 0 then
    raise exception 'Monto debe ser positivo';
  end if;

  -- Obtiene el periodo y verifica que pertenezca al usuario.
  select * into v_periodo
  from public.periodos_mes
  where id = p_periodo_id and usuario_id = v_usuario_id;

  if v_periodo is null then
    raise exception 'Periodo no encontrado o sin permiso';
  end if;

  -- Rechaza si el periodo esta cerrado (Regla R5).
  if v_periodo.estado = 'cerrado' then
    raise exception 'No se puede transferir en un periodo cerrado';
  end if;

  -- Obtiene los fondos origen y destino.
  select * into v_origen
  from public.fondos_mensuales
  where id = p_origen_id and periodo_id = p_periodo_id;

  select * into v_destino
  from public.fondos_mensuales
  where id = p_destino_id and periodo_id = p_periodo_id;

  if v_origen is null or v_destino is null then
    raise exception 'Fondos origen o destino no encontrados';
  end if;

  -- Valida que origen tenga suficiente saldo (opcional: configurable).
  if v_origen.monto_presupuestado < p_monto then
    raise exception 'Saldo insuficiente en fondo origen';
  end if;

  -- Inserta registro de transferencia.
  insert into public.transferencias_fondos (
    periodo_id,
    fondo_origen_id,
    fondo_destino_id,
    monto,
    motivo
  )
  values (p_periodo_id, p_origen_id, p_destino_id, p_monto, p_motivo)
  returning id into v_transferencia_id;

  -- Actualiza montos en TRANSACCION ATOMICA: resta de origen, suma a destino.
  update public.fondos_mensuales
  set monto_presupuestado = monto_presupuestado - p_monto
  where id = p_origen_id;

  update public.fondos_mensuales
  set monto_presupuestado = monto_presupuestado + p_monto
  where id = p_destino_id;

  return v_transferencia_id;
end
$$;

comment on function public.transferir_entre_fondos(uuid, uuid, uuid, numeric, text) is
  'Transfiere un monto de un fondo a otro en el mismo periodo, atomicamente.';

grant execute on function public.transferir_entre_fondos(uuid, uuid, uuid, numeric, text)
  to authenticated;

-- 2. RPC cerrar_periodo: Marca un periodo como cerrado.
-- Regla R5: Los movimientos de periodos cerrados pasan a solo lectura.
create or replace function public.cerrar_periodo(
  p_periodo date
)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_usuario_id uuid := (select auth.uid());
  v_periodo_id uuid;
begin
  if v_usuario_id is null then
    raise exception 'No autenticado';
  end if;

  -- Obtiene el periodo y verifica que pertenezca al usuario.
  select id into v_periodo_id
  from public.periodos_mes
  where usuario_id = v_usuario_id and periodo = p_periodo;

  if v_periodo_id is null then
    raise exception 'Periodo no encontrado o sin permiso';
  end if;

  -- Marca el periodo como cerrado.
  update public.periodos_mes
  set estado = 'cerrado'
  where id = v_periodo_id;
end
$$;

comment on function public.cerrar_periodo(date) is
  'Marca un periodo como cerrado, congelando sus movimientos en solo lectura.';

grant execute on function public.cerrar_periodo(date)
  to authenticated;

-- 3. Triggers para bloquear cambios en periodos cerrados (Regla R5).
-- Trigger en movimientos: rechaza INSERT, UPDATE en periodos cerrados.
create or replace function public.fn_bloquear_cambios_periodo_cerrado()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_periodo_estado public.estado_periodo;
begin
  -- Obtiene el estado del periodo asociado (via categoria_mensual -> fondo_mensual -> periodo).
  select pm.estado into v_periodo_estado
  from public.periodos_mes pm
  join public.fondos_mensuales fm on fm.periodo_id = pm.id
  join public.categorias_mensuales cm on cm.fondo_mensual_id = fm.id
  where cm.id = new.categoria_mensual_id;

  if v_periodo_estado = 'cerrado' then
    raise exception 'No se puede modificar un movimiento en un periodo cerrado';
  end if;

  return new;
end
$$;

drop trigger if exists tr_bloquear_cambios_movimientos_cerrado on public.movimientos;
create trigger tr_bloquear_cambios_movimientos_cerrado
before insert or update on public.movimientos
for each row
execute function public.fn_bloquear_cambios_periodo_cerrado();

-- Trigger en fondos_mensuales: rechaza UPDATE de monto_presupuestado en periodos cerrados.
create or replace function public.fn_bloquear_cambios_fondos_cerrado()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_periodo_estado public.estado_periodo;
begin
  select estado into v_periodo_estado
  from public.periodos_mes
  where id = new.periodo_id;

  if v_periodo_estado = 'cerrado' then
    raise exception 'No se puede modificar un fondo en un periodo cerrado';
  end if;

  return new;
end
$$;

drop trigger if exists tr_bloquear_cambios_fondos_cerrado on public.fondos_mensuales;
create trigger tr_bloquear_cambios_fondos_cerrado
before update on public.fondos_mensuales
for each row
execute function public.fn_bloquear_cambios_periodo_cerrado();

-- Trigger en ingresos: rechaza UPDATE en periodos cerrados.
create or replace function public.fn_bloquear_cambios_ingresos_cerrado()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_periodo_estado public.estado_periodo;
begin
  select estado into v_periodo_estado
  from public.periodos_mes
  where id = new.periodo_id;

  if v_periodo_estado = 'cerrado' then
    raise exception 'No se puede modificar un ingreso en un periodo cerrado';
  end if;

  return new;
end
$$;

drop trigger if exists tr_bloquear_cambios_ingresos_cerrado on public.ingresos;
create trigger tr_bloquear_cambios_ingresos_cerrado
before update or insert on public.ingresos
for each row
execute function public.fn_bloquear_cambios_ingresos_cerrado();

-- Trigger en transferencias_fondos: rechaza INSERT en periodos cerrados.
create or replace function public.fn_bloquear_cambios_transferencias_cerrado()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_periodo_estado public.estado_periodo;
begin
  select estado into v_periodo_estado
  from public.periodos_mes
  where id = new.periodo_id;

  if v_periodo_estado = 'cerrado' then
    raise exception 'No se puede crear una transferencia en un periodo cerrado';
  end if;

  return new;
end
$$;

drop trigger if exists tr_bloquear_cambios_transferencias_cerrado on public.transferencias_fondos;
create trigger tr_bloquear_cambios_transferencias_cerrado
before insert on public.transferencias_fondos
for each row
execute function public.fn_bloquear_cambios_transferencias_cerrado();
