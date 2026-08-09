-- Agregar columna marca a tarjetas_credito
alter table public.tarjetas_credito
add column marca text not null default 'OTRA' check (marca in ('VISA', 'MASTERCARD', 'AMEX', 'OTRA'));

-- Comentario descriptivo
comment on column public.tarjetas_credito.marca is
  'Marca/Franquicia de la tarjeta: VISA, MASTERCARD, AMEX u OTRA. Determina el estilo visual y logo de la tarjeta.';
