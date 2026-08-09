import { useState } from 'react'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import Modal from '../../../components/ui/Modal'

/**
 * Modal para crear un nuevo fondo en la plantilla.
 */
export default function CreateFondoModal({ isOpen, onClose, onSubmit, isLoading }) {
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
    <Modal isOpen={isOpen} onClose={onClose} title="Crear Fondo">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          name="nombre"
          label="Nombre del Fondo"
          placeholder="Ej: Hogar, Ocio, etc"
          value={formData.nombre}
          onChange={handleChange}
          required
          autoFocus
        />

        <Input
          name="monto_sugerido"
          type="number"
          label="Monto Sugerido ($)"
          placeholder="0.00"
          value={formData.monto_sugerido}
          onChange={handleChange}
          step="0.01"
          min="0"
        />

        <div>
          <label htmlFor="tipo" className="mb-1.5 block text-sm font-medium text-slate-900">
            Tipo
          </label>
          <select
            id="tipo"
            name="tipo"
            className="block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            value={formData.tipo}
            onChange={handleChange}
          >
            <option value="gasto">Gasto</option>
            <option value="ahorro">Ahorro</option>
            <option value="inversion">Inversión</option>
            <option value="deuda">Deuda</option>
          </select>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="w-full"
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Creando...' : 'Crear Fondo'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
