import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Lista de variables ausentes o vacias. Si tiene elementos, la app NO arranca:
 * `main.jsx` renderiza <EnvErrorScreen /> en lugar del arbol normal.
 *
 * Regla de seguridad (Fase 0.5): aqui solo se usa la ANON KEY.
 * La `service_role` jamas debe llegar al bundle del navegador.
 */
export const missingEnvVars = [
  ['VITE_SUPABASE_URL', supabaseUrl],
  ['VITE_SUPABASE_ANON_KEY', supabaseAnonKey],
]
  .filter(([, value]) => !value)
  .map(([name]) => name)

export const isSupabaseConfigured = missingEnvVars.length === 0

if (!isSupabaseConfigured) {
  console.error(
    `[app-finanzas] Faltan variables de entorno obligatorias: ${missingEnvVars.join(', ')}.\n` +
      'Crea un archivo .env.local en la raiz del proyecto con esas claves y reinicia el servidor de Vite.',
  )
}

/**
 * Cliente unico de Supabase. Es `null` cuando la configuracion es invalida,
 * de modo que un error de configuracion falle de forma ruidosa y temprana
 * en vez de simularse con datos vacios.
 * @type {import('@supabase/supabase-js').SupabaseClient | null}
 */
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

/** Acceso seguro al cliente para capas de datos que no toleran `null`. */
export function getSupabase() {
  if (!supabase) {
    throw new Error(
      `Supabase no esta configurado. Variables faltantes: ${missingEnvVars.join(', ')}`,
    )
  }
  return supabase
}
