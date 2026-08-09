/**
 * Temas de tarjetas de crédito: Bancos/Billeteras de Argentina + Marcas de Pago
 * Define colores corporativos, gradientes y metadatos para cada entidad
 */

// ============================================================================
// BANCOS Y BILLETERAS DE ARGENTINA
// ============================================================================

export const ENTIDADES = {
  // BANCOS
  SANTANDER: {
    id: 'santander',
    nombre: 'Santander',
    tipo: 'banco',
    gradient: 'from-red-600 via-red-700 to-red-900',
    textColor: 'text-white',
    accentColor: 'text-red-200',
  },
  BBVA: {
    id: 'bbva',
    nombre: 'BBVA',
    tipo: 'banco',
    gradient: 'from-blue-700 via-blue-800 to-blue-950',
    textColor: 'text-white',
    accentColor: 'text-blue-200',
  },
  GALICIA: {
    id: 'galicia',
    nombre: 'Banco Galicia',
    tipo: 'banco',
    gradient: 'from-orange-500 via-amber-600 to-orange-800',
    textColor: 'text-white',
    accentColor: 'text-orange-100',
  },
  MACRO: {
    id: 'macro',
    nombre: 'Banco Macro',
    tipo: 'banco',
    gradient: 'from-emerald-600 via-teal-700 to-emerald-900',
    textColor: 'text-white',
    accentColor: 'text-emerald-200',
  },
  NACION: {
    id: 'nacion',
    nombre: 'Banco Nación',
    tipo: 'banco',
    gradient: 'from-indigo-600 via-purple-700 to-indigo-900',
    textColor: 'text-white',
    accentColor: 'text-indigo-200',
  },
  PROVINCIA: {
    id: 'provincia',
    nombre: 'Banco Provincia',
    tipo: 'banco',
    gradient: 'from-cyan-600 via-sky-700 to-blue-900',
    textColor: 'text-white',
    accentColor: 'text-cyan-200',
  },
  HSBC: {
    id: 'hsbc',
    nombre: 'HSBC',
    tipo: 'banco',
    gradient: 'from-red-500 via-red-700 to-red-900',
    textColor: 'text-white',
    accentColor: 'text-red-200',
  },
  ICBC: {
    id: 'icbc',
    nombre: 'ICBC',
    tipo: 'banco',
    gradient: 'from-slate-700 via-slate-800 to-slate-950',
    textColor: 'text-white',
    accentColor: 'text-slate-200',
  },
  CIUDAD: {
    id: 'ciudad',
    nombre: 'Banco Ciudad',
    tipo: 'banco',
    gradient: 'from-yellow-600 via-amber-700 to-yellow-900',
    textColor: 'text-slate-900',
    accentColor: 'text-yellow-300',
  },
  ITAU: {
    id: 'itau',
    nombre: 'Itaú',
    tipo: 'banco',
    gradient: 'from-orange-600 via-orange-700 to-orange-900',
    textColor: 'text-white',
    accentColor: 'text-orange-200',
  },
  BRUBANK: {
    id: 'brubank',
    nombre: 'Brubank',
    tipo: 'banco',
    gradient: 'from-purple-600 via-purple-700 to-purple-900',
    textColor: 'text-white',
    accentColor: 'text-purple-200',
  },
  REBA: {
    id: 'reba',
    nombre: 'Reba',
    tipo: 'banco',
    gradient: 'from-amber-600 via-amber-700 to-amber-900',
    textColor: 'text-white',
    accentColor: 'text-amber-200',
  },
  CENCOSUD: {
    id: 'cencosud',
    nombre: 'Cencosud',
    tipo: 'banco',
    gradient: 'from-red-700 via-red-800 to-red-950',
    textColor: 'text-white',
    accentColor: 'text-red-200',
  },

  // BILLETERAS VIRTUALES / FINTECHS
  MERCADO_PAGO: {
    id: 'mercado_pago',
    nombre: 'Mercado Pago',
    tipo: 'billetera',
    gradient: 'from-sky-400 via-blue-500 to-blue-700',
    textColor: 'text-white',
    accentColor: 'text-sky-200',
  },
  UALA: {
    id: 'uala',
    nombre: 'Ualá',
    tipo: 'billetera',
    gradient: 'from-rose-400 via-pink-500 to-indigo-600',
    textColor: 'text-white',
    accentColor: 'text-pink-200',
  },
  NARANJA_X: {
    id: 'naranja_x',
    nombre: 'Naranja X',
    tipo: 'billetera',
    gradient: 'from-orange-500 via-orange-600 to-orange-800',
    textColor: 'text-white',
    accentColor: 'text-orange-200',
  },
  PERSONAL_PAY: {
    id: 'personal_pay',
    nombre: 'Personal Pay',
    tipo: 'billetera',
    gradient: 'from-pink-600 via-red-600 to-orange-700',
    textColor: 'text-white',
    accentColor: 'text-pink-200',
  },
  LEMON_CASH: {
    id: 'lemon_cash',
    nombre: 'Lemon Cash',
    tipo: 'billetera',
    gradient: 'from-zinc-900 via-zinc-800 to-lime-600',
    textColor: 'text-white',
    accentColor: 'text-lime-300',
  },
  BELO: {
    id: 'belo',
    nombre: 'Belo',
    tipo: 'billetera',
    gradient: 'from-violet-600 via-violet-700 to-violet-900',
    textColor: 'text-white',
    accentColor: 'text-violet-200',
  },
  PREX: {
    id: 'prex',
    nombre: 'Prex',
    tipo: 'billetera',
    gradient: 'from-green-600 via-emerald-700 to-green-900',
    textColor: 'text-white',
    accentColor: 'text-green-200',
  },
}

