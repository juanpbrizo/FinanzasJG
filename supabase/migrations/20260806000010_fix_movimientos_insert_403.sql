-- =============================================================================
-- app-finanzas :: Fix — HTTP 403 al registrar gastos (INSERT en movimientos)
-- =============================================================================
-- Causa raiz: `movimientos.usuario_id` es NOT NULL y no tenia DEFAULT, mientras
-- que la policy RLS exige `usuario_id = auth.uid()`. El cliente insertaba sin
-- ese campo, el WITH CHECK evaluaba `null = auth.uid()` -> NULL -> falso, y
-- PostgREST devolvia 403 Forbidden.
--
-- Correccion en dos frentes:
--   1. DEFAULT auth.uid() a nivel de base (misma estrategia que la migracion
--      20260806000006 aplico a fondos_plantilla y tarjetas_credito).
--   2. Policy explicita de INSERT, para que el permiso de escritura no dependa
--      unicamente de la policy generica FOR ALL.
-- Nota: el DEFAULT no admite subqueries, se llama a auth.uid() directamente.

alter table public.movimientos
  alter column usuario_id set default auth.uid();

-- Policy dedicada de INSERT.
-- IMPORTANTE: las condiciones van con AND (no con OR). Un OR permitiria insertar
-- filas con `usuario_id` de otro usuario siempre que la categoria fuese propia
-- (y viceversa), abriendo un vector de suplantacion. La verificacion de que el
-- periodo pertenece al usuario se delega en `es_categoria_mensual_propia`, que
-- ya recorre categoria -> fondo_mensual -> periodo.
drop policy if exists "Usuarios pueden insertar sus propios movimientos" on public.movimientos;

create policy "Usuarios pueden insertar sus propios movimientos"
  on public.movimientos
  for insert to authenticated
  with check (
    usuario_id = (select auth.uid())
    and public.es_categoria_mensual_propia(categoria_mensual_id)
    and (compra_cuota_id is null or public.es_compra_cuota_propia(compra_cuota_id))
  );
