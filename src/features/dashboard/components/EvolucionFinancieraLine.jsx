import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatMonthLabel } from '../../../lib/formatters'

/**
 * Gráfico de línea: Evolución de Ahorro acumulado y Deuda TC (Tareas 4.4-4.5).
 */
export default function EvolucionFinancieraLine({ analyticsAnual, isLoading }) {
  const data = useMemo(() => {
    if (!analyticsAnual || analyticsAnual.length === 0) return []

    // Revierte para mostrar cronológicamente (más antiguos primero).
    return [...analyticsAnual]
      .reverse()
      .map((m) => ({
        periodo: formatMonthLabel(m.periodo),
        ahorro_inversion: m.monto_ahorro_inversion || 0,
        deuda_tc: m.deuda_tc_comprometida || 0,
      }))
  }, [analyticsAnual])

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
        <p className="text-gray-400 text-sm">Sin histórico de períodos</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Evolución Financiera (12 meses)</h3>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="periodo" angle={-45} textAnchor="end" height={80} />
          <YAxis />
          <Tooltip
            formatter={(value) =>
              `$${value.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`
            }
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="ahorro_inversion"
            stroke="#10b981"
            name="Ahorro/Inversión"
            strokeWidth={2}
            dot={{ fill: '#10b981', r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="deuda_tc"
            stroke="#ef4444"
            name="Deuda TC Comprometida"
            strokeWidth={2}
            dot={{ fill: '#ef4444', r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
