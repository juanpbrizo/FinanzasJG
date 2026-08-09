-- Agregar columna marca a tarjetas_credito (idempotente y robusta)

-- Dropear el check constraint existente si existe (para reemplazarlo)
ALTER TABLE public.tarjetas_credito DROP CONSTRAINT IF EXISTS tarjetas_credito_marca_check;

-- Agregar la columna si no existe (sin constraint inicialmente)
ALTER TABLE public.tarjetas_credito
ADD COLUMN IF NOT EXISTS marca text;

-- Normalizar valores existentes de marca a minúsculas para evitar violaciones de constraint
UPDATE public.tarjetas_credito
SET marca = LOWER(COALESCE(marca, 'visa'))
WHERE marca IS NULL OR marca != LOWER(marca);

-- Establecer default y NOT NULL
ALTER TABLE public.tarjetas_credito
ALTER COLUMN marca SET DEFAULT 'visa',
ALTER COLUMN marca SET NOT NULL;

-- Agregar el nuevo constraint con todas las opciones válidas
ALTER TABLE public.tarjetas_credito
ADD CONSTRAINT tarjetas_credito_marca_check
CHECK (marca IN ('visa', 'mastercard', 'amex', 'cabal', 'naranja', 'otra'));

-- Comentario descriptivo
COMMENT ON COLUMN public.tarjetas_credito.marca IS
  'Marca/Franquicia de la tarjeta: visa, mastercard, amex, cabal, naranja, otra. Determina el estilo visual y logo de la tarjeta.';
