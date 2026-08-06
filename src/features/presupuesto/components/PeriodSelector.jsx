import { Link } from 'react-router-dom'
import { desplazarPeriodo, formatMonthLabel } from '../../../lib/formatters'

export default function PeriodSelector({ periodo }) {
  const anterior = desplazarPeriodo(periodo, -1)
  const siguiente = desplazarPeriodo(periodo, 1)

  return (
    <div className="flex items-center justify-between rounded-lg bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
      <Link
        to={`/mes/${anterior}`}
        className="rounded px-2 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100"
      >
        ◀
      </Link>
      <h2 className="text-lg font-semibold capitalize text-slate-900">
        {formatMonthLabel(periodo)}
      </h2>
      <Link
        to={`/mes/${siguiente}`}
        className="rounded px-2 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100"
      >
        ▶
      </Link>
    </div>
  )
}
