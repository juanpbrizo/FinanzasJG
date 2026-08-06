import Button from '../../../components/ui/Button'

export default function EmptyState({ _periodo, onInitialize }) {
  return (
    <div className="flex min-h-96 items-center justify-center rounded-lg bg-slate-50 p-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-slate-900">Este mes aún no ha sido inicializado</h3>
        <p className="mt-2 text-sm text-slate-600">
          Crea una instancia de este periodo clonando tu plantilla de fondos y categorías.
        </p>
        <Button
          onClick={onInitialize}
          className="mt-4"
        >
          Inicializar Mes desde Plantilla
        </Button>
      </div>
    </div>
  )
}
