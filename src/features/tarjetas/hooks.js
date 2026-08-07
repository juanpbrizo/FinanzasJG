import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from './api'

/**
 * Hooks customizados para tarjetas y compras en cuotas.
 * Integrados con TanStack Query v5 para cache y invalidación.
 */

// ============================================================================
// QUERY HOOKS (Lectura)
// ============================================================================

export function useTarjetas() {
  return useQuery({
    queryKey: ['tarjetas'],
    queryFn: api.obtenerTarjetas,
    staleTime: 1000 * 60, // 1 minuto
  })
}

export function useTarjeta(tarjetaId) {
  return useQuery({
    queryKey: ['tarjeta', tarjetaId],
    queryFn: () => api.obtenerTarjeta(tarjetaId),
    staleTime: 1000 * 60,
    enabled: !!tarjetaId,
  })
}

export function useComprasCuotas(tarjetaId = null) {
  return useQuery({
    queryKey: ['compras_cuotas', tarjetaId],
    queryFn: () => api.obtenerComprasCuotas(tarjetaId),
    staleTime: 1000 * 60,
  })
}

export function useCompraCuota(compraId) {
  return useQuery({
    queryKey: ['compra_cuota', compraId],
    queryFn: () => api.obtenerCompraCuota(compraId),
    staleTime: 1000 * 60,
    enabled: !!compraId,
  })
}

export function useMovimientosCompraCuotas(compraId) {
  return useQuery({
    queryKey: ['movimientos_compra', compraId],
    queryFn: () => api.obtenerMovimientosCompraCuotas(compraId),
    staleTime: 1000 * 60,
    enabled: !!compraId,
  })
}

export function useEstadoCompraCuotas(compraId) {
  return useQuery({
    queryKey: ['estado_compra', compraId],
    queryFn: () => api.obtenerEstadoCompraCuotas(compraId),
    staleTime: 1000 * 60,
    enabled: !!compraId,
  })
}

export function useEstadoComprasCuotas(tarjetaId = null) {
  return useQuery({
    queryKey: ['estado_compras', tarjetaId],
    queryFn: () => api.obtenerEstadoComprasCuotas(tarjetaId),
    staleTime: 1000 * 60,
  })
}

export function useDisponibleTarjeta(tarjetaId) {
  return useQuery({
    queryKey: ['disponible_tarjeta', tarjetaId],
    queryFn: () => api.calcularDisponibleTarjeta(tarjetaId),
    staleTime: 1000 * 60,
    enabled: !!tarjetaId,
  })
}

/**
 * Disponible de varias tarjetas resuelto en un unico hook.
 * useQueries admite listas de largo variable sin violar las Rules of Hooks.
 * @param {string[]} tarjetaIds
 * @returns {Record<string, unknown>} mapa tarjetaId -> disponible
 */
export function useDisponiblesPorTarjeta(tarjetaIds = []) {
  return useQueries({
    queries: tarjetaIds.map((id) => ({
      queryKey: ['disponible_tarjeta', id],
      queryFn: () => api.calcularDisponibleTarjeta(id),
      staleTime: 1000 * 60,
    })),
    combine: (results) =>
      results.reduce((acc, result, index) => {
        if (result.data) acc[tarjetaIds[index]] = result.data
        return acc
      }, {}),
  })
}

/**
 * Movimientos de varias compras en cuotas, aplanados en un unico array.
 * @param {string[]} compraIds
 */
export function useMovimientosDeCompras(compraIds = []) {
  return useQueries({
    queries: compraIds.map((id) => ({
      queryKey: ['movimientos_compra', id],
      queryFn: () => api.obtenerMovimientosCompraCuotas(id),
      staleTime: 1000 * 60,
    })),
    combine: (results) => results.flatMap((result) => result.data ?? []),
  })
}

// ============================================================================
// MUTATION HOOKS (Escritura)
// ============================================================================

export function useCrearTarjeta() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.crearTarjeta,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarjetas'] })
    },
  })
}

export function useActualizarTarjeta() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ tarjetaId, payload }) => api.actualizarTarjeta(tarjetaId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tarjetas'] })
      if (data?.id) {
        queryClient.invalidateQueries({ queryKey: ['tarjeta', data.id] })
        queryClient.invalidateQueries({ queryKey: ['disponible_tarjeta', data.id] })
      }
    },
  })
}

export function useEliminarTarjeta() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.eliminarTarjeta,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarjetas'] })
      queryClient.invalidateQueries({ queryKey: ['compras_cuotas'] })
      queryClient.invalidateQueries({ queryKey: ['estado_compras'] })
    },
  })
}

export function useRegistrarCompraCuotas() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.registrarCompraCuotas,
    onSuccess: (data, variables) => {
      // Invalida listas de compras
      queryClient.invalidateQueries({ queryKey: ['compras_cuotas'] })
      queryClient.invalidateQueries({ queryKey: ['estado_compras'] })
      queryClient.invalidateQueries({ queryKey: ['movimientos_compra'] })

      // Invalida disponible de la tarjeta
      if (variables.tarjeta_id) {
        queryClient.invalidateQueries({ queryKey: ['disponible_tarjeta', variables.tarjeta_id] })
      }

      // Invalida resúmenes de presupuesto (nueva compra afecta proyecciones)
      queryClient.invalidateQueries({ queryKey: ['resumen'] })
      queryClient.invalidateQueries({ queryKey: ['fondos'] })
    },
  })
}

export function useActualizarCuotaIndividual() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ movimientoId, nuevoMonto }) =>
      api.actualizarCuotaIndividual(movimientoId, nuevoMonto),
    onSuccess: () => {
      // Invalida movimientos y estados
      queryClient.invalidateQueries({ queryKey: ['movimientos_compra'] })
      queryClient.invalidateQueries({ queryKey: ['estado_compra'] })
      queryClient.invalidateQueries({ queryKey: ['estado_compras'] })

      // Invalida resúmenes (cambio en gasto afecta dashboards)
      queryClient.invalidateQueries({ queryKey: ['resumen'] })
      queryClient.invalidateQueries({ queryKey: ['fondos'] })
    },
  })
}

export function useRecalcularCuotasPendientes() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ compraId, nuevoSaldo }) =>
      api.recalcularCuotasPendientes(compraId, nuevoSaldo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movimientos_compra'] })
      queryClient.invalidateQueries({ queryKey: ['estado_compra'] })
      queryClient.invalidateQueries({ queryKey: ['estado_compras'] })
      queryClient.invalidateQueries({ queryKey: ['resumen'] })
      queryClient.invalidateQueries({ queryKey: ['fondos'] })
    },
  })
}
