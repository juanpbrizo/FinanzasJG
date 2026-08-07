import { formatCurrency } from '../../../lib/formatters'

/**
 * SuscripcionesList: Muestra lista de suscripciones activas e inactivas.
 */
export default function SuscripcionesList({
  suscripciones,
  tarjetas,
  categorias,
  onEdit,
  onDesactivar,
  onEliminar,
  isLoading,
}) {
  if (!suscripciones || suscripciones.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center text-slate-600">
        Aún no hay suscripciones registradas.
      </div>
    )
  }

  const obtenerNombreTarjeta = (id) => tarjetas?.find((t) => t.id === id)?.nombre || 'N/A'
  const obtenerNombreCategoria = (id) => categorias?.find((c) => c.id === id)?.nombre || 'N/A'

  const suscripcionesActivas = suscripciones.filter((s) => s.activa)
  const suscripcionesInactivas = suscripciones.filter((s) => !s.activa)

  const renderSuscripcion = (suscripcion) => (
    <div
      key={suscripcion.id}
      className={`rounded-lg border p-4 ${
        suscripcion.activa
          ? 'border-slate-200 bg-white shadow-sm hover:shadow-md'
          : 'border-slate-200 bg-slate-50'
      } transition-shadow`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3
            className={`font-semibold ${suscripcion.activa ? 'text-slate-900' : 'text-slate-500 line-through'}`}
          >
            {suscripcion.nombre}
          </h3>
          <p className="text-xs text-slate-600 mt-1">
            Tarjeta: {obtenerNombreTarjeta(suscripcion.tarjeta_id)}
          </p>
          <p className="text-xs text-slate-600">
            Categoría: {suscripcion.categoria_plantilla_id ? obtenerNombreCategoria(suscripcion.categoria_plantilla_id) : 'A asignar'}
          </p>
          <p className="text-xs text-slate-600">
            Frecuencia: {suscripcion.frecuencia}
            {suscripcion.frecuencia === 'ANUAL' ? ` (mes ${suscripcion.mes_cobro_anual})` : ''}
            {' • '}
            Día {suscripcion.dia_vencimiento}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className="font-semibold text-slate-900">
            {formatCurrency(suscripcion.monto)}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => onEdit?.(suscripcion)}
              disabled={isLoading}
              className="px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded disabled:opacity-50"
            >
              Editar
            </button>
            {suscripcion.activa ? (
              <button
                onClick={() => onDesactivar?.(suscripcion.id)}
                disabled={isLoading}
                className="px-2 py-1 text-xs font-medium text-yellow-700 hover:bg-yellow-50 rounded disabled:opacity-50"
              >
                Desactivar
              </button>
            ) : (
              <button
                onClick={() => onEliminar?.(suscripcion.id)}
                disabled={isLoading}
                className="px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 rounded disabled:opacity-50"
              >
                Eliminar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      {suscripcionesActivas.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-900">Activas ({suscripcionesActivas.length})</h3>
          <div className="space-y-2">
            {suscripcionesActivas.map(renderSuscripcion)}
          </div>
        </div>
      )}

      {suscripcionesInactivas.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-600">Inactivas ({suscripcionesInactivas.length})</h3>
          <div className="space-y-2">
            {suscripcionesInactivas.map(renderSuscripcion)}
          </div>
        </div>
      )}
    </div>
  )
}
