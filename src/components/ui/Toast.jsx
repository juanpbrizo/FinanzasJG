import { useEffect } from 'react'
import { CheckCircle2, X, XCircle } from 'lucide-react'

const STYLES = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  error: 'border-red-200 bg-red-50 text-red-900',
}

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
}

/**
 * Notificacion breve auto-descartable.
 * Se controla desde el padre: si `message` es falsy no renderiza nada.
 */
export default function Toast({ message, variant = 'success', duration = 4000, onDismiss }) {
  useEffect(() => {
    if (!message || !duration) return undefined
    const timer = setTimeout(() => onDismiss?.(), duration)
    return () => clearTimeout(timer)
  }, [message, duration, onDismiss])

  if (!message) return null

  const Icon = ICONS[variant] ?? ICONS.success

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg ${STYLES[variant] ?? STYLES.success}`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{message}</span>
      <button
        type="button"
        onClick={() => onDismiss?.()}
        aria-label="Cerrar notificación"
        className="rounded p-0.5 opacity-60 hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
