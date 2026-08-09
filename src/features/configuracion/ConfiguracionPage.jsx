import { useState } from 'react'
import { Plus } from 'lucide-react'
import Spinner from '../../components/ui/Spinner'
import Toast from '../../components/ui/Toast'
import Tabs from '../../components/ui/Tabs'
import Button from '../../components/ui/Button'
import CreateFondoModal from './components/CreateFondoModal'
import FondoConfigCard from './components/FondoConfigCard'
import CreateTarjetaModal from './components/CreateTarjetaModal'
import TarjetaCreditoCard from './components/TarjetaCreditoCard'
import {
  useCrearCategoriaPlantilla,
  useCrearFondoPlantilla,
  useActualizarFondoPlantilla,
  useEliminarCategoriaPlantilla,
  useEliminarFondoPlantilla,
  useFondosPlantilla,
} from '../presupuesto/hooks'
import {
  useTarjetas,
  useCrearTarjeta,
  useActualizarTarjeta,
  useEliminarTarjeta,
} from '../tarjetas/hooks'

export default function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState('fondos')
  const [showCreateFondoModal, setShowCreateFondoModal] = useState(false)
  const [showCreateTarjetaModal, setShowCreateTarjetaModal] = useState(false)
  const [tarjetaEnEdicion, setTarjetaEnEdicion] = useState(null)
  const [toast, setToast] = useState(null)

  // Fondos
  const { data: fondos, isLoading: fondosLoading, error: fondosError } = useFondosPlantilla()
  const crearFondo = useCrearFondoPlantilla()
  const actualizarFondo = useActualizarFondoPlantilla()
  const crearCategoria = useCrearCategoriaPlantilla()
  const eliminarFondo = useEliminarFondoPlantilla()
  const eliminarCategoria = useEliminarCategoriaPlantilla()

  // Tarjetas
  const { data: tarjetas, isLoading: tarjetasLoading, error: tarjetasError } = useTarjetas()
  const crearTarjeta = useCrearTarjeta()
  const actualizarTarjeta = useActualizarTarjeta()
  const eliminarTarjeta = useEliminarTarjeta()

  const mutationOptions = (mensajeExito, { closeModal = false } = {}) => ({
    onSuccess: () => {
      setToast({ variant: 'success', message: mensajeExito })
      if (closeModal) {
        setShowCreateFondoModal(false)
        setShowCreateTarjetaModal(false)
        setTarjetaEnEdicion(null)
      }
    },
    onError: (err) =>
      setToast({ variant: 'error', message: err?.message ?? 'La operación falló' }),
  })

  if (fondosLoading || tarjetasLoading) return <Spinner />

  const error = fondosError || tarjetasError
  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
        Error al cargar la configuración: {error.message}
      </div>
    )
  }

  // Contenido de pestaña Fondos
  const tabFondos = (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Fondos de Presupuesto</h2>
        <button
          onClick={() => setShowCreateFondoModal(true)}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          title="Crear nuevo fondo"
        >
          <Plus className="h-5 w-5" />
          <span className="sr-only">Crear fondo</span>
        </button>
      </div>

      {/* Modal */}
      <CreateFondoModal
        isOpen={showCreateFondoModal}
        onClose={() => setShowCreateFondoModal(false)}
        onSubmit={(data) =>
          crearFondo.mutateAsync(data, mutationOptions('Fondo creado', { closeModal: true }))
        }
        isLoading={crearFondo.isPending}
      />

      {/* Listado */}
      {fondos && fondos.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {fondos.map((fondo) => (
            <FondoConfigCard
              key={fondo.id}
              fondo={fondo}
              onDelete={(id) =>
                eliminarFondo.mutate(id, mutationOptions('Fondo eliminado'))
              }
              onUpdate={(id, payload) =>
                actualizarFondo.mutate(
                  { fondoId: id, payload },
                  mutationOptions('Fondo actualizado')
                )
              }
              onCreateCategoria={(data) =>
                crearCategoria.mutate(data, mutationOptions('Categoría creada'))
              }
              onDeleteCategoria={(id) =>
                eliminarCategoria.mutate(id, mutationOptions('Categoría eliminada'))
              }
              isLoading={
                crearFondo.isPending ||
                actualizarFondo.isPending ||
                crearCategoria.isPending ||
                eliminarFondo.isPending ||
                eliminarCategoria.isPending
              }
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg bg-slate-50 p-8 text-center">
          <p className="text-sm text-slate-600">
            Aún no hay fondos. Haz clic en el botón <strong>+</strong> para crear el primero.
          </p>
        </div>
      )}
    </div>
  )

  // Contenido de pestaña Tarjetas
  const tabTarjetas = (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Tarjetas de Crédito</h2>
        <button
          onClick={() => {
            setTarjetaEnEdicion(null)
            setShowCreateTarjetaModal(true)
          }}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          title="Crear nueva tarjeta"
        >
          <Plus className="h-5 w-5" />
          <span className="sr-only">Crear tarjeta</span>
        </button>
      </div>

      {/* Modal */}
      <CreateTarjetaModal
        isOpen={showCreateTarjetaModal}
        onClose={() => {
          setShowCreateTarjetaModal(false)
          setTarjetaEnEdicion(null)
        }}
        onSubmit={(data) => {
          if (tarjetaEnEdicion) {
            return actualizarTarjeta.mutateAsync(
              { tarjetaId: tarjetaEnEdicion.id, payload: data },
              mutationOptions('Tarjeta actualizada', { closeModal: true })
            )
          }
          return crearTarjeta.mutateAsync(data, mutationOptions('Tarjeta creada', { closeModal: true }))
        }}
        isLoading={crearTarjeta.isPending || actualizarTarjeta.isPending}
        tarjetaInicial={tarjetaEnEdicion}
      />

      {/* Listado */}
      {tarjetas && tarjetas.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 place-items-start">
          {tarjetas.map((tarjeta) => (
            <TarjetaCreditoCard
              key={tarjeta.id}
              tarjeta={tarjeta}
              onEdit={(t) => {
                setTarjetaEnEdicion(t)
                setShowCreateTarjetaModal(true)
              }}
              onDelete={(id) =>
                eliminarTarjeta.mutate(id, mutationOptions('Tarjeta eliminada'))
              }
              isLoading={
                crearTarjeta.isPending ||
                actualizarTarjeta.isPending ||
                eliminarTarjeta.isPending
              }
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg bg-slate-50 p-8 text-center">
          <p className="text-sm text-slate-600">
            Aún no hay tarjetas. Haz clic en el botón <strong>+</strong> para crear la primera.
          </p>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-6 text-2xl font-bold text-slate-900">Configuración</h1>

        <Tabs
          tabs={[
            { id: 'fondos', label: 'Fondos', content: tabFondos },
            { id: 'tarjetas', label: 'Tarjetas', content: tabTarjetas },
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>

      <Toast
        message={toast?.message}
        variant={toast?.variant}
        onDismiss={() => setToast(null)}
      />
    </div>
  )
}
