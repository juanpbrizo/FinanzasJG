-- =============================================================================
-- app-finanzas :: Esquema inicial (Fase 0 del MASTER_BLUEPRINT.md)
-- -----------------------------------------------------------------------------
-- Principio rector: "Plantilla != Instancia Mensual".
--   * Las tablas *_plantilla son la configuracion reutilizable del usuario.
--   * Las tablas *_mensuales son la fotografia inmutable de un periodo concreto.
-- Toda tabla queda protegida por RLS (Row Level Security) contra auth.uid().
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Tipos enumerados
-- -----------------------------------------------------------------------------
create type public.estado_periodo as enum ('borrador', 'activo', 'cerrado');
create type public.tipo_fondo     as enum ('gasto', 'ahorro', 'inversion', 'deuda');
create type public.medio_pago     as enum ('efectivo', 'debito', 'credito', 'transferencia');

-- -----------------------------------------------------------------------------
-- 2. Tablas
-- -----------------------------------------------------------------------------

-- 2.1 periodos_mes -------------------------------------------------------------
create table public.periodos_mes (
  id               uuid primary key default gen_random_uuid(),
  usuario_id       uuid not null references auth.users (id) on delete cascade,
  periodo          date not null,
  estado           public.estado_periodo not null default 'borrador',
  inicializado_at  timestamptz,
  created_at       timestamptz not null default now(),
  constraint periodos_mes_periodo_dia_1_chk check (extract(day from periodo) = 1),
  constraint periodos_mes_usuario_periodo_uq unique (usuario_id, periodo)
);

comment on table public.periodos_mes is
  'Instancia mensual. Un unico registro por usuario y mes (periodo siempre dia 1).';

-- 2.2 fondos_plantilla ---------------------------------------------------------
create table public.fondos_plantilla (
  id             uuid primary key default gen_random_uuid(),
  usuario_id     uuid not null references auth.users (id) on delete cascade,
  nombre         text not null check (length(trim(nombre)) > 0),
  monto_sugerido numeric(14, 2) not null default 0 check (monto_sugerido >= 0),
  tipo           public.tipo_fondo not null default 'gasto',
  prioridad      integer not null default 100,
  activo         boolean not null default true,
  created_at     timestamptz not null default now(),
  constraint fondos_plantilla_usuario_nombre_uq unique (usuario_id, nombre)
);

-- 2.3 categorias_plantilla -----------------------------------------------------
create table public.categorias_plantilla (
  id                  uuid primary key default gen_random_uuid(),
  fondo_plantilla_id  uuid not null references public.fondos_plantilla (id) on delete cascade,
  nombre              text not null check (length(trim(nombre)) > 0),
  monto_sugerido      numeric(14, 2) not null default 0 check (monto_sugerido >= 0),
  activo              boolean not null default true,
  created_at          timestamptz not null default now(),
  constraint categorias_plantilla_fondo_nombre_uq unique (fondo_plantilla_id, nombre)
);

-- 2.4 fondos_mensuales ---------------------------------------------------------
create table public.fondos_mensuales (
  id                  uuid primary key default gen_random_uuid(),
  periodo_id          uuid not null references public.periodos_mes (id) on delete cascade,
  plantilla_id        uuid references public.fondos_plantilla (id) on delete set null,
  nombre              text not null check (length(trim(nombre)) > 0),
  monto_presupuestado numeric(14, 2) not null default 0 check (monto_presupuestado >= 0),
  tipo                public.tipo_fondo not null default 'gasto',
  prioridad           integer not null default 100,
  created_at          timestamptz not null default now(),
  constraint fondos_mensuales_periodo_nombre_uq unique (periodo_id, nombre)
);

comment on column public.fondos_mensuales.plantilla_id is
  'Origen opcional. Si la plantilla se borra el fondo mensual sobrevive (fotografia historica).';

-- 2.5 categorias_mensuales -----------------------------------------------------
create table public.categorias_mensuales (
  id                  uuid primary key default gen_random_uuid(),
  fondo_mensual_id    uuid not null references public.fondos_mensuales (id) on delete cascade,
  plantilla_id        uuid references public.categorias_plantilla (id) on delete set null,
  nombre              text not null check (length(trim(nombre)) > 0),
  monto_presupuestado numeric(14, 2) not null default 0 check (monto_presupuestado >= 0),
  created_at          timestamptz not null default now(),
  constraint categorias_mensuales_fondo_nombre_uq unique (fondo_mensual_id, nombre)
);

