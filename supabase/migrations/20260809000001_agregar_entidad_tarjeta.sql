-- Agregar columna entidad a tarjetas_credito (idempotente)
-- Permite seleccionar el banco/billetera virtual emisor

alter table public.tarjetas_credito
add column entidad text not null default 'santander'
check (entidad in (
  'santander', 'bbva', 'galicia', 'macro', 'nacion', 'provincia', 'hsbc', 'icbc', 'ciudad', 'itau', 'brubank', 'reba', 'cencosud',
  'mercado_pago', 'uala', 'naranja_x', 'personal_pay', 'lemon_cash', 'belo', 'prex'
));

-- Comentario descriptivo
comment on column public.tarjetas_credito.entidad is
  'Banco o billetera virtual emisora de la tarjeta. Determina colores corporativos y branding.';
