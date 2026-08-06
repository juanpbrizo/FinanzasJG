import { useState } from 'react'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'

export default function CreateIngresoModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  initialData = null,
}) {
  const [formData, setFormData] = useState(
    initialData || {
      descripcion: '',
      monto: '',
      es_fijo: false,
      fecha: new Date().toISOString().split('T')[0],
    }
  )

  if (!isOpen) return null

  const isEditing = !!initialData

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validaciones
    if (!formData.descripcion?.trim()) {
      alert('La descripción es requerida')
      return
    }
    if (!formData.monto || parseFloat(formData.monto) <= 0) {
      alert('El monto debe ser mayor a $0')
      return
    }
    if (!formData.fecha) {
      alert('La fecha es requerida')
      return
    }

    await onSubmit({
      ...formData,
      monto: parseFloat(formData.monto),
    })

    // Limpiar formulario después del envío exitoso
    if (!isEditing) {
      setFormData({
        descripcion: '',
        monto: '',
        es_fijo: false,
        fecha: new Date().toISOString().split('T')[0],
      })
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4 z-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-slate-900">
          {isEditing ? 'Editar Ingreso' : 'Agregar Ingreso'}
        </h3>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <Input
            id="ingreso-descripcion"
            name="descripcion"
            label="Descripción"
            placeholder="Ej: Salario, Bono, Freelance"
            value={formData.descripcion}
            onChange={handleChange}
            required
          />

          <Input
            id="ingreso-monto"
            name="monto"
            type="number"
            label="Monto ($)"
            placeholder="0.00"
            value={formData.monto}
            onChange={handleChange}
            step="0.01"
            min="0.01"
            required
          />

          <Input
            id="ingreso-fecha"
            name="fecha"
            type="date"
            label="Fecha"
            value={formData.fecha}
            onChange={handleChange}
            required
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="es_fijo"
              name="es_fijo"
              checked={formData.es_fijo}
              onChange={handleChange}
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <label htmlFor="es_fijo" className="text-sm font-medium text-slate-700">
              Ingreso fijo (clonar en meses futuros)
            </label>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Guardando...' : isEditing ? 'Actualizar Ingreso' : 'Guardar Ingreso'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
