import { createContext } from 'react'

/**
 * @typedef {object} AuthState
 * @property {import('@supabase/supabase-js').Session | null} session
 * @property {import('@supabase/supabase-js').User | null} user
 * @property {boolean} loading  true mientras se resuelve la sesion inicial
 * @property {(email: string, password: string) => Promise<void>} signInWithPassword
 * @property {() => Promise<void>} signOut
 */

/** @type {import('react').Context<AuthState | null>} */
export const AuthContext = createContext(null)
