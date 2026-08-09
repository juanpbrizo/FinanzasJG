import { Edit2, Trash2 } from 'lucide-react'

/**
 * TarjetaCreditoCard: Simula el aspecto de una tarjeta de crédito real.
 * Diseño: gradiente sutil, chip, nombre, límite, fechas de cierre y vencimiento.
 */
export default function TarjetaCreditoCard({ tarjeta, onEdit, onDelete, isLoading }) {
  // Gradiente simple según disponibilidad o tipo
  const getGradient = () => {
    return 'from-blue-600 to-blue-800'
  }

  const getChipColor = () => 'bg-yellow-400'

  return (
    <div className="group relative">
      {/* Tarjeta principal */}
      <div
        className={`relative h-48 w-full max-w-xs rounded-2xl bg-gradient-to-br ${getGradient()} p-6 text-white shadow-lg transition-all hover:shadow-xl`}
      >
        {/* Chip simulado */}
        <div className={`mb-8 h-10 w-12 rounded ${getChipColor()} opacity-70`} />

        {/* Nombre de la tarjeta */}
        <div className="mb-4">
          <p className="text-xs opacity-75">Tarjeta de Crédito</p>
          <p className="text-lg font-bold tracking-wider">{tarjeta.nombre}</p>
        </div>

        {/* Información de límite */}
        <div className="mb-4 flex justify-between text-xs opacity-90">
          <div>
            <p className="opacity-75">Límite Total</p>
            <p className="font-bold">
              ${Number(tarjeta.limite_total).toLocaleString('es-AR')}
            </p>
          </div>
        </div>

        {/* Información de fechas (pie de tarjeta) */}
        <div className="flex justify-between gap-4 border-t border-white/20 pt-3 text-xs">
          <div>
            <p className="opacity-75">Cierre</p>
            <p className="font-bold">{String(tarjeta.dia_cierre).padStart(2, '0')}</p>
          </div>
          <div>
            <p className="opacity-75">Vencimiento</p>
            <p className="font-bold">{String(tarjeta.dia_vencimiento).padStart(2, '0')}</p>
          </div>
        </div>
      </div>

      {/* Acciones flotantes (visible al hover) */}
      <div className="absolute right-2 top-2 hidden gap-1 rounded-lg bg-white/95 p-1.5 shadow-md group-hover:flex">
        <button
          onClick={() => onEdit(tarjeta)}
          disabled={isLoading}
          title="Editar tarjeta"
          className="rounded p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
        >
          <Edit2 className="h-4 w-4" />
          <span className="sr-only">Editar</span>
        </button>
        <button
          onClick={() => {
            if (confirm(`¿Eliminar la tarjeta ${tarjeta.nombre}?`)) {
              onDelete(tarjeta.id)
            }
          }}
          disabled={isLoading}
          title="Eliminar tarjeta"
          className="rounded p-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Eliminar</span>
        </button>
      </div>
    </div>
  )
}
