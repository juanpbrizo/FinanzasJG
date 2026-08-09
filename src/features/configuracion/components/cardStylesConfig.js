/**
 * Configuración de estilos de tarjetas por marca.
 * Funciones y constantes compartidas (no componentes React).
 */

export const CARD_STYLES = {
  VISA: {
    gradient: 'from-blue-900 via-blue-800 to-indigo-950',
    logoColor: 'text-blue-200',
  },
  MASTERCARD: {
    gradient: 'from-zinc-900 via-slate-800 to-stone-900',
    logoColor: 'text-orange-400',
  },
  AMEX: {
    gradient: 'from-cyan-900 via-teal-900 to-slate-900',
    logoColor: 'text-cyan-200',
  },
  OTRA: {
    gradient: 'from-slate-900 via-slate-800 to-slate-950',
    logoColor: 'text-slate-300',
  },
}

/**
 * Obtiene la configuración de colores según la marca
 */
export function getCardStyle(marca) {
  const key = marca?.toUpperCase() || 'OTRA'
  return CARD_STYLES[key] || CARD_STYLES.OTRA
}
