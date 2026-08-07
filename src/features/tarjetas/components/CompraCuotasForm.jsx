import { useState } from 'react'
import { calcularImpacto, generarPeriodosCuotas } from '../calcularImpacto'
import { formatCurrency, formatMonthLabel } from '../../../lib/formatters'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'

/**
 * CompraCuotasForm: Formulario para registrar compra en N cuotas.
 * Incluye preview en vivo de la distribución de cuotas.
 */
export default function CompraCuotasForm({ tarjetas, categorias, onSubmit, isLoading }) {
  const [tarjetaId, setTarjetaId] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [montoTotal, setMontoTotal] = useState('')
  const [cantidadCuotas, setCantidadCuotas] = useState('')
  const [fechaCompra, setFechaCompra] = useState(new Date().toISOString().split('T')[0])
  const [categoriaId, setCategoriaId] = useState('')
  const [esMontVariable, setEsMontVariable] = useState(false)
  const [error, setError] = useState('')

  const tarjetaSeleccionada = tarjetas?.find((t) => t.id === tarjetaId)
  const cantidadCuotasNum = parseInt(cantidadCuotas, 10) || 0
  const montoTotalNum = parseFloat(montoTotal) || 0

  // Calcula primer período de impacto (Regla R2)
  let primerPeriodo = null
  let periodosPreview = []
  let montoPorCuota = 0

  if (tarjetaSeleccionada && fechaCompra && cantidadCuotasNum > 0 && montoTotalNum > 0) {
    try {
      const fecha = new Date(fechaCompra)
      primerPeriodo = calcularImpacto(fecha, tarjetaSeleccionada.dia_cierre)
      periodosPreview = generarPeriodosCuotas(primerPeriodo, cantidadCuotasNum)
      montoPorCuota = montoTotalNum / cantidadCuotasNum
    } catch (err) {
      console.error('Error al calcular impacto:', err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!tarjetaId) {
      setError('Seleccioná una tarjeta para registrar la compra')
      return
    }

    if (!descripcion.trim() || !montoTotal || !cantidadCuotas || !fechaCompra) {
      setError('Todos los campos son obligatorios')
      return
    }

    // La RPC imputa cada cuota a una categoría del presupuesto: es obligatoria.
    if (!categoriaId) {
      setError(
        categorias && categorias.length > 0
          ? 'Debes seleccionar una categoría'
          : 'No hay categorías en tu plantilla. Creá al menos una en Configuración antes de registrar compras en cuotas.'
      )
      return
    }

    if (parseFloat(montoTotal) <= 0 || parseInt(cantidadCuotas, 10) < 1) {
      setError('Monto y cantidad de cuotas inválidos')
      return
    }

    try {
      await onSubmit({
        tarjeta_id: tarjetaId,
        descripcion: descripcion.trim(),
        monto_total: parseFloat(montoTotal),
        cantidad_cuotas: parseInt(cantidadCuotas, 10),
        fecha_compra: fechaCompra,
        categoria_plantilla_id: categoriaId,
        es_monto_variable: esMontVariable,
      })

      // Limpia el formulario
      setTarjetaId('')
      setDescripcion('')
      setMontoTotal('')
      setCantidadCuotas('')
      setFechaCompra(new Date().toISOString().split('T')[0])
      setCategoriaId('')
      setEsMontVariable(false)
    } catch (err) {
      console.error('Error al registrar compra:', {
        message: err?.message,
        details: err?.details,
        hint: err?.hint,
        code: err?.code,
      })
      setError(err?.message || 'Error al registrar la compra')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
      <div>
        <label className="block text-sm font-medium text-slate-900">Tarjeta</label>
        <select
          value={tarjetaId}
          onChange={(e) => setTarjetaId(e.target.value)}
          className="mt-1 block w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-500 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
        >
          <option value="">Selecciona una tarjeta</option>
          {tarjetas?.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-900">Descripción</label>
        <Input
          type="text"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Ej: Heladera"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-900">Monto total ($)</label>
          <Input
            type="number"
            value={montoTotal}
            onChange={(e) => setMontoTotal(e.target.value)}
            placeholder="120000"
            step="0.01"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-900">Cantidad de cuotas</label>
          <Input
            type="number"
            value={cantidadCuotas}
            onChange={(e) => setCantidadCuotas(e.target.value)}
            placeholder="12"
            min="1"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-900">Fecha de compra</label>
        <Input type="date" value={fechaCompra} onChange={(e) => setFechaCompra(e.target.value)} />
      </div>

      {categorias && categorias.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-slate-900">Categoría</label>
          <select
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            className="mt-1 block w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-500 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="">Selecciona una categoría</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="esMontVariable"
          checked={esMontVariable}
          onChange={(e) => setEsMontVariable(e.target.checked)}
          className="rounded border-slate-300"
        />
        <label htmlFor="esMontVariable" className="text-sm text-slate-700">
          Cuotas variables / ajustables por inflación
        </label>
      </div>

      {/* Preview en vivo */}
      {periodosPreview.length > 0 && (
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="mb-2 text-sm font-medium text-slate-900">
            Preview: {cantidadCuotasNum} cuotas de {formatCurrency(montoPorCuota)} desde{' '}
            {formatMonthLabel(primerPeriodo.toISOString().split('T')[0])}
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
            {periodosPreview.map((periodo, i) => (
              <div key={i} className="flex justify-between">
                <span>Cuota {i + 1}:</span>
                <span>{formatMonthLabel(periodo.toISOString().split('T')[0])}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <div className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</div>}

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Registrando...' : 'Registrar compra en cuotas'}
      </Button>
    </form>
  )
}
