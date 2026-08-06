export default function Spinner({ label = 'Cargando...' }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-live="polite">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
      <span className="sr-only">{label}</span>
    </div>
  )
}
