-- =============================================================================
-- app-finanzas :: Fase 1 — RPC de Inicialización y Vistas (Tareas 1.4, 1.8)
-- =============================================================================

-- Creacion de vistas de resumen disponibles a todos los usuarios autenticados.

-- 1. Vista v_resumen_periodo: Calcula totales de ingresos, presupuesto y gasto por mes.
-- Nota: Todos los totales usan COALESCE(..., 0) para evitar NULL en cálculos.
create or replace view public.v_resumen_periodo as
select
  pm.id                                   as periodo_id,
  pm.usuario_id,
  pm.periodo,
  coalesce(sum(ing.monto), 0)            as total_ingresos,
  coalesce(sum(fm.monto_presupuestado), 0) as total_presupuestado,
  coalesce(sum(mov.monto), 0)            as total_gastado,
  coalesce(sum(ing.monto), 0) - coalesce(sum(fm.monto_presupuestado), 0) as dinero_sin_asignar
from public.periodos_mes pm
left join public.ingresos ing on ing.periodo_id = pm.id
left join public.fondos_mensuales fm on fm.periodo_id = pm.id
left join public.categorias_mensuales cm on cm.fondo_mensual_id = fm.id
left join public.movimientos mov on mov.categoria_mensual_id = cm.id
group by pm.id, pm.usuario_id, pm.periodo;

comment on view public.v_resumen_periodo is
  'Resumen agregado de un mes: ingresos, presupuesto, gasto y dinero sin asignar.';

-- Nota: La vista hereda automaticamente el RLS de las tablas base (periodos_mes).
-- No se puede crear una policy directamente en una vista; solo en tablas.

-- 2. RPC inicializar_periodo: Crea atomicamente un periodo con fondos y categorias.
-- IDEMPOTENT: si el periodo ya existe, devuelve su ID sin error.
-- SECURITY DEFINER: ejecuta como postgres, evita evaluacion de RLS multiples veces.
create or replace function public.inicializar_periodo(p_periodo date)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_usuario_id uuid := (select auth.uid());
  v_periodo_id uuid;
  v_ultimo_periodo_activo date;
begin
  if v_usuario_id is null then
    raise exception 'No autenticado';
  end if;

  -- Asegura que p_periodo es siempre el dia 1 del mes.
  p_periodo := date_trunc('month', p_periodo)::date;

  -- Intenta recuperar un periodo existente del usuario para este mes.
  select id into v_periodo_id
  from public.periodos_mes
  where usuario_id = v_usuario_id and periodo = p_periodo;

  if v_periodo_id is not null then
    -- Ya existe: devuelve su ID (idempotente).
    return v_periodo_id;
  end if;

  -- Crea el periodo nuevo en estado 'activo'.
  insert into public.periodos_mes (usuario_id, periodo, estado, inicializado_at)
  values (v_usuario_id, p_periodo, 'activo', now())
  returning id into v_periodo_id;

  -- Clona los fondos activos de la plantilla hacia fondos_mensuales.
  insert into public.fondos_mensuales (periodo_id, plantilla_id, nombre, monto_presupuestado, tipo, prioridad)
  select
    v_periodo_id,
    fp.id,
    fp.nombre,
    fp.monto_sugerido,
    fp.tipo,
    fp.prioridad
  from public.fondos_plantilla fp
  where fp.usuario_id = v_usuario_id and fp.activo = true
  on conflict (periodo_id, nombre) do nothing;

  -- Clona las categorias de la plantilla hacia categorias_mensuales.
  insert into public.categorias_mensuales (fondo_mensual_id, plantilla_id, nombre, monto_presupuestado)
  select
    fm.id,
    cp.id,
    cp.nombre,
    cp.monto_sugerido
  from public.fondos_mensuales fm
  join public.fondos_plantilla fp on fp.id = fm.plantilla_id
  join public.categorias_plantilla cp on cp.fondo_plantilla_id = fp.id
  where fm.periodo_id = v_periodo_id and cp.activo = true
  on conflict (fondo_mensual_id, nombre) do nothing;

  -- Busca el ultimo periodo activo (anterior a este) para clonar ingresos fijos.
  select periodo into v_ultimo_periodo_activo
  from public.periodos_mes
  where usuario_id = v_usuario_id and periodo < p_periodo
  order by periodo desc
  limit 1;

  -- Si hay un periodo anterior, clona los ingresos marcados como es_fijo = true.
  if v_ultimo_periodo_activo is not null then
    insert into public.ingresos (periodo_id, descripcion, monto, es_fijo, fecha)
    select
      v_periodo_id,
      ing.descripcion,
      ing.monto,
      ing.es_fijo,
      ing.fecha
    from public.ingresos ing
    where ing.periodo_id = (
      select id from public.periodos_mes
      where usuario_id = v_usuario_id and periodo = v_ultimo_periodo_activo
    ) and ing.es_fijo = true
    on conflict do nothing;
  end if;

  return v_periodo_id;
end
$$;

comment on function public.inicializar_periodo(date) is
  'Crea atomicamente un periodo con fondos y categorias clonados de la plantilla. Idempotente.';

-- Solo el rol autenticado puede llamar a la RPC.
revoke execute on function public.inicializar_periodo(date) from public, anon;
grant execute on function public.inicializar_periodo(date) to authenticated;
