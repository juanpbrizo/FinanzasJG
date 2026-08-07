import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from './api'

/**
 * Hooks para suscripciones recurrentes.
 * Integrados con TanStack Query v5.
 */

// ============================================================================
// QUERIES
// ============================================================================

export function useSuscripciones() {
  return useQuery({
    queryKey: ['suscripciones'],
    queryFn: api.obtenerSuscripciones,
    staleTime: 1000 * 60,
  })
}

export function useSuscripcionesPorTarjeta(tarjetaId) {
  return useQuery({
    queryKey: ['suscripciones', tarjetaId],
    queryFn: () => api.obtenerSuscripcionesPorTarjeta(tarjetaId),
    staleTime: 1000 * 60,
    enabled: !!tarjetaId,
  })
}

export function useSuscripcion(suscripcionId) {
  return useQuery({
    queryKey: ['suscripcion', suscripcionId],
    queryFn: () => api.obtenerSuscripcion(suscripcionId),
    staleTime: 1000 * 60,
    enabled: !!suscripcionId,
  })
}

// ============================================================================
// MUTATIONS
// ============================================================================

export function useCrearSuscripcion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.crearSuscripcion,
    onSuccess: () => {
      // Invalida lista de suscripciones
      queryClient.invalidateQueries({ queryKey: ['suscripciones'] })

      // Invalida resúmenes de tarjetas (el comprometido aumenta)
      queryClient.invalidateQueries({ queryKey: ['tarjetas_resumen'] })

      // Invalida resúmenes de presupuesto (nueva suscripción afecta proyecciones)
      queryClient.invalidateQueries({ queryKey: ['resumen'] })
      queryClient.invalidateQueries({ queryKey: ['fondos'] })
    },
  })
}

export function useActualizarSuscripcion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ suscripcionId, payload }) => api.actualizarSuscripcion(suscripcionId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['suscripciones'] })
      if (data?.id) {
        queryClient.invalidateQueries({ queryKey: ['suscripcion', data.id] })
      }

      // Invalida resúmenes que dependen de suscripciones activas
      queryClient.invalidateQueries({ queryKey: ['tarjetas_resumen'] })
      queryClient.invalidateQueries({ queryKey: ['resumen'] })
      queryClient.invalidateQueries({ queryKey: ['fondos'] })
    },
  })
}

export function useDesactivarSuscripcion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.desactivarSuscripcion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suscripciones'] })
      queryClient.invalidateQueries({ queryKey: ['tarjetas_resumen'] })
      queryClient.invalidateQueries({ queryKey: ['resumen'] })
      queryClient.invalidateQueries({ queryKey: ['fondos'] })
    },
  })
}

export function useEliminarSuscripcion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.eliminarSuscripcion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suscripciones'] })
      queryClient.invalidateQueries({ queryKey: ['tarjetas_resumen'] })
      queryClient.invalidateQueries({ queryKey: ['resumen'] })
      queryClient.invalidateQueries({ queryKey: ['fondos'] })
    },
  })
}