-- 2.6 ingresos -----------------------------------------------------------------
create table public.ingresos (
  id          uuid primary key default gen_random_uuid(),
  periodo_id  uuid not null references public.periodos_mes (id) on delete cascade,
  descripcion text not null check (length(trim(descripcion)) > 0),
  monto       numeric(14, 2) not null check (monto > 0),
  es_fijo     boolean not null default false,
  fecha       date not null default current_date,
  created_at  timestamptz not null default now()
);

-- 2.7 tarjetas_credito ---------------------------------------------------------
create table public.tarjetas_credito (
  id                 uuid primary key default gen_random_uuid(),
  usuario_id         uuid not null references auth.users (id) on delete cascade,
  nombre             text not null check (length(trim(nombre)) > 0),
  limite_total       numeric(14, 2) not null default 0 check (limite_total >= 0),
  dia_cierre         integer not null check (dia_cierre between 1 and 31),
  dia_vencimiento    integer not null check (dia_vencimiento between 1 and 31),
  mes_impacto_offset integer not null default 1 check (mes_impacto_offset in (0, 1)),
  activa             boolean not null default true,
  created_at         timestamptz not null default now(),
  constraint tarjetas_credito_usuario_nombre_uq unique (usuario_id, nombre)
);

comment on column public.tarjetas_credito.mes_impacto_offset is
  'Meses de desfase entre el cierre y el periodo presupuestario impactado (0 = mismo mes, 1 = mes siguiente).';

-- 2.8 compras_cuotas -----------------------------------------------------------
create table public.compras_cuotas (
  id                      uuid primary key default gen_random_uuid(),
  tarjeta_id              uuid not null references public.tarjetas_credito (id) on delete cascade,
  descripcion             text not null check (length(trim(descripcion)) > 0),
  monto_total             numeric(14, 2) not null check (monto_total > 0),
  cantidad_cuotas         integer not null check (cantidad_cuotas >= 1),
  fecha_compra            date not null,
  primer_periodo_impacto  date not null,
  categoria_plantilla_id  uuid references public.categorias_plantilla (id) on delete set null,
  es_monto_variable       boolean not null default false,
  created_at              timestamptz not null default now(),
  constraint compras_cuotas_primer_periodo_dia_1_chk
    check (extract(day from primer_periodo_impacto) = 1)
);

comment on column public.compras_cuotas.es_monto_variable is
  'true cuando las cuotas no son iguales (interes, seguro, tasa variable). monto_total pasa a ser estimativo.';

-- 2.9 movimientos --------------------------------------------------------------
create table public.movimientos (
  id                    uuid primary key default gen_random_uuid(),
  usuario_id            uuid not null references auth.users (id) on delete cascade,
  categoria_mensual_id  uuid not null references public.categorias_mensuales (id) on delete cascade,
  descripcion           text not null check (length(trim(descripcion)) > 0),
  monto                 numeric(14, 2) not null check (monto > 0),
  fecha_transaccion     date not null,
  medio_pago            public.medio_pago not null default 'efectivo',
  compra_cuota_id       uuid references public.compras_cuotas (id) on delete cascade,
  numero_cuota          integer check (numero_cuota >= 1),
  total_cuotas          integer check (total_cuotas >= 1),
  monto_teorico         numeric(14, 2) check (monto_teorico >= 0),
  ajustado_manualmente  boolean not null default false,
  created_at            timestamptz not null default now(),
  -- Coherencia: o es un gasto suelto, o es una cuota completamente identificada.
  constraint movimientos_cuota_coherente_chk check (
    (compra_cuota_id is null and numero_cuota is null and total_cuotas is null)
    or
    (compra_cuota_id is not null and numero_cuota is not null and total_cuotas is not null
     and numero_cuota <= total_cuotas)
  )
);

comment on column public.movimientos.categoria_mensual_id is
  'Determina el mes de IMPACTO presupuestario, que puede diferir de fecha_transaccion.';
comment on column public.movimientos.monto is
  'Monto real de ESTA cuota en ESTE periodo. Independiente del resto de cuotas de la compra.';
