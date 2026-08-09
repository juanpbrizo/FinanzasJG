-- Agregar columna marca a tarjetas_credito (idempotente)
alter table public.tarjetas_credito
add column if not exists marca text not null default 'visa' check (marca in ('visa', 'mastercard', 'amex', 'cabal', 'naranja', 'otra'));

-- Normalizar valores existentes de marca a minúsculas para evitar violaciones de constraint
update public.tarjetas_credito
set marca = lower(marca)
where marca is not null and marca != lower(marca);

-- Comentario descriptivo
comment on column public.tarjetas_credito.marca is
  'Marca/Franquicia de la tarjeta: visa, mastercard, amex, cabal, naranja, otra. Determina el estilo visual y logo de la tarjeta.';
