import { Trash2, Edit2 } from 'lucide-react'
import { formatCurrency, formatDate } from '../../../lib/formatters'
import Button from '../../../components/ui/Button'

export default function IngresosDelMesPanel({
  ingresos,
  isLoading,
  onEdit,
  onDelete,
  isDisabled,
}) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-500">Cargando ingresos...</p>
      </div>
    )
  }

  if (!ingresos || ingresos.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-500">Sin ingresos registrados en este período.</p>
      </div>
    )
  }

  // Calcular total de ingresos
  const totalIngresos = ingresos.reduce((sum, ing) => sum + (ing.monto || 0), 0)

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="font-medium text-slate-900">Ingresos del Período ({ingresos.length})</h4>
        <span className="text-sm font-semibold text-slate-700">
          Total: {formatCurrency(totalIngresos)}
        </span>
      </div>

      <div className="space-y-2">
        {ingresos.map((ingreso) => (
          <div
            key={ingreso.id}
            className="flex items-center justify-between gap-3 rounded border border-slate-100 bg-slate-50 p-3"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-slate-900">{ingreso.descripcion}</p>
                {ingreso.es_fijo && (
                  <span className="inline-block bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700 rounded">
                    Fijo
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">{formatDate(ingreso.fecha)}</p>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-semibold text-slate-900">{formatCurrency(ingreso.monto)}</span>
              <div className="flex gap-1">
                <button
                  onClick={() => onEdit(ingreso)}
                  disabled={isDisabled}
                  className="rounded p-1.5 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Editar ingreso"
                >
                  <Edit2 className="w-4 h-4 text-slate-600" />
                </button>
                <button
                  onClick={() => {
                    if (
                      confirm(
                        `¿Estás seguro de que deseas eliminar el ingreso "${ingreso.descripcion}"?`
                      )
                    ) {
                      onDelete(ingreso.id)
                    }
                  }}
                  disabled={isDisabled}
                  className="rounded p-1.5 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Eliminar ingreso"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
