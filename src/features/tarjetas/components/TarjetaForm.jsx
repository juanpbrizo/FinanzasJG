import { useState } from 'react'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'

/**
 * TarjetaForm: Formulario para crear/editar tarjeta de crédito.
 * Campos: nombre, limite_total, dia_cierre, dia_vencimiento.
 */
export default function TarjetaForm({ tarjetaInicial, onSubmit, isLoading }) {
  const [nombre, setNombre] = useState(tarjetaInicial?.nombre || '')
  const [limitTotal, setLimitTotal] = useState(tarjetaInicial?.limite_total || '')
  const [diaCierre, setDiaCierre] = useState(tarjetaInicial?.dia_cierre || '')
  const [diaVencimiento, setDiaVencimiento] = useState(tarjetaInicial?.dia_vencimiento || '')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!nombre || !limitTotal || !diaCierre || !diaVencimiento) {
      setError('Todos los campos son obligatorios')
      return
    }

    const diaCierreNum = parseInt(diaCierre, 10)
    const diaVencimientoNum = parseInt(diaVencimiento, 10)

    if (diaCierreNum < 1 || diaCierreNum > 31) {
      setError('Día de cierre debe estar entre 1 y 31')
      return
    }

    if (diaVencimientoNum < 1 || diaVencimientoNum > 31) {
      setError('Día de vencimiento debe estar entre 1 y 31')
      return
    }

    try {
      await onSubmit({
        nombre,
        limite_total: parseFloat(limitTotal),
        dia_cierre: diaCierreNum,
        dia_vencimiento: diaVencimientoNum,
      })
      setNombre('')
      setLimitTotal('')
      setDiaCierre('')
      setDiaVencimiento('')
    } catch (err) {
      setError(err.message || 'Error al guardar la tarjeta')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
      <div>
        <label className="block text-sm font-medium text-slate-900">Nombre de la tarjeta</label>
        <Input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Visa Personal"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-900">Límite total ($)</label>
        <Input
          type="number"
          value={limitTotal}
          onChange={(e) => setLimitTotal(e.target.value)}
          placeholder="Ej: 100000"
          step="0.01"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-900">Día de cierre</label>
          <Input
            type="number"
            value={diaCierre}
            onChange={(e) => setDiaCierre(e.target.value)}
            placeholder="1-31"
            min="1"
            max="31"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-900">Día de vencimiento</label>
          <Input
            type="number"
            value={diaVencimiento}
            onChange={(e) => setDiaVencimiento(e.target.value)}
            placeholder="1-31"
            min="1"
            max="31"
          />
        </div>
      </div>

      {error && <div className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</div>}

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Guardando...' : 'Guardar tarjeta'}
      </Button>
    </form>
  )
}
