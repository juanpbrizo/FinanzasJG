import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Spinner from '../../components/ui/Spinner'
import { useAuth } from './useAuth'

export default function LoginPage() {
  const { session, loading, signInWithMagicLink } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [estado, setEstado] = useState('idle') // idle | enviando | enviado
  const [error, setError] = useState(null)

  if (loading) return <Spinner />

  if (session) {
    const destino = location.state?.from?.pathname ?? '/'
    return <Navigate to={destino} replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setEstado('enviando')
    try {
      await signInWithMagicLink(email.trim())
      setEstado('enviado')
    } catch (err) {
      setError(err.message ?? 'No se pudo enviar el enlace de acceso.')
      setEstado('idle')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-xl font-semibold text-slate-900">app-finanzas</h1>
        <p className="mt-1 text-sm text-slate-600">
          Ingresa tu email y te enviaremos un enlace de acceso.
        </p>

        {estado === 'enviado' ? (
          <p className="mt-6 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
            Enlace enviado a <strong>{email}</strong>. Revisa tu bandeja de entrada.
          </p>
        ) : (
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
              disabled={estado === 'enviando'}
            />

            {error ? (
              <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            <Button type="submit" className="w-full" disabled={estado === 'enviando'}>
              {estado === 'enviando' ? 'Enviando...' : 'Enviar enlace de acceso'}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
