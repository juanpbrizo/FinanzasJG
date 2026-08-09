/**
 * Logos de marcas de tarjetas de crédito.
 * Componentes SVG pequeños renderizados en la tarjeta.
 */

import { getCardStyle } from './cardStylesConfig'

function VisaLogo({ className = 'h-8 w-12' }) {
  return (
    <svg viewBox="0 0 48 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="32" rx="4" fill="currentColor" opacity="0.1" />
      {/* Texto "VISA" en estilo corporativo */}
      <text x="24" y="20" fontSize="14" fontWeight="bold" textAnchor="middle" fill="currentColor">
        VISA
      </text>
    </svg>
  )
}

function MastercardLogo({ className = 'h-8 w-12' }) {
  return (
    <svg viewBox="0 0 48 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Dos círculos superpuestos rojo y naranja */}
      <circle cx="16" cy="16" r="9" fill="currentColor" opacity="0.8" />
      <circle cx="32" cy="16" r="9" fill="currentColor" opacity="0.6" />
    </svg>
  )
}

function AmexLogo({ className = 'h-8 w-12' }) {
  return (
    <svg viewBox="0 0 48 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="32" rx="4" fill="currentColor" opacity="0.1" />
      {/* Texto "AMEX" en estilo corporativo */}
      <text x="24" y="20" fontSize="12" fontWeight="bold" textAnchor="middle" fill="currentColor">
        AMEX
      </text>
    </svg>
  )
}

/**
 * Componente para renderizar el logo según marca
 */
export function BrandLogo({ marca, className = 'h-8 w-12' }) {
  const { logoColor } = getCardStyle(marca)

  const brandLower = marca?.toLowerCase()

  if (brandLower === 'visa') {
    return <VisaLogo className={`${className} ${logoColor}`} />
  }

  if (brandLower === 'mastercard') {
    return <MastercardLogo className={`${className} ${logoColor}`} />
  }

  if (brandLower === 'amex') {
    return <AmexLogo className={`${className} ${logoColor}`} />
  }

  return (
    <div className={`${className} ${logoColor} flex items-center justify-center text-xs font-bold`}>
      ♦
    </div>
  )
}
