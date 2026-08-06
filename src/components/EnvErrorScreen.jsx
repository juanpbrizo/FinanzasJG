import { missingEnvVars } from '../lib/supabase'

/**
 * Fallback Error UI (tarea 0.5 del blueprint).
 * Se renderiza en lugar de la app cuando faltan variables de entorno,
 * para que un error de configuracion sea evidente y no silencioso.
 */
export default function EnvErrorScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-lg rounded-lg border border-red-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-red-700">Configuracion incompleta</h1>
        <p className="mt-2 text-sm text-slate-600">
          La aplicacion no puede conectarse a Supabase porque faltan variables de entorno
          obligatorias:
        </p>
        <ul className="mt-3 list-inside list-disc rounded-md bg-slate-50 p-3 font-mono text-sm text-slate-800">
          {missingEnvVars.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-slate-600">
          Crea un archivo <code className="font-mono">.env.local</code> en la raiz del proyecto con
          esas claves (usa la <strong>anon key</strong>, nunca la <code>service_role</code>) y
          reinicia el servidor de desarrollo.
        </p>
      </div>
    </div>
  )
}
