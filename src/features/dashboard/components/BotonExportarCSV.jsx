import { Download } from 'lucide-react'
import Button from '../../../components/ui/Button'
import { exportarMovimientosCSV } from '../exportarCSV'

/**
 * Botón para exportar movimientos a CSV.
 */
export default function BotonExportarCSV({ movimientos, periodoLabel, isLoading }) {
  const handleExportar = () => {
    exportarMovimientosCSV(movimientos, periodoLabel)
  }

  return (
    <Button
      onClick={handleExportar}
      variant="outline"
      size="sm"
      disabled={!movimientos || movimientos.length === 0 || isLoading}
      className="gap-2"
    >
      <Download className="w-4 h-4" />
      Exportar CSV
    </Button>
  )
}
