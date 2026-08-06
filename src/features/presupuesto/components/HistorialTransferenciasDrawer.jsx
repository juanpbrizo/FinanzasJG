import { X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { useHistorialTransferencias } from '../hooks'

/**
 * Drawer que muestra el historial de transferencias del período.
 */
export default function HistorialTransferenciasDrawer({ isOpen, onClose, periodoId }) {
  const { data: transferencias, isLoading } = useHistorialTransferencias(periodoId)

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-96 bg-white shadow-xl z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Historial de Reasignaciones</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <p className="text-center text-gray-500">Cargando...</p>
          ) : !transferencias || transferencias.length === 0 ? (
            <p className="text-center text-gray-400 text-sm">
              Sin transferencias registradas
            </p>
          ) : (
            <div className="space-y-4">
              {transferencias.map((t) => (
                <div
                  key={t.id}
                  className="rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition"
                >
                  {/* Origen → Destino */}
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {t.fondo_origen?.nombre || 'Fondo Origen'}
                      </p>
                      <p className="text-xs text-gray-500">Origen</p>
                    </div>
                    <div className="text-gray-400">→</div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 text-right">
                        {t.fondo_destino?.nombre || 'Fondo Destino'}
                      </p>
                      <p className="text-xs text-gray-500 text-right">Destino</p>
                    </div>
                  </div>

                  {/* Monto */}
                  <p className="text-lg font-bold text-indigo-600 mb-2">
                    ${t.monto.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                  </p>

                  {/* Motivo */}
                  {t.motivo && (
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Motivo:</span> {t.motivo}
                    </p>
                  )}

                  {/* Fecha */}
                  <p className="text-xs text-gray-400">
                    hace{' '}
                    {formatDistanceToNow(new Date(t.created_at), {
                      locale: es,
                      addSuffix: false,
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
