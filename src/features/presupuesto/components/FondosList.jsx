import { useState } from 'react'
import { Check, Pencil, X } from 'lucide-react'
import { formatCurrency } from '../../../lib/formatters'

function FondoCard({ fondo, onUpdatePresupuesto, onVerGastos, isLocked, isSaving }) {
  const [isEditing, setIsEditing] = useState(false)
  const [valor, setValor] = useState('')

  const gastoTotal = fondo.categorias_mensuales?.reduce((sum, cat) => {
    const movimientos = cat.movimientos ?? []
    return sum + movimientos.reduce((s, mov) => s + (mov.monto ?? 0), 0)
  }, 0) ?? 0

  const presupuesto = fondo.monto_presupuestado ?? 0
  const disponible = Math.max(0, presupuesto - gastoTotal)
  const porcentaje = presupuesto > 0 ? (gastoTotal / presupuesto) * 100 : 0
  const esAlerta = porcentaje > 100

  const abrirEdicion = () => {
    setValor(String(presupuesto))
    setIsEditing(true)
  }

  const guardar = () => {
    const monto = Number(valor)
    if (!Number.isFinite(monto) || monto < 0) return
    onUpdatePresupuesto?.(fondo.id, monto)
    setIsEditing(false)
  }

  return (
    <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-slate-900">{fondo.nombre}</h4>
          <div className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Gastado:</span>
              <span className="font-medium">{formatCurrency(gastoTotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Límite:</span>
              <span className="font-medium">{formatCurrency(presupuesto)}</span>
            </div>
            <div className={`flex justify-between rounded px-2 py-1 ${disponible > 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <span className={disponible > 0 ? 'text-green-700' : 'text-red-700'}>Disponible:</span>
              <span className={`font-semibold ${disponible > 0 ? 'text-green-700' : 'text-red-700'}`}>
                {formatCurrency(disponible)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onVerGastos?.(fondo)}
            title={`Ver gastos de ${fondo.nombre}`}
            className="cursor-pointer rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          >
            {fondo.tipo}
          </button>
          {!isLocked && !isEditing && (
            <button
              type="button"
              onClick={abrirEdicion}
              title="Ajustar presupuesto del mes"
              className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {isEditing && (
        <div className="mt-3 flex items-center gap-2">
          <label htmlFor={`presupuesto-${fondo.id}`} className="sr-only">
            Presupuesto de {fondo.nombre}
          </label>
          <input
            id={`presupuesto-${fondo.id}`}
            type="number"
            min="0"
            step="0.01"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className="w-40 rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-slate-900 focus:outline-none"
          />
          <button
            type="button"
            onClick={guardar}
            disabled={isSaving}
            title="Guardar presupuesto"
            className="rounded bg-slate-900 p-1.5 text-white hover:bg-slate-700 disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            title="Cancelar"
            className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Barra de progreso */}
      <div className="mt-3 h-2 rounded-full bg-slate-200 overflow-hidden">
        <div
          className={`h-full transition-colors ${esAlerta ? 'bg-red-500' : 'bg-emerald-500'}`}
          style={{ width: `${Math.min(porcentaje, 100)}%` }}
        />
      </div>

      {/* Lista de categorias */}
      {fondo.categorias_mensuales && fondo.categorias_mensuales.length > 0 && (
        <ul className="mt-3 space-y-1">
          {fondo.categorias_mensuales.map((cat) => {
            const catGasto = (cat.movimientos ?? []).reduce((s, mov) => s + (mov.monto ?? 0), 0)
            return (
              <li key={cat.id} className="text-xs text-slate-600">
                <span className="font-medium">{cat.nombre}</span>: {formatCurrency(catGasto)} /{' '}
                {formatCurrency(cat.monto_presupuestado)}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default function FondosList({
  fondos,
  onUpdatePresupuesto,
  onVerGastos,
  isLocked,
  isSaving,
}) {
  if (!fondos || fondos.length === 0) {
    return (
      <div className="rounded-lg bg-slate-50 p-6 text-center text-sm text-slate-600">
        No hay fondos en este mes. Creá tu plantilla en Configuración y luego usá el botón
        &laquo;Sincronizar Fondos&raquo;.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {fondos.map((fondo) => (
        <FondoCard
          key={fondo.id}
          fondo={fondo}
          onUpdatePresupuesto={onUpdatePresupuesto}
          onVerGastos={onVerGastos}
          isLocked={isLocked}
          isSaving={isSaving}
        />
      ))}
    </div>
  )
}
