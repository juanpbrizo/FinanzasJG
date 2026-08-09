import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'

/**
 * Tarjeta estilo "sobre presupuestario" para un fondo de la plantilla.
 * Muestra el nombre, tipo, monto sugerido, cantidad de categorías y acciones.
 */
export default function FondoConfigCard({
  fondo,
  onDelete,
  onUpdate,
  onCreateCategoria,
  onDeleteCategoria,
  isLoading,
}) {
  const [showCategoriaForm, setShowCategoriaForm] = useState(false)
  const [categoriaNombre, setCategoriaNombre] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    nombre: fondo.nombre,
    monto_sugerido: String(fondo.monto_sugerido ?? ''),
    tipo: fondo.tipo,
  })

  const handleCrearCategoria = async (e) => {
    e.preventDefault()
    await onCreateCategoria({
      fondo_plantilla_id: fondo.id,
      nombre: categoriaNombre,
    })
    setCategoriaNombre('')
    setShowCategoriaForm(false)
  }

  const abrirEdicion = () => {
    setEditData({
      nombre: fondo.nombre,
      monto_sugerido: String(fondo.monto_sugerido ?? ''),
      tipo: fondo.tipo,
    })
    setIsEditing(true)
  }

  const handleGuardarEdicion = (e) => {
    e.preventDefault()
    const monto = Number(editData.monto_sugerido)
    if (!editData.nombre.trim() || !Number.isFinite(monto) || monto < 0) return
    onUpdate(fondo.id, {
      nombre: editData.nombre.trim(),
      monto_sugerido: monto,
      tipo: editData.tipo,
    })
    setIsEditing(false)
  }

  const handleEliminar = () => {
    const aviso =
      categoriaCount > 0
        ? `Se eliminará "${fondo.nombre}" y sus ${categoriaCount} categoría(s). ¿Continuar?`
        : `¿Eliminar el fondo "${fondo.nombre}"?`
    if (confirm(aviso)) onDelete(fondo.id)
  }

  // Badge de color según tipo
  const getTipoBadgeClasses = (tipo) => {
    const base = 'inline-block px-2 py-1 rounded text-xs font-medium'
    switch (tipo) {
      case 'gasto':
        return `${base} bg-red-100 text-red-800`
      case 'ahorro':
        return `${base} bg-green-100 text-green-800`
      case 'inversion':
        return `${base} bg-blue-100 text-blue-800`
      case 'deuda':
        return `${base} bg-yellow-100 text-yellow-800`
      default:
        return `${base} bg-slate-100 text-slate-800`
    }
  }

  const categoriaCount = fondo.categorias_plantilla?.length ?? 0

  if (isEditing) {
    return (
      <div className="rounded-xl bg-white p-5 shadow-md ring-2 ring-slate-900 transition-all">
        <form onSubmit={handleGuardarEdicion} className="space-y-3">
          <Input
            id={`edit-nombre-${fondo.id}`}
            label="Nombre"
            value={editData.nombre}
            onChange={(e) => setEditData((prev) => ({ ...prev, nombre: e.target.value }))}
            required
            autoFocus
          />
          <Input
            id={`edit-monto-${fondo.id}`}
            type="number"
            label="Monto sugerido"
            value={editData.monto_sugerido}
            onChange={(e) =>
              setEditData((prev) => ({ ...prev, monto_sugerido: e.target.value }))
            }
            step="0.01"
            min="0"
          />
          <div>
            <label
              htmlFor={`edit-tipo-${fondo.id}`}
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Tipo
            </label>
            <select
              id={`edit-tipo-${fondo.id}`}
              className="block w-full rounded-md border-0 px-3 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-slate-900 sm:text-sm"
              value={editData.tipo}
              onChange={(e) => setEditData((prev) => ({ ...prev, tipo: e.target.value }))}
            >
              <option value="gasto">Gasto</option>
              <option value="ahorro">Ahorro</option>
              <option value="inversion">Inversión</option>
              <option value="deuda">Deuda</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading} className="flex-1 text-sm">
              Guardar
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditing(false)}
              disabled={isLoading}
              className="flex-1 text-sm"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 hover:shadow-md transition-all">
      {/* Encabezado: nombre + tipo + acciones */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-slate-900 truncate">{fondo.nombre}</h3>
          <span className={getTipoBadgeClasses(fondo.tipo)}>{fondo.tipo}</span>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            onClick={abrirEdicion}
            disabled={isLoading}
            title="Editar fondo"
            className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
          >
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Editar</span>
          </button>
          <button
            onClick={handleEliminar}
            disabled={isLoading}
            title="Eliminar fondo"
            className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Eliminar</span>
          </button>
        </div>
      </div>

      {/* Monto sugerido */}
      <div className="mb-4 rounded-lg bg-slate-50 p-3">
        <p className="text-xs text-slate-600 mb-1">Monto Sugerido</p>
        <p className="text-lg font-bold text-slate-900">
          ${Number(fondo.monto_sugerido).toLocaleString('es-AR')}
        </p>
      </div>

      {/* Contador de categorías */}
      <div className="mb-4 text-xs text-slate-600">
        {categoriaCount === 0 ? (
          <span>Sin categorías aún</span>
        ) : (
          <span>
            {categoriaCount} categoría{categoriaCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Lista de categorías */}
      {categoriaCount > 0 && (
        <div className="mb-4 space-y-2 border-t pt-3">
          {fondo.categorias_plantilla.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between rounded bg-slate-50 px-2 py-1.5 text-sm"
            >
              <span className="truncate text-slate-700">{cat.nombre}</span>
              <button
                onClick={() => onDeleteCategoria(cat.id)}
                disabled={isLoading}
                title="Eliminar categoría"
                className="ml-2 rounded p-0.5 text-slate-400 hover:text-red-600 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="sr-only">Eliminar</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Formulario de crear categoría o botón */}
      {showCategoriaForm ? (
        <form onSubmit={handleCrearCategoria} className="space-y-2 border-t pt-3">
          <Input
            placeholder="Nombre de la categoría"
            value={categoriaNombre}
            onChange={(e) => setCategoriaNombre(e.target.value)}
            required
            autoFocus
          />
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 text-sm"
            >
              Guardar
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowCategoriaForm(false)
                setCategoriaNombre('')
              }}
              disabled={isLoading}
              className="flex-1 text-sm"
            >
              Cancelar
            </Button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowCategoriaForm(true)}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 py-2 text-sm font-medium text-slate-600 hover:border-slate-400 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Agregar Categoría
        </button>
      )}
    </div>
  )
}
