import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-bold text-slate-900">404</h1>
      <p className="text-sm text-slate-600">La pagina que buscas no existe.</p>
      <Link to="/" className="inline-block text-sm font-medium underline">
        Volver al resumen
      </Link>
    </section>
  )
}