comment on column public.movimientos.monto_teorico is
  'Monto original proyectado (monto_total / cantidad_cuotas). Permite auditar el desvio.';

-- Una compra no puede generar dos veces la misma cuota.
create unique index movimientos_compra_numero_cuota_uq
  on public.movimientos (compra_cuota_id, numero_cuota)
  where compra_cuota_id is not null;

-- 2.10 transferencias_fondos ---------------------------------------------------
create table public.transferencias_fondos (
  id                uuid primary key default gen_random_uuid(),
  periodo_id        uuid not null references public.periodos_mes (id) on delete cascade,
  fondo_origen_id   uuid not null references public.fondos_mensuales (id) on delete cascade,
  fondo_destino_id  uuid not null references public.fondos_mensuales (id) on delete cascade,
  monto             numeric(14, 2) not null check (monto > 0),
  motivo            text,
  fecha             date not null default current_date,
  created_at        timestamptz not null default now(),
  constraint transferencias_fondos_distintos_chk check (fondo_origen_id <> fondo_destino_id)
);

-- -----------------------------------------------------------------------------
-- 3. Indices (claves foraneas usadas por las policies y por las vistas)
-- -----------------------------------------------------------------------------
create index periodos_mes_usuario_idx            on public.periodos_mes (usuario_id, periodo desc);
create index fondos_plantilla_usuario_idx        on public.fondos_plantilla (usuario_id);
create index categorias_plantilla_fondo_idx      on public.categorias_plantilla (fondo_plantilla_id);
create index fondos_mensuales_periodo_idx        on public.fondos_mensuales (periodo_id);
create index fondos_mensuales_plantilla_idx      on public.fondos_mensuales (plantilla_id);
create index categorias_mensuales_fondo_idx      on public.categorias_mensuales (fondo_mensual_id);
create index categorias_mensuales_plantilla_idx  on public.categorias_mensuales (plantilla_id);
create index ingresos_periodo_idx                on public.ingresos (periodo_id);
create index tarjetas_credito_usuario_idx        on public.tarjetas_credito (usuario_id);
create index compras_cuotas_tarjeta_idx          on public.compras_cuotas (tarjeta_id);
create index compras_cuotas_categoria_idx        on public.compras_cuotas (categoria_plantilla_id);
create index movimientos_usuario_fecha_idx       on public.movimientos (usuario_id, fecha_transaccion desc);
create index movimientos_categoria_idx           on public.movimientos (categoria_mensual_id);
create index movimientos_compra_idx              on public.movimientos (compra_cuota_id);
create index transferencias_periodo_idx          on public.transferencias_fondos (periodo_id);
create index transferencias_origen_idx           on public.transferencias_fondos (fondo_origen_id);
create index transferencias_destino_idx          on public.transferencias_fondos (fondo_destino_id);

-- -----------------------------------------------------------------------------
-- 4. Helpers de propiedad
-- -----------------------------------------------------------------------------
-- SECURITY DEFINER para evitar recursion infinita al evaluar RLS sobre la tabla
-- padre desde una policy de la tabla hija. Solo devuelven un booleano, nunca datos.
-- search_path vacio: todos los objetos van calificados.

create or replace function public.es_periodo_propio(p_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.periodos_mes t
    where t.id = p_id and t.usuario_id = (select auth.uid())
  );
$$;

create or replace function public.es_fondo_plantilla_propio(p_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.fondos_plantilla t
    where t.id = p_id and t.usuario_id = (select auth.uid())
  );
$$;

create or replace function public.es_categoria_plantilla_propia(p_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.categorias_plantilla c
    join public.fondos_plantilla f on f.id = c.fondo_plantilla_id
    where c.id = p_id and f.usuario_id = (select auth.uid())
  );
$$;

create or replace function public.es_fondo_mensual_propio(p_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.fondos_mensuales fm
    join public.periodos_mes pm on pm.id = fm.periodo_id
    where fm.id = p_id and pm.usuario_id = (select auth.uid())
  );
$$;

create or replace function public.es_categoria_mensual_propia(p_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.categorias_mensuales cm
    join public.fondos_mensuales fm on fm.id = cm.fondo_mensual_id
    join public.periodos_mes pm on pm.id = fm.periodo_id
    where cm.id = p_id and pm.usuario_id = (select auth.uid())
  );
