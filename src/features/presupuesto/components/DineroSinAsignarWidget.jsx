import { useState } from 'react'
import { Zap } from 'lucide-react'
import Button from '../../../components/ui/Button'
import TransferenciaFondosModal from './TransferenciaFondosModal'

/**
 * Widget prominente de "Dinero Sin Asignar".
 * Muestra verde si = 0, ámbar si > 0, rojo si < 0.
 * Incluye botón "Auto-asignar" que abre modal para distribuir.
 */
export default function DineroSinAsignarWidget({
  resumen,
  fondos,
  periodoId,
  periodoEstado,
  onTransferirSuccess,
}) {
  const [showModal, setShowModal] = useState(false)

  if (!resumen) {
    return null
  }

  const dineroSinAsignar = resumen.dinero_sin_asignar || 0

  // Determina color según saldo
  let bgColor = 'bg-green-50'
  let borderColor = 'border-green-200'
  let badgeColor = 'bg-green-100 text-green-800'
  let textColor = 'text-green-900'

  if (dineroSinAsignar > 0) {
    bgColor = 'bg-amber-50'
    borderColor = 'border-amber-200'
    badgeColor = 'bg-amber-100 text-amber-800'
    textColor = 'text-amber-900'
  } else if (dineroSinAsignar < 0) {
    bgColor = 'bg-red-50'
    borderColor = 'border-red-200'
    badgeColor = 'bg-red-100 text-red-800'
    textColor = 'text-red-900'
  }

  const isLocked = periodoEstado === 'cerrado'

  const handleAutoAsignar = () => {
    setShowModal(true)
  }

  return (
    <>
      <div className={`rounded-lg border-2 ${borderColor} ${bgColor} p-6 shadow-sm`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium ${textColor} opacity-75`}>
              Dinero Sin Asignar
            </p>
            <p className={`text-3xl font-bold ${textColor} mt-2`}>
              $
              {Math.abs(dineroSinAsignar).toLocaleString('es-AR', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </p>
            {dineroSinAsignar !== 0 && (
              <p className={`text-xs mt-1 ${textColor} opacity-60`}>
                {dineroSinAsignar > 0
                  ? 'Disponible para distribuir'
                  : 'Presupuesto excedido'}
              </p>
            )}
          </div>
          <div className={`rounded-full ${badgeColor} p-4`}>
            <Zap className="w-6 h-6" />
          </div>
        </div>

        {/* Acciones de reasignacion: siempre visibles mientras el periodo este abierto */}
        {!isLocked && (
          <Button onClick={handleAutoAsignar} variant="outline" className="mt-4 w-full text-sm">
            {dineroSinAsignar > 0
              ? 'Auto-asignar a Ahorro/Inversión'
              : 'Transferir entre Fondos'}
          </Button>
        )}

        {isLocked && (
          <p className="text-xs text-gray-500 mt-4 italic">
            Período cerrado — solo lectura
          </p>
        )}
      </div>

      {/* Modal de auto-asignación */}
      <TransferenciaFondosModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        periodoId={periodoId}
        fondos={fondos}
        dineroSinAsignar={dineroSinAsignar}
        isAutoAsign={true}
        onSuccess={() => {
          setShowModal(false)
          onTransferirSuccess?.()
        }}
      />
    </>
  )
}
