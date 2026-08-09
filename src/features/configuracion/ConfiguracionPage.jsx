import { useState } from 'react'
import { Plus } from 'lucide-react'
import Spinner from '../../components/ui/Spinner'
import Toast from '../../components/ui/Toast'
import CreateFondoModal from './components/CreateFondoModal'
import FondoConfigCard from './components/FondoConfigCard'
import {
  useCrearCategoriaPlantilla,
  useCrearFondoPlantilla,
  useEliminarCategoriaPlantilla,
  useEliminarFondoPlantilla,
  useFondosPlantilla,
} from '../presupuesto/hooks'

export default function ConfiguracionPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [toast, setToast] = useState(null)
  const { data: fondos, isLoading, error } = useFondosPlantilla()
  const crearFondo = useCrearFondoPlantilla()
  const crearCategoria = useCrearCategoriaPlantilla()
  const eliminarFondo = useEliminarFondoPlantilla()
  const eliminarCategoria = useEliminarCategoriaPlantilla()

  const mutationOptions = (mensajeExito) => ({
    onSuccess: () => {
      setToast({ variant: 'success', message: mensajeExito })
      setShowCreateModal(false)
    },
    onError: (err) =>
      setToast({ variant: 'error', message: err?.message ?? 'La operación falló' }),
  })

  if (isLoading) return <Spinner />

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
        Error al cargar la plantilla: {error.message}
      </div>
    )
  }


  return (
    <div className="space-y-6">
      {/* Encabezado con botón + */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Plantilla de Fondos y Categorías</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          title="Crear nuevo fondo"
        >
          <Plus className="h-5 w-5" />
          <span className="sr-only">Crear fondo</span>
        </button>
      </div>

      {/* Modal de creación */}
      <CreateFondoModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={(data) => crearFondo.mutate(data, mutationOptions('Fondo creado'))}
        isLoading={crearFondo.isPending}
      />

      {/* Contenido */}
      {fondos && fondos.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {fondos.map((fondo) => (
            <FondoConfigCard
              key={fondo.id}
              fondo={fondo}
              onDelete={(id) =>
                eliminarFondo.mutate(id, mutationOptions('Fondo eliminado'))
              }
              onCreateCategoria={(data) =>
                crearCategoria.mutate(data, mutationOptions('Categoría creada'))
              }
              onDeleteCategoria={(id) =>
                eliminarCategoria.mutate(id, mutationOptions('Categoría eliminada'))
              }
              isLoading={
                crearFondo.isPending ||
                crearCategoria.isPending ||
                eliminarFondo.isPending ||
                eliminarCategoria.isPending
              }
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg bg-slate-50 p-8 text-center">
          <p className="text-sm text-slate-600">Aún no hay fondos. Haz clic en el botón <strong>+</strong> para crear el primero.</p>
        </div>
      )}

      <Toast
        message={toast?.message}
        variant={toast?.variant}
        onDismiss={() => setToast(null)}
      />
    </div>
  )
}
