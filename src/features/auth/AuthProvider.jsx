import { useCallback, useEffect, useMemo, useState } from 'react'
import { getSupabase } from '../../lib/supabase'
import { queryClient } from '../../lib/queryClient'
import { AuthContext } from './AuthContext'

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

  const signInWithMagicLink = useCallback(async (email) => {
    const supabase = getSupabase()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/` },
    })
    if (error) throw error
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
      signInWithMagicLink,
      signOut,
    }),
    [session, loading, signInWithMagicLink, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
