import { useState } from 'react'
import { formatCurrency } from '../../../lib/formatters'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'

/**
 * CuotaEditModal: Modal de edición de cuota individual con dos opciones.
 * - "Ajustar solo esta cuota" (actualizar_cuota_individual)
 * - "Recalcular saldo pendiente futuro" (recalcular_cuotas_pendientes)
 */
export default function CuotaEditModal({
  isOpen,
  onClose,
  movimiento,
  compra,
  onAjustarCuota,
  onRecalcularSaldo,
  isLoading,
}) {
  const [nuevoMonto, setNuevoMonto] = useState(movimiento?.monto || '')
  const [nuevoSaldo, setNuevoSaldo] = useState(compra?.monto_total || '')
  const [modo, setModo] = useState('ajustar') // 'ajustar' o 'recalcular'
  const [error, setError] = useState('')

  if (!isOpen || !movimiento || !compra) return null

  const desvio = parseFloat(nuevoMonto || 0) - (movimiento.monto_teorico || movimiento.monto)

  const handleAjustarCuota = async () => {
    setError('')

    if (!nuevoMonto || parseFloat(nuevoMonto) <= 0) {
      setError('Monto debe ser > 0')
      return
    }

    try {
      await onAjustarCuota(movimiento.id, parseFloat(nuevoMonto))
      onClose()
    } catch (err) {
      setError(err.message || 'Error al ajustar cuota')
    }
  }

  const handleRecalcularSaldo = async () => {
    setError('')

    if (!nuevoSaldo || parseFloat(nuevoSaldo) <= 0) {
      setError('Saldo debe ser > 0')
      return
    }

    try {
      await onRecalcularSaldo(compra.id, parseFloat(nuevoSaldo))
      onClose()
    } catch (err) {
      setError(err.message || 'Error al recalcular saldo')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Editar Cuota</h2>

        <div className="mb-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
          <p>
            <strong>Compra:</strong> {compra.descripcion}
          </p>
          <p>
            <strong>Cuota:</strong> {movimiento.numero_cuota}/{compra.cantidad_cuotas}
          </p>
          <p>
            <strong>Monto teórico:</strong> {formatCurrency(movimiento.monto_teorico || movimiento.monto)}
          </p>
          {movimiento.ajustado_manualmente && (
            <p className="mt-2 text-yellow-700">⚠ Esta cuota ya fue ajustada anteriormente</p>
          )}
        </div>

        {/* Opción 1: Ajustar solo esta cuota */}
        <div className="mb-6 rounded-lg border border-slate-200 p-4">
          <label className="mb-2 flex items-center gap-2">
            <input
              type="radio"
              value="ajustar"
              checked={modo === 'ajustar'}
              onChange={() => setModo('ajustar')}
              className="rounded-full border-slate-300"
            />
            <span className="font-medium text-slate-900">Ajustar solo esta cuota</span>
          </label>
          <p className="mb-3 text-xs text-slate-600">
            Útil cuando llega el resumen de tarjeta con un monto diferente (recargo, interés, etc).
            Las demás cuotas no se modifican.
          </p>

          {modo === 'ajustar' && (
            <div className="space-y-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Nuevo monto ($)</label>
                <Input
                  type="number"
                  value={nuevoMonto}
                  onChange={(e) => setNuevoMonto(e.target.value)}
                  placeholder={movimiento.monto}
                  step="0.01"
                />
              </div>

              {nuevoMonto && (
                <div className="text-xs">
                  <span
                    className={`font-medium ${desvio >= 0 ? 'text-red-600' : 'text-green-600'}`}
                  >
                    Desvío: {desvio >= 0 ? '+' : ''}{formatCurrency(desvio)} ({Math.round((desvio / (movimiento.monto_teorico || movimiento.monto)) * 100)}%)
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Opción 2: Recalcular saldo pendiente futuro */}
        <div className="mb-6 rounded-lg border border-slate-200 p-4">
          <label className="mb-2 flex items-center gap-2">
            <input
              type="radio"
              value="recalcular"
              checked={modo === 'recalcular'}
              onChange={() => setModo('recalcular')}
              className="rounded-full border-slate-300"
            />
            <span className="font-medium text-slate-900">Recalcular saldo pendiente futuro</span>
          </label>
          <p className="mb-3 text-xs text-slate-600">
            Redistribuye un nuevo saldo entre todas las cuotas de períodos no cerrados.
            Útil si quieres ajustar el total pendiente por pago parcial o cambio de tasa.
          </p>

          {modo === 'recalcular' && (
            <div>
              <label className="text-sm font-medium text-slate-700">Nuevo saldo total ($)</label>
              <Input
                type="number"
                value={nuevoSaldo}
                onChange={(e) => setNuevoSaldo(e.target.value)}
                placeholder={compra.monto_total}
                step="0.01"
              />
            </div>
          )}
        </div>

        {error && <div className="mb-4 rounded bg-red-50 p-2 text-sm text-red-700">{error}</div>}

        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose} disabled={isLoading} className="flex-1">
            Cancelar
          </Button>

          <Button
            onClick={modo === 'ajustar' ? handleAjustarCuota : handleRecalcularSaldo}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </div>
    </div>
  )
}
