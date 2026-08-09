-- Agregar columna entidad a tarjetas_credito (idempotente y robusta)
-- Permite seleccionar el banco/billetera virtual emisor

-- Dropear el check constraint existente si existe (para reemplazarlo)
ALTER TABLE public.tarjetas_credito DROP CONSTRAINT IF EXISTS tarjetas_credito_entidad_check;

-- Agregar la columna si no existe (sin constraint inicialmente)
ALTER TABLE public.tarjetas_credito
ADD COLUMN IF NOT EXISTS entidad text;

-- Normalizar valores existentes de entidad a minúsculas
UPDATE public.tarjetas_credito
SET entidad = LOWER(COALESCE(entidad, 'santander'))
WHERE entidad IS NULL OR entidad != LOWER(entidad);

-- Establecer default y NOT NULL
ALTER TABLE public.tarjetas_credito
ALTER COLUMN entidad SET DEFAULT 'santander',
ALTER COLUMN entidad SET NOT NULL;

-- Agregar el nuevo constraint con todas las opciones válidas
ALTER TABLE public.tarjetas_credito
ADD CONSTRAINT tarjetas_credito_entidad_check
CHECK (entidad IN (
  'santander', 'bbva', 'galicia', 'macro', 'nacion', 'provincia', 'hsbc', 'icbc', 'ciudad', 'itau', 'brubank', 'reba', 'cencosud',
  'mercado_pago', 'uala', 'naranja_x', 'personal_pay', 'lemon_cash', 'belo', 'prex'
));

-- Comentario descriptivo
COMMENT ON COLUMN public.tarjetas_credito.entidad IS
  'Banco o billetera virtual emisora de la tarjeta. Determina colores corporativos y branding.';
