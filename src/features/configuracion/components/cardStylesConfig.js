/**
 * Configuración de estilos de tarjetas combinando banco/entidad y marca.
 * Funciones y constantes compartidas (no componentes React).
 */

import { getCardStyle as getCardStyleFromThemes } from '../../../constants/tarjetasThemes'

/**
 * Obtiene la configuración de colores según entidad y marca
 * Usa el gradiente del banco/billetera y colores de la marca
 */
export function getCardStyle(entidadId, marcaId) {
  return getCardStyleFromThemes(entidadId, marcaId)
}
