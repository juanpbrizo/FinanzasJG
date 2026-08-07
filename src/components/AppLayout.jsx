import { NavLink, Outlet } from 'react-router-dom'
import Button from './ui/Button'
import { useAuth } from '../features/auth/useAuth'
import { periodoActual } from '../lib/formatters'

const LINKS = [
  { to: `/analytics/${periodoActual()}`, label: 'Analítica' },
  { to: `/mes/${periodoActual()}`, label: 'Mes' },
  { to: '/tarjetas', label: 'Tarjetas' },
  { to: '/suscripciones', label: 'Suscripciones' },
  { to: '/configuracion', label: 'Configuracion' },
]

function linkClass({ isActive }) {
  return `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-200'
  }`
}

function linkClassMobile({ isActive }) {
  return `flex flex-col items-center gap-1 rounded-md px-2 py-2 text-xs font-medium transition-colors ${
    isActive ? 'text-slate-900' : 'text-slate-500'
  }`
}

export default function AppLayout() {
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-slate-100 pb-20 sm:pb-0">
      {/* Header Desktop */}
      <header className="hidden sm:block border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-4 sm:px-6 py-3">
          <span className="font-semibold text-slate-900">app-finanzas</span>
          <nav className="flex flex-1 flex-wrap gap-1">
            {LINKS.map(({ to, label }) => (
              <NavLink key={to} to={to} className={linkClass}>
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

      {/* Header Mobile */}
      <header className="sm:hidden border-b border-slate-200 bg-white sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="font-semibold text-slate-900">app-finanzas</span>
          <Button variant="secondary" size="sm" onClick={() => signOut()}>
            Salir
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-4 sm:px-6 sm:py-8">
        <Outlet />
      </main>

      {/* Bottom Navigation Mobile */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white">
        <div className="grid grid-cols-5 gap-1 px-2 py-2">
          {LINKS.map(({ to, label }) => (
            <NavLink key={to} to={to} className={linkClassMobile}>
              <span className="truncate text-center w-full">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
