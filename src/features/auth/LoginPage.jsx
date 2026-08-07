import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Spinner from '../../components/ui/Spinner'
import { useAuth } from './useAuth'

export default function LoginPage() {
  const { session, loading, signInWithPassword } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)

  if (loading) return <Spinner />

  if (session) {
    const destino = location.state?.from?.pathname ?? '/'
    return <Navigate to={destino} replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setEnviando(true)
    try {
      await signInWithPassword(email.trim(), password)
      // El redirect lo resuelve el <Navigate> de arriba al actualizarse la sesion.
    } catch (err) {
      setError(err.message ?? 'Credenciales incorrectas o usuario no autorizado.')
      setEnviando(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-xl font-semibold text-slate-900">app-finanzas</h1>
        <p className="mt-1 text-sm text-slate-600">Aplicación privada de acceso restringido.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input
            id="email"
            name="email"
            type="email"
            label="Email"
            autoComplete="email"
            required
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={enviando}
          />

          <Input
            id="password"
            name="password"
            type="password"
            label="Contraseña"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={enviando}
          />

          {error ? (
            <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={enviando}>
            {enviando ? 'Ingresando...' : 'Iniciar Sesión'}
          </Button>
        </form>
      </div>
    </div>
  )
}
