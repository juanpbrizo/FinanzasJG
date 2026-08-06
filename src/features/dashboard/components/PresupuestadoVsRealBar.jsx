import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

/**
 * Gráfico de barras: Presupuestado vs Real por fondo (Tarea 4.3).
 */
export default function PresupuestadoVsRealBar({ fondos, isLoading }) {
  const data = useMemo(() => {
    if (!fondos || fondos.length === 0) return []

    return fondos.map((fondo) => {
      const gastado = fondo.categorias_mensuales?.reduce((sum, cat) => {
        return sum + (cat.movimientos?.reduce((s, mov) => s + (mov.monto || 0), 0) || 0)
      }, 0) || 0

      return {
        nombre: fondo.nombre,
        presupuestado: fondo.monto_presupuestado || 0,
        gastado: gastado,
      }
    })
  }, [fondos])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <p className="text-gray-500">Cargando...</p>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <p className="text-gray-400 text-sm">Sin datos disponibles</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Presupuestado vs Real</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="nombre" angle={-45} textAnchor="end" height={100} />
          <YAxis />
          <Tooltip
            formatter={(value) =>
              `$${value.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`
            }
          />
          <Legend />
          <Bar dataKey="presupuestado" fill="#3b82f6" name="Presupuestado" />
          <Bar dataKey="gastado" fill="#ef4444" name="Gastado" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
