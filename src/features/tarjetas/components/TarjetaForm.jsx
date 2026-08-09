import { useState } from 'react'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'

/**
 * TarjetaForm: Formulario para crear/editar tarjeta de crédito.
 * Campos: nombre, limite_total, dia_cierre, dia_vencimiento, marca.
 *
 * El estado inicial se toma de `tarjetaInicial` al montar. Para reutilizarlo
 * con otra tarjeta hay que remontarlo (prop `key`), como hace TarjetasPage.
 */
export default function TarjetaForm({ tarjetaInicial, onSubmit, onCancel, isLoading }) {
  const [nombre, setNombre] = useState(tarjetaInicial?.nombre || '')
  const [limitTotal, setLimitTotal] = useState(tarjetaInicial?.limite_total || '')
  const [diaCierre, setDiaCierre] = useState(tarjetaInicial?.dia_cierre || '')
  const [diaVencimiento, setDiaVencimiento] = useState(tarjetaInicial?.dia_vencimiento || '')
  const [marca, setMarca] = useState(tarjetaInicial?.marca || 'OTRA')
  const [error, setError] = useState('')
  const esEdicion = Boolean(tarjetaInicial)

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
        marca,
      })
      if (!esEdicion) {
        setNombre('')
        setLimitTotal('')
        setDiaCierre('')
        setDiaVencimiento('')
        setMarca('OTRA')
      }
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

      <div>
        <label className="block text-sm font-medium text-slate-900">Marca de tarjeta</label>
        <select
          value={marca}
          onChange={(e) => setMarca(e.target.value)}
          className="mt-1 block w-full rounded border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 placeholder-slate-500 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
        >
          <option value="VISA">Visa</option>
          <option value="MASTERCARD">Mastercard</option>
          <option value="AMEX">American Express</option>
          <option value="OTRA">Otra</option>
        </select>
      </div>

      {error && <div className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</div>}

      <div className="flex gap-2">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} className="w-full">
            Cancelar
          </Button>
        ) : null}
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Guardar tarjeta'}
        </Button>
      </div>
    </form>
  )
}