// ============================================================================
// MARCAS / REDES DE PAGO
// ============================================================================

export const MARCAS = {
  VISA: {
    id: 'visa',
    nombre: 'Visa',
    gradient: 'from-blue-900 via-blue-800 to-indigo-950',
    textColor: 'text-white',
    accentColor: 'text-blue-200',
  },
  MASTERCARD: {
    id: 'mastercard',
    nombre: 'Mastercard',
    gradient: 'from-zinc-900 via-slate-800 to-stone-900',
    textColor: 'text-white',
    accentColor: 'text-orange-400',
  },
  AMEX: {
    id: 'amex',
    nombre: 'American Express',
    gradient: 'from-cyan-900 via-teal-900 to-slate-900',
    textColor: 'text-white',
    accentColor: 'text-cyan-200',
  },
  CABAL: {
    id: 'cabal',
    nombre: 'Cabal',
    gradient: 'from-purple-800 via-purple-900 to-purple-950',
    textColor: 'text-white',
    accentColor: 'text-purple-300',
  },
  NARANJA: {
    id: 'naranja',
    nombre: 'Naranja',
    gradient: 'from-orange-600 via-orange-700 to-orange-900',
    textColor: 'text-white',
    accentColor: 'text-orange-200',
  },
  OTRA: {
    id: 'otra',
    nombre: 'Otra',
    gradient: 'from-slate-900 via-slate-800 to-slate-950',
    textColor: 'text-white',
    accentColor: 'text-slate-300',
  },
}

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

/**
 * Obtiene la entidad por ID (caso insensible)
 */
export function getEntidad(entidadId) {
  const key = Object.keys(ENTIDADES).find(
    (k) => ENTIDADES[k].id === entidadId?.toLowerCase()
  )
  return key ? ENTIDADES[key] : ENTIDADES.SANTANDER // Default a Santander
}

/**
 * Obtiene la marca por ID (caso insensible)
 */
export function getMarca(marcaId) {
  const key = Object.keys(MARCAS).find(
    (k) => MARCAS[k].id === marcaId?.toLowerCase()
  )
  return key ? MARCAS[key] : MARCAS.VISA // Default a Visa
}

/**
 * Combina estilos de entidad y marca
 * Usa gradiente de entidad, pero acepta override de marca en algunos casos
 */
export function getCardStyle(entidadId, marcaId) {
  const entidad = getEntidad(entidadId)
  const marca = getMarca(marcaId)

  return {
    gradient: entidad.gradient,
    textColor: entidad.textColor,
    accentColor: entidad.accentColor,
    entidad,
    marca,
  }
}

/**
 * Retorna opciones para selectores de formulario
 */
export function getEntidadesOptions() {
  return Object.values(ENTIDADES).map((e) => ({
    id: e.id,
    label: e.nombre,
  }))
}

export function getMarcasOptions() {
  return Object.values(MARCAS).map((m) => ({
    id: m.id,
    label: m.nombre,
  }))
}
