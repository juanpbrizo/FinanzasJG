import { Navigate, useParams } from 'react-router-dom'
import { esPeriodoValido, periodoActual } from '../../lib/formatters'
import Spinner from '../../components/ui/Spinner'
import PeriodSelector from '../presupuesto/components/PeriodSelector'
import GastoPorFondoDonut from './components/GastoPorFondoDonut'
import PresupuestadoVsRealBar from './components/PresupuestadoVsRealBar'
import EvolucionFinancieraLine from './components/EvolucionFinancieraLine'
import BotonExportarCSV from './components/BotonExportarCSV'
import {
  usePeriodo,
  useFondosMensuales,
  useMovimientosDelPeriodo,
  useAnalyticsAnual,
} from '../presupuesto/hooks'

export default function DashboardAnalyticsPage() {
  const { periodo } = useParams()

  // Datos del período actual (para exportación).
  const { data: periodoData, isLoading: periodoLoading } = usePeriodo(periodo)
  const { data: fondos, isLoading: fondosLoading } = useFondosMensuales(periodoData?.id)
  const { data: movimientos, isLoading: movimientosLoading } = useMovimientosDelPeriodo(
    periodoData?.id
  )

  // Datos anuales (para gráficos de evolución).
  const { data: analyticsAnual, isLoading: analyticsLoading } = useAnalyticsAnual()

  if (!esPeriodoValido(periodo)) {
    return <Navigate to={`/analytics/${periodoActual()}`} replace />
  }

  if (periodoLoading || fondosLoading || analyticsLoading) return <Spinner />

  return (
    <div className="space-y-6">
      {/* Encabezado con selector de período */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Análisis Financiero</h1>
          <p className="text-sm text-gray-600 mt-1">Dashboard de gastos, tendencias y proyecciones</p>
        </div>
        <div className="flex items-center gap-4">
          <PeriodSelector periodo={periodo} />
          <BotonExportarCSV
            movimientos={movimientos}
            periodoLabel={periodo}
            isLoading={movimientosLoading}
          />
        </div>
      </div>

      {/* Grilla de gráficos (responsivo) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut: Distribución de gastos */}
        <GastoPorFondoDonut fondos={fondos} isLoading={fondosLoading} />

        {/* Barras: Presupuestado vs Real */}
        <PresupuestadoVsRealBar fondos={fondos} isLoading={fondosLoading} />
      </div>

      {/* Línea: Evolución anual */}
      <EvolucionFinancieraLine analyticsAnual={analyticsAnual} isLoading={analyticsLoading} />

      {/* Tabla de resumen de movimientos (opcional) */}
      {movimientos && movimientos.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Movimientos del Período ({movimientos.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200">
                <tr className="text-gray-700 font-semibold">
                  <th className="text-left py-3 px-4">Fecha</th>
                  <th className="text-left py-3 px-4">Descripción</th>
                  <th className="text-left py-3 px-4">Fondo</th>
                  <th className="text-left py-3 px-4">Categoría</th>
                  <th className="text-right py-3 px-4">Monto</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.slice(0, 20).map((mov) => (
                  <tr key={mov.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-900">
                      {new Date(mov.fecha_transaccion).toLocaleDateString('es-AR')}
                    </td>
                    <td className="py-3 px-4 text-gray-900">{mov.descripcion}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {mov.categorias_mensuales?.fondos_mensuales?.nombre || '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{mov.categorias_mensuales?.nombre}</td>
                    <td className="py-3 px-4 text-right text-gray-900 font-medium">
                      ${mov.monto.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {movimientos.length > 20 && (
              <p className="text-xs text-gray-500 mt-4 text-center">
                Mostrando 20 de {movimientos.length} movimientos. Descarga CSV para ver todos.
              </p>
            )}
          </div>
        </div>
      )}

      {!movimientos || movimientos.length === 0 && (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-600">Sin movimientos registrados para este período</p>
        </div>
      )}
    </div>
  )
}
