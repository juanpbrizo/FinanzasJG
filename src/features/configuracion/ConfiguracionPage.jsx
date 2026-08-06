import { useState } from 'react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Spinner from '../../components/ui/Spinner'
import Toast from '../../components/ui/Toast'
import {
  useCrearCategoriaPlantilla,
  useCrearFondoPlantilla,
  useEliminarCategoriaPlantilla,
  useEliminarFondoPlantilla,
  useFondosPlantilla,
} from '../presupuesto/hooks'

function FondoForm({ onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    nombre: '',
    monto_sugerido: '',
    tipo: 'gasto',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    await onSubmit({
      ...formData,
      monto_sugerido: parseFloat(formData.monto_sugerido),
    })
    setFormData({ nombre: '', monto_sugerido: '', tipo: 'gasto' })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg bg-slate-50 p-4">
      <h4 className="font-semibold text-slate-900">Crear Fondo</h4>

      <Input
        name="nombre"
        label="Nombre"
        placeholder="Ej: Hogar"
        value={formData.nombre}
        onChange={handleChange}
        required
      />

      <Input
        name="monto_sugerido"
        type="number"
        label="Monto Sugerido"
        placeholder="0.00"
        value={formData.monto_sugerido}
        onChange={handleChange}
        step="0.01"
        min="0"
      />

      <div>
        <label htmlFor="tipo" className="mb-1.5 block text-sm font-medium text-slate-700">
          Tipo
        </label>
        <select
          id="tipo"
          name="tipo"
          className="block w-full rounded-md border-0 px-3 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-slate-900 sm:text-sm"
          value={formData.tipo}
          onChange={handleChange}
        >
          <option value="gasto">Gasto</option>
          <option value="ahorro">Ahorro</option>
          <option value="inversion">Inversión</option>
          <option value="deuda">Deuda</option>
        </select>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Creando...' : 'Crear Fondo'}
      </Button>
    </form>
  )
}

function FondoCard({ fondo, onDeleteFondo, onCreateCategoria, onDeleteCategoria, isLoading }) {
  const [showCategoriaForm, setShowCategoriaForm] = useState(false)
  const [categoriaNombre, setCategoriaNombre] = useState('')

  const handleCrearCategoria = async (e) => {
    e.preventDefault()
    await onCreateCategoria({
      fondo_plantilla_id: fondo.id,
      nombre: categoriaNombre,
    })
    setCategoriaNombre('')
    setShowCategoriaForm(false)
  }

  return (
    <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-semibold text-slate-900">{fondo.nombre}</h4>
          <p className="text-sm text-slate-500">
            Monto sugerido: ${fondo.monto_sugerido} • Tipo: {fondo.tipo}
          </p>
        </div>
        <Button
          variant="danger"
          onClick={() => onDeleteFondo(fondo.id)}
          disabled={isLoading}
          className="text-xs"
        >
          Eliminar
        </Button>
      </div>

      {/* Categorias */}
      {fondo.categorias_plantilla && fondo.categorias_plantilla.length > 0 && (
        <ul className="mt-3 space-y-2 border-t pt-3">
          {fondo.categorias_plantilla.map((cat) => (
            <li
              key={cat.id}
              className="flex items-center justify-between rounded bg-slate-50 p-2 text-sm"
            >
              <span>{cat.nombre}</span>
              <Button
                variant="danger"
                onClick={() => onDeleteCategoria(cat.id)}
                disabled={isLoading}
                className="text-xs"
              >
                ×
              </Button>
            </li>
          ))}
        </ul>
      )}

      {/* Formulario de categoria */}
      {showCategoriaForm ? (
        <form onSubmit={handleCrearCategoria} className="mt-3 space-y-2 border-t pt-3">
          <Input
            placeholder="Nombre de la categoría"
            value={categoriaNombre}
            onChange={(e) => setCategoriaNombre(e.target.value)}
            required
          />
          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading} className="flex-1 text-sm">
              Guardar
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowCategoriaForm(false)
                setCategoriaNombre('')
              }}
              className="flex-1 text-sm"
            >
              Cancelar
            </Button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowCategoriaForm(true)}
          className="mt-3 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          + Agregar Categoría
        </button>
      )}
    </div>
  )
}

export default function ConfiguracionPage() {
  const [toast, setToast] = useState(null)
  const { data: fondos, isLoading, error } = useFondosPlantilla()
  const crearFondo = useCrearFondoPlantilla()
  const crearCategoria = useCrearCategoriaPlantilla()
  const eliminarFondo = useEliminarFondoPlantilla()
  const eliminarCategoria = useEliminarCategoriaPlantilla()

  // Las mutaciones fallaban en silencio: el usuario solo veia el 400 en consola.
  const mutationOptions = (mensajeExito) => ({
    onSuccess: () => setToast({ variant: 'success', message: mensajeExito }),
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

  const isMutating =
    crearFondo.isPending ||
    crearCategoria.isPending ||
    eliminarFondo.isPending ||
    eliminarCategoria.isPending

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Plantilla de Fondos y Categorías</h1>

      <FondoForm
        onSubmit={(data) => crearFondo.mutate(data, mutationOptions('Fondo creado'))}
        isLoading={isMutating}
      />

      <div className="space-y-3">
        {fondos && fondos.length > 0 ? (
          fondos.map((fondo) => (
            <FondoCard
              key={fondo.id}
              fondo={fondo}
              onDeleteFondo={(id) =>
                eliminarFondo.mutate(id, mutationOptions('Fondo eliminado'))
              }
              onCreateCategoria={(data) =>
                crearCategoria.mutate(data, mutationOptions('Categoría creada'))
              }
              onDeleteCategoria={(id) =>
                eliminarCategoria.mutate(id, mutationOptions('Categoría eliminada'))
              }
              isLoading={isMutating}
            />
          ))
        ) : (
          <div className="rounded-lg bg-slate-50 p-6 text-center text-sm text-slate-600">
            Aún no hay fondos. Crea el primero para comenzar.
          </div>
        )}
      </div>

      <Toast
        message={toast?.message}
        variant={toast?.variant}
        onDismiss={() => setToast(null)}
      />
    </section>
  )
}
