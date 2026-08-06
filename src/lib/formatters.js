const LOCALE = 'es-AR'
const CURRENCY = 'ARS'

const currencyFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: CURRENCY,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const monthFormatter = new Intl.DateTimeFormat(LOCALE, {
  month: 'long',
  year: 'numeric',
})

const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const PERIODO_REGEX = /^\d{4}-\d{2}-01$/
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

/**
 * Convierte una fecha ISO (`YYYY-MM-DD`) en un Date local.
 * `new Date('2026-08-01')` se interpreta como UTC y desplaza el dia en
 * zonas con offset negativo; esta funcion evita ese bug.
 */
export function parseLocalDate(fecha) {
  if (fecha instanceof Date) return fecha
  if (typeof fecha === 'string' && ISO_DATE_REGEX.test(fecha)) {
    const [yy, mm, dd] = fecha.split('-').map(Number)
    return new Date(yy, mm - 1, dd)
  }
  return new Date(fecha)
}

/** 1234.5 -> "$ 1.234,50" */
export function formatCurrency(monto) {
  const valor = Number(monto)
  return currencyFormatter.format(Number.isFinite(valor) ? valor : 0)
}

/** "2026-08-01" -> "agosto de 2026" */
export function formatMonthLabel(periodo) {
  return monthFormatter.format(parseLocalDate(periodo))
}

/** "2026-08-14" -> "14/08/2026" */
export function formatDate(fecha) {
  return dateFormatter.format(parseLocalDate(fecha))
}

/** Normaliza cualquier fecha al primer dia de su mes: "2026-08-01". */
export function toPeriodo(fecha = new Date()) {
  const d = parseLocalDate(fecha)
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  return `${d.getFullYear()}-${mes}-01`
}

/** Periodo del mes en curso. */
export function periodoActual() {
  return toPeriodo(new Date())
}

/** Desplaza un periodo N meses (acepta negativos). */
export function desplazarPeriodo(periodo, meses) {
  const d = parseLocalDate(periodo)
  return toPeriodo(new Date(d.getFullYear(), d.getMonth() + meses, 1))
}

/** Valida el formato de periodo usado en las rutas `/mes/:periodo`. */
export function esPeriodoValido(periodo) {
  return typeof periodo === 'string' && PERIODO_REGEX.test(periodo)
}
