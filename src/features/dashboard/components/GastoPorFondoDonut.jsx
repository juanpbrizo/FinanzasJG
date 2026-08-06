import { useMemo } from 'react'
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts'

const COLORS = [
  '#1e40af',
  '#dc2626',
  '#059669',
  '#f59e0b',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
  '#14b8a6',
]

/**
 * Gráfico Donut: Distribución de gastos por fondo (Tarea 4.2).
 */
export default function GastoPorFondoDonut({ fondos, isLoading }) {
  const data = useMemo(() => {
    if (!fondos || fondos.length === 0) return []

    return fondos.map((fondo) => {
      const gastado = fondo.categorias_mensuales?.reduce((sum, cat) => {
        return sum + (cat.movimientos?.reduce((s, mov) => s + (mov.monto || 0), 0) || 0)
      }, 0) || 0

      return {
        name: fondo.nombre,
        value: gastado,
        tipo: fondo.tipo,
      }
    }).filter((f) => f.value > 0)
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
        <p className="text-gray-400 text-sm">Sin movimientos registrados</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución de Gastos</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) =>
              `$${value.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`
            }
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
