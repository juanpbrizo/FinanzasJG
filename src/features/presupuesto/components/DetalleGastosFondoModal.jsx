import { useMemo } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import Modal from '../../../components/ui/Modal'
import { formatCurrency, formatDate } from '../../../lib/formatters'

const MEDIOS_PAGO = {
  efectivo: 'Efectivo',
  debito: 'Débito',
  credito: 'Crédito',
  transferencia: 'Transferencia',
}

/**
 * Detalle de los gastos de un fondo en el mes activo, con acciones de
 * editar y eliminar.
 *
 * Las cuotas de tarjeta se listan pero no se editan aca: tienen su propio
 * flujo en /tarjetas para no romper la trazabilidad del plan de pagos (R7).
 */
export default function DetalleGastosFondoModal({
  fondo,
  onClose,
  onEdit,
  onDelete,
  isLocked,
  isDisabled,
}) {
  const gastos = useMemo(() => {
    const filas = (fondo?.categorias_mensuales ?? []).flatMap((categoria) =>
      (categoria.movimientos ?? []).map((movimiento) => ({
        ...movimiento,
        fondo_id: fondo.id,
        fondo_nombre: fondo.nombre,
        categoria_mensual_id: categoria.id,
        categoria_nombre: categoria.nombre,
      }))
    )

    return filas.sort((a, b) =>
      String(b.fecha_transaccion ?? '').localeCompare(String(a.fecha_transaccion ?? ''))
    )
  }, [fondo])

  const total = gastos.reduce((sum, gasto) => sum + (gasto.monto ?? 0), 0)

  return (
    <Modal
      isOpen={Boolean(fondo)}
      onClose={onClose}
      title={`Gastos de ${fondo?.nombre ?? ''}`}
    >
      {gastos.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-600">
          No hay gastos registrados en este fondo para el mes actual.
        </p>
      ) : (
        <>
          <ul className="max-h-[60vh] divide-y divide-slate-200 overflow-y-auto">
            {gastos.map((gasto) => {
              const esCuota = Boolean(gasto.compra_cuota_id)
              const accionesBloqueadas = isLocked || isDisabled || esCuota

              let motivoBloqueo
              if (isLocked) motivoBloqueo = 'El período está cerrado'
              else if (esCuota) motivoBloqueo = 'Las cuotas de tarjeta se ajustan desde Tarjetas'

              return (
                <li key={gasto.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">
                      {gasto.descripcion}
                      {esCuota && gasto.numero_cuota ? (
                        <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600">
                          Cuota {gasto.numero_cuota}/{gasto.total_cuotas}
                        </span>
                      ) : null}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {formatDate(gasto.fecha_transaccion)} · {gasto.categoria_nombre} ·{' '}
                      {MEDIOS_PAGO[gasto.medio_pago] ?? gasto.medio_pago}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <span className="mr-2 font-semibold text-slate-900">
                      {formatCurrency(gasto.monto)}
                    </span>
                    {!isLocked && (
                      <>
                        <button
                          type="button"
                          onClick={() => onEdit?.(gasto)}
                          disabled={accionesBloqueadas}
                          title={motivoBloqueo ?? 'Editar gasto'}
                          className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Editar gasto</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete?.(gasto)}
                          disabled={accionesBloqueadas}
                          title={motivoBloqueo ?? 'Eliminar gasto'}
                          className="rounded p-1.5 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Eliminar gasto</span>
                        </button>
                      </>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>

          <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3 text-sm">
            <span className="text-slate-600">
              {gastos.length} gasto{gastos.length === 1 ? '' : 's'}
            </span>
            <span className="font-semibold text-slate-900">{formatCurrency(total)}</span>
          </div>
        </>
      )}
    </Modal>
  )
}
