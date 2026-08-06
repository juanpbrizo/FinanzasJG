import { formatCurrency } from '../../../lib/formatters'

/**
 * TarjetasList: Muestra lista de tarjetas con indicador de límite disponible.
 * Alerta visual si uso supera 80%.
 */
export default function TarjetasList({ tarjetas, disponibles, onEdit, onDelete, isLoading }) {
  if (!tarjetas || tarjetas.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center text-slate-600">
        Aún no hay tarjetas registradas.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {tarjetas.map((tarjeta) => {
        const disponible = disponibles[tarjeta.id]
        const porcentajeUso = disponible
          ? ((disponible.limite_total - disponible.disponible) / disponible.limite_total) * 100
          : 0

        let varianteBarra = 'bg-green-500'
        if (porcentajeUso > 80) varianteBarra = 'bg-red-500'
        else if (porcentajeUso > 60) varianteBarra = 'bg-yellow-500'

        return (
          <div
            key={tarjeta.id}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">{tarjeta.nombre}</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Cierre: {tarjeta.dia_cierre} | Vencimiento: {tarjeta.dia_vencimiento}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => onEdit?.(tarjeta)}
                  disabled={isLoading}
                  className="px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded disabled:opacity-50"
                >
                  Editar
                </button>
                <button
                  onClick={() => onDelete?.(tarjeta.id)}
                  disabled={isLoading}
                  className="px-3 py-1 text-sm font-medium text-red-700 hover:bg-red-50 rounded disabled:opacity-50"
                >
                  Eliminar
                </button>
              </div>
            </div>

            {disponible && (
              <div className="mt-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-700">
                    Disponible: {formatCurrency(disponible.disponible)} de{' '}
                    {formatCurrency(disponible.limite_total)}
                  </span>
                  <span className={`font-semibold ${porcentajeUso > 80 ? 'text-red-600' : 'text-slate-600'}`}>
                    {Math.round(porcentajeUso)}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={`h-full transition-all ${varianteBarra}`}
                    style={{ width: `${Math.min(porcentajeUso, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
