import { useState } from 'react'
import { AlertCircle, Lock } from 'lucide-react'
import { useCerrarPeriodo } from '../hooks'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'

/**
 * Botón para cerrar un período.
 * Abre modal de confirmación explicando las implicaciones.
 */
export default function BotonCerrarPeriodo({ periodo, periodoEstado, onSuccess }) {
  const [showConfirm, setShowConfirm] = useState(false)
  const cerrar = useCerrarPeriodo()

  if (periodoEstado === 'cerrado') {
    return (
      <div className="flex items-center gap-2 text-gray-600 text-sm">
        <Lock className="w-4 h-4" />
        <span>Período cerrado</span>
      </div>
    )
  }

  const handleConfirm = async () => {
    try {
      await cerrar.mutateAsync(periodo)
      setShowConfirm(false)
      onSuccess?.()
    } catch (error) {
      console.error('Error al cerrar período:', error)
      alert('Error: ' + error.message)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowConfirm(true)}
        className="text-red-600 hover:bg-red-50 border-red-200"
      >
        Cerrar Mes
      </Button>

      <Modal isOpen={showConfirm} onClose={() => setShowConfirm(false)} title="Cerrar Período">
        <div className="space-y-4">
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900">Acción irreversible</p>
              <p className="text-sm text-amber-800 mt-1">
                Una vez cerrado, este período pasará a modo{' '}
                <strong>solo lectura</strong>. No podrás editar:
              </p>
              <ul className="text-sm text-amber-800 mt-2 ml-4 list-disc space-y-1">
                <li>Movimientos (gastos)</li>
                <li>Ingresos</li>
                <li>Fondos presupuestados</li>
                <li>Transferencias entre fondos</li>
              </ul>
            </div>
          </div>

          <p className="text-gray-600 text-sm">
            Los datos históricos se conservan para auditoría y análisis. Para realizar cambios,
            deberá abrir un nuevo período.
          </p>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={cerrar.isPending}
              isLoading={cerrar.isPending}
            >
              Cerrar Período
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
