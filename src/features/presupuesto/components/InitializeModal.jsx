import Button from '../../../components/ui/Button'
import Spinner from '../../../components/ui/Spinner'

export default function InitializeModal({ isOpen, onClose, onConfirm, isLoading }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4 z-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-slate-900">Inicializar mes</h3>
        <p className="mt-2 text-sm text-slate-600">
          Se clonarán los fondos, categorías e ingresos fijos de tu plantilla. ¿Deseas continuar?
        </p>
        <div className="mt-6 flex gap-3 justify-end">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Inicializando...' : 'Confirmar'}
          </Button>
        </div>
      </div>
    </div>
  )
}
