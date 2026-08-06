import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { formatMonthLabel, periodoActual } from '../../lib/formatters'

export default function DashboardPage() {
  const { user } = useAuth()
  const periodo = periodoActual()

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Hola, {user?.email}</h1>
      <p className="text-sm text-slate-600">
        Cimientos listos (Fase 0). El presupuesto de {formatMonthLabel(periodo)} se construye en la
        Fase 1.
      </p>
      <Link to={`/mes/${periodo}`} className="inline-block text-sm font-medium underline">
        Ir al mes actual
      </Link>
    </section>
  )
}