$$;

create or replace function public.es_tarjeta_propia(p_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.tarjetas_credito t
    where t.id = p_id and t.usuario_id = (select auth.uid())
  );
$$;

create or replace function public.es_compra_cuota_propia(p_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.compras_cuotas cc
    join public.tarjetas_credito t on t.id = cc.tarjeta_id
    where cc.id = p_id and t.usuario_id = (select auth.uid())
  );
$$;

revoke execute on function
  public.es_periodo_propio(uuid),
  public.es_fondo_plantilla_propio(uuid),
  public.es_categoria_plantilla_propia(uuid),
  public.es_fondo_mensual_propio(uuid),
  public.es_categoria_mensual_propia(uuid),
  public.es_tarjeta_propia(uuid),
  public.es_compra_cuota_propia(uuid)
from public, anon;

grant execute on function
  public.es_periodo_propio(uuid),
  public.es_fondo_plantilla_propio(uuid),
  public.es_categoria_plantilla_propia(uuid),
  public.es_fondo_mensual_propio(uuid),
  public.es_categoria_mensual_propia(uuid),
  public.es_tarjeta_propia(uuid),
  public.es_compra_cuota_propia(uuid)
to authenticated;

-- -----------------------------------------------------------------------------
-- 5. Row Level Security
-- -----------------------------------------------------------------------------
alter table public.periodos_mes          enable row level security;
alter table public.fondos_plantilla      enable row level security;
alter table public.categorias_plantilla  enable row level security;
alter table public.fondos_mensuales      enable row level security;
alter table public.categorias_mensuales  enable row level security;
alter table public.ingresos              enable row level security;
alter table public.tarjetas_credito      enable row level security;
alter table public.compras_cuotas        enable row level security;
alter table public.movimientos           enable row level security;
alter table public.transferencias_fondos enable row level security;

-- Sin policies para anon: el rol anonimo no ve absolutamente nada.

create policy "periodos_mes propios" on public.periodos_mes
  for all to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));

create policy "fondos_plantilla propios" on public.fondos_plantilla
  for all to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));

create policy "categorias_plantilla propias" on public.categorias_plantilla
  for all to authenticated
  using (public.es_fondo_plantilla_propio(fondo_plantilla_id))
  with check (public.es_fondo_plantilla_propio(fondo_plantilla_id));

create policy "fondos_mensuales propios" on public.fondos_mensuales
  for all to authenticated
  using (public.es_periodo_propio(periodo_id))
  with check (
    public.es_periodo_propio(periodo_id)
    and (plantilla_id is null or public.es_fondo_plantilla_propio(plantilla_id))
  );

create policy "categorias_mensuales propias" on public.categorias_mensuales
  for all to authenticated
  using (public.es_fondo_mensual_propio(fondo_mensual_id))
  with check (
    public.es_fondo_mensual_propio(fondo_mensual_id)
    and (plantilla_id is null or public.es_categoria_plantilla_propia(plantilla_id))
  );

create policy "ingresos propios" on public.ingresos
  for all to authenticated
  using (public.es_periodo_propio(periodo_id))
  with check (public.es_periodo_propio(periodo_id));

create policy "tarjetas_credito propias" on public.tarjetas_credito
  for all to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));

create policy "compras_cuotas propias" on public.compras_cuotas
  for all to authenticated
  using (public.es_tarjeta_propia(tarjeta_id))
  with check (
    public.es_tarjeta_propia(tarjeta_id)
    and (categoria_plantilla_id is null or public.es_categoria_plantilla_propia(categoria_plantilla_id))
  );

create policy "movimientos propios" on public.movimientos
  for all to authenticated
  using (usuario_id = (select auth.uid()))
  with check (
    usuario_id = (select auth.uid())
    and public.es_categoria_mensual_propia(categoria_mensual_id)
    and (compra_cuota_id is null or public.es_compra_cuota_propia(compra_cuota_id))
  );

create policy "transferencias_fondos propias" on public.transferencias_fondos
  for all to authenticated
  using (public.es_periodo_propio(periodo_id))
  with check (
    public.es_periodo_propio(periodo_id)
    and public.es_fondo_mensual_propio(fondo_origen_id)
    and public.es_fondo_mensual_propio(fondo_destino_id)
  );
