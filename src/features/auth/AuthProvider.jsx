import { useCallback, useEffect, useMemo, useState } from 'react'
import { getSupabase } from '../../lib/supabase'
import { queryClient } from '../../lib/queryClient'
import { AuthContext } from './AuthContext'

const CREDENCIALES_INVALIDAS = 'Credenciales incorrectas o usuario no autorizado.'

/**
 * Traduce los errores de Supabase a mensajes accionables.
 * Un email inexistente y una contrasena incorrecta devuelven el mismo
 * mensaje a proposito: no se filtra que cuentas existen.
 */
function mensajeDeErrorAuth(error) {
  const codigo = error?.code ?? ''
  const detalle = error?.message ?? ''
  if (
    codigo === 'invalid_credentials' ||
    codigo === 'user_not_found' ||
    error?.status === 400 ||
    /invalid login credentials|user not found/i.test(detalle)
  ) {
    return CREDENCIALES_INVALIDAS
  }
  return detalle || 'No se pudo iniciar sesion.'
}

/**
 * Unica fuente de verdad de la sesion.
 * Ningun otro modulo debe llamar a `supabase.auth` para leer el usuario.
 */
export default function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = getSupabase()
    let activo = true

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!activo) return
        if (error) console.error('[auth] No se pudo recuperar la sesion:', error.message)
        setSession(data?.session ?? null)
      })
      .finally(() => {
        if (activo) setLoading(false)
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nuevaSesion) => {
      setSession(nuevaSesion)
      setLoading(false)
    })

    return () => {
      activo = false
      subscription.unsubscribe()
    }
  }, [])

  const signInWithPassword = useCallback(async (email, password) => {
    const supabase = getSupabase()
    // Aplicacion privada: las cuentas se crean desde el panel de Supabase.
    // No hay registro publico ni envio de correos.
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(mensajeDeErrorAuth(error))
  }, [])

  const signOut = useCallback(async () => {
    const supabase = getSupabase()
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    // Los datos cacheados pertenecen al usuario saliente: se descartan.
    queryClient.clear()
  }, [])

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      signInWithPassword,
      signOut,
    }),
    [session, loading, signInWithPassword, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
