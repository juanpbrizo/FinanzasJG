import { Navigate, Outlet, useLocation } from 'react-router-dom'
import Spinner from '../../components/ui/Spinner'
import { useAuth } from './useAuth'

/**
 * Guarda de rutas. Sin sesion redirige a /login recordando el destino original.
 * No sustituye a RLS: la autorizacion real vive en la base de datos.
 */
export default function ProtectedRoute() {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) return <Spinner />

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
