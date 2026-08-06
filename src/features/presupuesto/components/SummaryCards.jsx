import { formatCurrency } from '../../../lib/formatters'

function SummaryCard({ label, value, variant = 'default' }) {
  const variantClass = {
    default: 'bg-white text-slate-900',
    highlight: 'bg-emerald-50 text-emerald-900',
    warning: 'bg-amber-50 text-amber-900',
    danger: 'bg-red-50 text-red-900',
  }[variant]

  return (
    <div className={`rounded-lg ${variantClass} p-4 shadow-sm ring-1 ring-slate-200`}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-600">{label}</p>
      <p className="mt-1 text-2xl font-bold">{formatCurrency(value)}</p>
    </div>
  )
}

export default function SummaryCards({ resumen }) {
  if (!resumen) return null

  const dineroSinAsignar = resumen.dinero_sin_asignar ?? 0
  const variantActual = dineroSinAsignar === 0 ? 'highlight' : dineroSinAsignar > 0 ? 'warning' : 'danger'

  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
      <SummaryCard label="Total Ingresos" value={resumen.total_ingresos} />
      <SummaryCard label="Presupuestado" value={resumen.total_presupuestado} />
      <SummaryCard label="Gastado" value={resumen.total_gastado} />
      <SummaryCard label="Sin Asignar" value={dineroSinAsignar} variant={variantActual} />
    </div>
  )
}
