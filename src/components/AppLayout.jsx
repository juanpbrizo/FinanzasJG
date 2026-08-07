import { NavLink, Outlet } from 'react-router-dom'
import Button from './ui/Button'
import { useAuth } from '../features/auth/useAuth'
import { periodoActual } from '../lib/formatters'

const LINKS = [
  { to: '/', label: 'Resumen', end: true },
  { to: `/mes/${periodoActual()}`, label: 'Mes' },
  { to: `/analytics/${periodoActual()}`, label: 'Analytics' },
  { to: '/tarjetas', label: 'Tarjetas' },
  { to: '/suscripciones', label: 'Suscripciones' },
  { to: '/configuracion', label: 'Configuracion' },
]

function linkClass({ isActive }) {
  return `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
    isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-200'
  }`
}

export default function AppLayout() {
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-6 py-3">
          <span className="font-semibold text-slate-900">app-finanzas</span>
          <nav className="flex flex-1 flex-wrap gap-1">
            {LINKS.map(({ to, label, end }) => (
              <NavLink key={to} to={to} end={end} className={linkClass}>
                {label}
              </NavLink>
            ))}
          </nav>
          <span className="text-sm text-slate-500">{user?.email}</span>
          <Button variant="secondary" onClick={() => signOut()}>
            Salir
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
