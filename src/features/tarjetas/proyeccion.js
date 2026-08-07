function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function toMonthKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

function parseMonthDate(value) {
  const parsed = new Date(`${value}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return null
  return startOfMonth(parsed)
}

/**
 * Construye una proyeccion de 12 meses combinando compras programadas y
 * movimientos ya liquidados.
 * @param {Array} compras
 * @param {Array} movimientos
 * @returns {Array}
 */
export function construirProyeccionCuotas(compras = [], movimientos = []) {
  const hoy = startOfMonth(new Date())
  const fin = new Date(hoy.getFullYear(), hoy.getMonth() + 12, 1)
  const movimientosPorClave = new Map(
    movimientos.map((movimiento) => [
      `${movimiento.compra_cuota_id}:${movimiento.numero_cuota}`,
      movimiento,
    ]),
  )

  const filas = []

  for (const compra of compras) {
    const primerPeriodo = parseMonthDate(compra.primer_periodo_impacto)
    const cuotasTotales = Number(compra.cantidad_cuotas || 0)
    const montoTotal = Number(compra.monto_total || 0)

    if (!primerPeriodo || cuotasTotales < 1 || montoTotal <= 0) continue

    for (let numeroCuota = 1; numeroCuota <= cuotasTotales; numeroCuota += 1) {
      const periodoCuota = new Date(
        primerPeriodo.getFullYear(),
        primerPeriodo.getMonth() + (numeroCuota - 1),
        1,
      )

      if (periodoCuota < hoy || periodoCuota >= fin) continue

      const clave = `${compra.id}:${numeroCuota}`
      const movimientoReal = movimientosPorClave.get(clave)
      const montoTeorico = Number((montoTotal / cuotasTotales).toFixed(2))

      if (movimientoReal) {
        filas.push(movimientoReal)
        continue
      }

      filas.push({
        id: `proyeccion-${clave}`,
        compra_cuota_id: compra.id,
        fecha_transaccion: toMonthKey(periodoCuota) + '-01',
        descripcion: compra.descripcion,
        monto: montoTeorico,
        monto_teorico: montoTeorico,
        numero_cuota: numeroCuota,
        total_cuotas: cuotasTotales,
        ajustado_manualmente: false,
        es_sintetica: true,
      })
    }
  }

  return filas.sort((a, b) => {
    const fechaA = a.fecha_transaccion || ''
    const fechaB = b.fecha_transaccion || ''
    if (fechaA !== fechaB) return fechaA.localeCompare(fechaB)
    const cuotaA = Number(a.numero_cuota || 0)
    const cuotaB = Number(b.numero_cuota || 0)
    return cuotaA - cuotaB
  })
}
