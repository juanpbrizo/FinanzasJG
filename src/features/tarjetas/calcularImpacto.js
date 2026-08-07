/**
 * calcularImpacto.js
 * Implementa la Regla R2 para calcular el primer período de impacto de una compra.
 *
 * REGLA R2:
 * - Si día(fecha_compra) <= día_cierre → primer_periodo_impacto = mes de la compra (día 1)
 * - Si día(fecha_compra) > día_cierre → primer_periodo_impacto = mes siguiente (día 1)
 *
 * Entrada: fecha_compra (Date o string ISO), dia_cierre (integer 1-31)
 * Salida: primer_periodo_impacto (Date con día = 1)
 */

/**
 * Calcula el primer período de impacto de una compra según el día de cierre de la tarjeta.
 * @param {Date|string} fechaCompra - Fecha de la compra (Date o ISO string)
 * @param {number} diaCierre - Día del cierre (1-31)
 * @returns {Date} Fecha del primer período de impacto (siempre con día = 1)
 */
export function calcularImpacto(fechaCompra, diaCierre) {
  // Normaliza entrada a Date si es string ISO
  let fecha
  if (typeof fechaCompra === 'string') {
    fecha = new Date(fechaCompra)
  } else if (fechaCompra instanceof Date) {
    fecha = fechaCompra
  } else {
    throw new TypeError('fechaCompra debe ser Date o string ISO')
  }

  if (typeof diaCierre !== 'number' || diaCierre < 1 || diaCierre > 31) {
    throw new RangeError('diaCierre debe ser un número entre 1 y 31')
  }

  // Extrae el día de la fecha de compra
  const diaCompra = fecha.getDate()

  let primerPeriodo
  if (diaCompra <= diaCierre) {
    // Impacta en el mes de la compra (día 1)
    primerPeriodo = new Date(fecha.getFullYear(), fecha.getMonth(), 1)
  } else {
    // Impacta en el mes siguiente (día 1)
    primerPeriodo = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 1)
  }

  return primerPeriodo
}

/**
 * Versión con validaciones adicionales (para uso en tests)
 * @param {Date|string} fechaCompra
 * @param {number} diaCierre
 * @returns {Date}
 */
export function calcularImpactoConValidacion(fechaCompra, diaCierre) {
  const resultado = calcularImpacto(fechaCompra, diaCierre)

  // Valida que el resultado sea siempre día 1
  if (resultado.getDate() !== 1) {
    throw new Error('Bug interno: resultado no es día 1')
  }

  return resultado
}

/**
 * Calcula el primer período de VENCIMIENTO de una compra.
 * Es el mes de cierre (Regla R2) desplazado por `mesImpactoOffset`:
 * con offset 1 (default de la tarjeta) el resumen que cierra este mes se paga
 * el mes siguiente, por lo que la compra nunca impacta el presupuesto actual.
 * @param {Date|string} fechaCompra
 * @param {number} diaCierre
 * @param {number} [mesImpactoOffset=1]
 * @returns {Date} Fecha del primer período de vencimiento (día = 1)
 */
export function calcularPrimerPeriodoImpacto(fechaCompra, diaCierre, mesImpactoOffset = 1) {
  const offset = Number.isInteger(mesImpactoOffset) ? mesImpactoOffset : 1
  const cierre = calcularImpacto(parsearFechaLocal(fechaCompra), diaCierre)

  return new Date(cierre.getFullYear(), cierre.getMonth() + offset, 1)
}

/**
 * Parsea 'YYYY-MM-DD' como fecha local. `new Date(iso)` la interpreta como UTC
 * y en husos negativos devuelve el día anterior, corriendo el cálculo de cierre.
 * @param {Date|string} valor
 * @returns {Date}
 */
export function parsearFechaLocal(valor) {
  if (typeof valor === 'string') {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor)
    if (match) {
      return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    }
  }

  return valor
}

/**
 * Genera un array de fechas de período para N cuotas a partir del primer período.
 * Útil para preview de proyección.
 * @param {Date} primerPeriodo - Primer período de impacto
 * @param {number} cantidadCuotas - Cantidad de cuotas
 * @returns {Date[]} Array de N fechas (mes1, mes2, ..., mesN)
 */
export function generarPeriodosCuotas(primerPeriodo, cantidadCuotas) {
  if (!(primerPeriodo instanceof Date) || primerPeriodo.getDate() !== 1) {
    throw new Error('primerPeriodo debe ser Date con día = 1')
  }

  if (typeof cantidadCuotas !== 'number' || cantidadCuotas < 1) {
    throw new RangeError('cantidadCuotas debe ser >= 1')
  }

  const periodos = []
  for (let i = 0; i < cantidadCuotas; i++) {
    const fecha = new Date(primerPeriodo)
    fecha.setMonth(fecha.getMonth() + i)
    periodos.push(fecha)
  }

  return periodos
}
