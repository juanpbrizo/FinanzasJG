-- Agregar columna marca a tarjetas_credito (idempotente)
alter table public.tarjetas_credito
add column if not exists marca text not null default 'visa' check (marca in ('visa', 'mastercard', 'amex', 'cabal', 'naranja'));

-- Comentario descriptivo
comment on column public.tarjetas_credito.marca is
  'Marca/Franquicia de la tarjeta: visa, mastercard, amex, cabal, naranja. Determina el estilo visual y logo de la tarjeta.';
