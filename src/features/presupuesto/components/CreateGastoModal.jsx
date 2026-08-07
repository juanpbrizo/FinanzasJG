import { useState } from 'react'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'

export default function CreateGastoModal({ isOpen, onClose, onSubmit, categorias, isLoading }) {
  const [formData, setFormData] = useState({
    monto: '',
    descripcion: '',
    fecha_transaccion: new Date().toISOString().split('T')[0],
    categoria_mensual_id: '',
    medio_pago: 'efectivo',
  })

  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const creado = await onSubmit({
      ...formData,
      monto: parseFloat(formData.monto),
    })
    // Si el guardado falla se conservan los datos para reintentar.
    if (creado === false) return
    setFormData({
      monto: '',
      descripcion: '',
      fecha_transaccion: new Date().toISOString().split('T')[0],
      categoria_mensual_id: '',
      medio_pago: 'efectivo',
    })
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4 z-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-slate-900">Registrar Gasto</h3>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <Input
            name="monto"
            type="number"
            label="Monto"
            placeholder="0.00"
            value={formData.monto}
            onChange={handleChange}
            step="0.01"
            min="0"
            required
          />

          <Input
            name="descripcion"
            label="Descripción"
            placeholder="Ej: Compra en supermercado"
            value={formData.descripcion}
            onChange={handleChange}
            required
          />

          <Input
            name="fecha_transaccion"
            type="date"
            label="Fecha"
            value={formData.fecha_transaccion}
            onChange={handleChange}
            required
          />

          <div>
            <label htmlFor="categoria" className="mb-1.5 block text-sm font-medium text-slate-700">
              Categoría
            </label>
            <select
              id="categoria"
              name="categoria_mensual_id"
              className="block w-full rounded-md border-0 px-3 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-slate-900 sm:text-sm"
              value={formData.categoria_mensual_id}
              onChange={handleChange}
              required
            >
              <option value="">Selecciona una categoría</option>
              {categorias?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="medio" className="mb-1.5 block text-sm font-medium text-slate-700">
              Medio de Pago
            </label>
            <select
              id="medio"
              name="medio_pago"
              className="block w-full rounded-md border-0 px-3 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-slate-900 sm:text-sm"
              value={formData.medio_pago}
              onChange={handleChange}
            >
              <option value="efectivo">Efectivo</option>
              <option value="debito">Débito</option>
              <option value="transferencia">Transferencia</option>
            </select>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
