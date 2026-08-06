/**
 * Exporta movimientos a CSV con codificación UTF-8 BOM (compatible Excel).
 * @param {array} movimientos - Array de movimientos
 * @param {string} periodoLabel - Label del período (ej. "Agosto 2026")
 */
export function exportarMovimientosCSV(movimientos, periodoLabel = 'Movimientos') {
  if (!movimientos || movimientos.length === 0) {
    alert('Sin movimientos para exportar')
    return
  }

  // Transforma datos al formato CSV.
  const csvData = movimientos.map((mov) => ({
    'Fecha': mov.fecha_transaccion || '',
    'Descripción': mov.descripcion || '',
    'Fondo': mov.categorias_mensuales?.fondos_mensuales?.nombre || '',
    'Categoría': mov.categorias_mensuales?.nombre || '',
    'Medio de Pago': mov.medio_pago || '',
    'Monto': mov.monto?.toString().replace('.', ',') || '0',
    'Nro Cuota': mov.numero_cuota ? `${mov.numero_cuota}/${mov.total_cuotas}` : '',
  }))

  // Headers CSV.
  const headers = Object.keys(csvData[0])
  const csvContent = [
    headers.join(','),
    ...csvData.map((row) =>
      headers
        .map((header) => {
          let value = row[header]
          // Escapa comillas y envoltura en comillas.
          if (value && typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            value = `"${value.replace(/"/g, '""')}"`
          }
          return value
        })
        .join(',')
    ),
  ].join('\n')

  // Agregar BOM para UTF-8 en Excel.
  const bom = '\uFEFF'
  const csvConBOM = bom + csvContent

  // Crear blob y descargar.
  const blob = new Blob([csvConBOM], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', `movimientos-${periodoLabel}.csv`)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
