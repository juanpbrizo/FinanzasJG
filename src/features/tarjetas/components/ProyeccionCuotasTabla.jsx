import { Fragment } from 'react'
import { formatCurrency, formatMonthLabel } from '../../../lib/formatters'

/**
 * ProyeccionCuotasTabla: Muestra una tabla de proyección de cuotas a 12 meses.
 * Agrupa por mes y tarjeta, distinguiendo cuotas teóricas vs ajustadas.
 */
export default function ProyeccionCuotasTabla({ movimientos, onCuotaClick }) {
  if (!movimientos || movimientos.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center text-slate-600">
        No hay cuotas programadas.
      </div>
    )
  }

  // Agrupa movimientos por mes
  const movimientosPorMes = {}
  movimientos.forEach((mov) => {
    const fecha = mov.fecha_transaccion
    if (!movimientosPorMes[fecha]) {
      movimientosPorMes[fecha] = []
    }
    movimientosPorMes[fecha].push(mov)
  })

  const fechasOrdenadas = Object.keys(movimientosPorMes).sort()

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-slate-50">
            <th className="px-4 py-2 text-left font-semibold text-slate-900">Mes</th>
            <th className="px-4 py-2 text-left font-semibold text-slate-900">Descripción</th>
            <th className="px-4 py-2 text-right font-semibold text-slate-900">Monto teórico</th>
            <th className="px-4 py-2 text-right font-semibold text-slate-900">Monto real</th>
            <th className="px-4 py-2 text-center font-semibold text-slate-900">Estado</th>
            <th className="px-4 py-2 text-right font-semibold text-slate-900">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {fechasOrdenadas.map((fecha) => {
            const cuotasDelMes = movimientosPorMes[fecha]
            const totalMes = cuotasDelMes.reduce((acc, m) => acc + parseFloat(m.monto || 0), 0)
            const totalTeorico = cuotasDelMes.reduce(
              (acc, m) => acc + parseFloat(m.monto_teorico || 0),
              0
            )

            return (
              <Fragment key={fecha}>
                <tr className="border-b bg-slate-50 font-semibold">
                  <td colSpan="6" className="px-4 py-2 text-slate-900">
                    {formatMonthLabel(fecha)}
                  </td>
                </tr>
                {cuotasDelMes.map((mov) => (
                  <tr key={mov.id} className="border-b hover:bg-slate-50">
                    <td className="px-4 py-2"></td>
                    <td className="px-4 py-2 text-slate-700">
                      {mov.descripcion}
                      {mov.numero_cuota && mov.total_cuotas ? (
                        <span className="ml-2 text-xs text-slate-500">
                          ({mov.numero_cuota}/{mov.total_cuotas})
                        </span>
                      ) : null}
                      {mov.ajustado_manualmente && (
                        <span className="ml-2 inline-block rounded bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                          Ajustado
                        </span>
                      )}
                      {mov.es_sintetica && (
                        <span className="ml-2 inline-block rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                          Programada
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right text-slate-600">
                      {formatCurrency(mov.monto_teorico || mov.monto)}
                    </td>
                    <td className="px-4 py-2 text-right font-medium text-slate-900">
                      {formatCurrency(mov.monto)}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                          mov.ajustado_manualmente
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {mov.ajustado_manualmente ? 'Modificado' : 'Original'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => onCuotaClick?.(mov)}
                        disabled={mov.es_sintetica}
                        className="rounded-md px-2 py-1 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-100"
                      >
                        {mov.es_sintetica ? 'Pendiente' : 'Ajustar'}
                      </button>
                    </td>
                  </tr>
                ))}
                <tr className="border-b bg-slate-100">
                  <td colSpan="2" className="px-4 py-1 text-right font-semibold text-slate-900">
                    Subtotal mes:
                  </td>
                  <td className="px-4 py-1 text-right text-slate-700">
                    {formatCurrency(totalTeorico)}
                  </td>
                  <td className="px-4 py-1 text-right font-bold text-slate-900">
                    {formatCurrency(totalMes)}
                  </td>
                  <td colSpan="2"></td>
                </tr>
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
