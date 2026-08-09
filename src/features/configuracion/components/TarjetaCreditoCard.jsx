import { Edit2, Trash2 } from 'lucide-react'
import { getCardStyle } from './cardStylesConfig'
import { BrandLogo } from './CardBrands'
import { BankLogo } from './BankLogos'

/**
 * TarjetaCreditoCard: Simula el aspecto de una tarjeta de crédito real.
 * Diseño: gradiente según banco/entidad, chip, nombre, límite, fechas de cierre y vencimiento.
 * Layout: Logo banco (sup-izq), Chip (sup-der), Logo marca (inf-der), datos al centro.
 * Muestra: Límite total, monto consumido en cuotas, límite disponible, barra de progreso.
 */
export default function TarjetaCreditoCard({ tarjeta, resumen, onEdit, onDelete, isLoading }) {
  const limite_total = resumen?.limite_total || tarjeta.limite_total || 0
  const comprometido = resumen?.comprometido || 0
  const disponible = resumen?.disponible || (limite_total - comprometido)

  const porcentajeUsado = limite_total > 0 ? (comprometido / limite_total) * 100 : 0
  const esAlerta = porcentajeUsado > 80

  const entidad = tarjeta.entidad || 'santander'
  const marca = tarjeta.marca || 'visa'
  const { gradient: gradientBase } = getCardStyle(entidad, marca)

  // Gradiente dinámico según marca o alerta
  const getGradient = () => {
    if (esAlerta) return 'from-orange-600 to-orange-800'
    return gradientBase
  }

  const getChipColor = () => 'bg-amber-300'

  const formatCurrency = (value) => {
    return `$${Number(value).toLocaleString('es-AR', {
      maximumFractionDigits: 0,
    })}`
  }

  return (
    <div className="group relative h-full">
      {/* Tarjeta principal con aspect ratio fijo 1.586:1 */}
      <div
        className={`relative flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br ${getGradient()} p-5 text-white shadow-lg transition-all hover:shadow-xl aspect-[1.586/1] w-full select-none`}
      >
        {/* FILA SUPERIOR: Logo banco (izq), Acciones (centro), Chip (der) */}
        <div className="flex items-start justify-between mb-4">
          {/* Logo del banco/billetera en esquina superior izquierda */}
          <BankLogo entidadId={entidad} className="h-8 w-8" />

          {/* Acciones en el centro (visibles al hover) */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(tarjeta)}
              disabled={isLoading}
              title="Editar tarjeta"
              className="rounded p-1 text-white/80 hover:text-white hover:bg-white/20 disabled:opacity-50 transition-colors"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => {
                if (confirm(`¿Eliminar la tarjeta ${tarjeta.nombre}?`)) {
                  onDelete(tarjeta.id)
                }
              }}
              disabled={isLoading}
              title="Eliminar tarjeta"
              className="rounded p-1 text-white/80 hover:text-white hover:bg-white/20 disabled:opacity-50 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Chip dorado en esquina superior derecha */}
          <div className={`h-7 w-10 rounded-md ${getChipColor()} opacity-80 shadow-md`} />
        </div>

        {/* Nombre de la tarjeta */}
        <div className="mb-2">
          <p className="text-xs opacity-70">Tarjeta de Crédito</p>
          <p className="text-base font-bold tracking-wide truncate">{tarjeta.nombre}</p>
        </div>

        {/* Información de límite, consumo y disponible */}
        <div className="mb-3 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="opacity-70">Límite Total</span>
            <span className="font-semibold">{formatCurrency(limite_total)}</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-70">En Cuotas</span>
            <span className="font-semibold">{formatCurrency(comprometido)}</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-70">Disponible</span>
            <span className="font-semibold">{formatCurrency(disponible)}</span>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="mb-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              esAlerta ? 'bg-red-300' : 'bg-emerald-300'
            }`}
            style={{ width: `${Math.min(porcentajeUsado, 100)}%` }}
          />
        </div>

        {/* FILA INFERIOR: Fechas (izq/centro), Logo marca (der) */}
        <div className="flex justify-between items-end gap-4 border-t border-white/20 pt-2">
          <div className="text-xs flex-1">
            <div>
              <p className="opacity-70">Cierre</p>
              <p className="font-semibold">{String(tarjeta.dia_cierre).padStart(2, '0')}</p>
            </div>
            <div className="mt-2">
              <p className="opacity-70">Vencimiento</p>
              <p className="font-semibold">{String(tarjeta.dia_vencimiento).padStart(2, '0')}</p>
            </div>
          </div>

          {/* Logo de marca de pago en esquina inferior derecha */}
          <div className="flex-shrink-0">
            <BrandLogo marca={marca} className="h-6 w-8" />
          </div>
        </div>
      </div>
    </div>
  )
}
