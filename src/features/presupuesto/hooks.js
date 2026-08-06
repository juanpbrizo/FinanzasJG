import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from './api'

// Query keys
const queryKeys = {
  periodo: (periodo) => ['periodo', periodo],
  resumen: (periodoId) => ['resumen', periodoId],
  fondos: (periodoId) => ['fondos', periodoId],
  ingresos: (periodoId) => ['ingresos', periodoId],
  fondosPlantilla: () => ['fondosPlantilla'],
}

/**
 * Obtiene un periodo especifico: verifica si existe.
 */
export function usePeriodo(periodo) {
  return useQuery({
    queryKey: queryKeys.periodo(periodo),
    queryFn: () => api.obtenerPeriodo(periodo),
    enabled: !!periodo,
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Obtiene el resumen del periodo: ingresos, presupuesto, gasto, dinero sin asignar.
 */
export function useResumenPeriodo(periodoId) {
  return useQuery({
    queryKey: queryKeys.resumen(periodoId),
    queryFn: () => api.obtenerResumenPeriodo(periodoId),
    enabled: !!periodoId,
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Obtiene los fondos mensuales con sus categorias y movimientos del periodo.
 */
export function useFondosMensuales(periodoId) {
  return useQuery({
    queryKey: queryKeys.fondos(periodoId),
    queryFn: () => api.obtenerFondosMensuales(periodoId),
    enabled: !!periodoId,
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Obtiene los ingresos registrados en el periodo.
 */
export function useIngresos(periodoId) {
  return useQuery({
    queryKey: queryKeys.ingresos(periodoId),
    queryFn: () => api.obtenerIngresos(periodoId),
    enabled: !!periodoId,
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Obtiene la plantilla de fondos del usuario (para reutilizar).
 */
export function useFondosPlantilla() {
  return useQuery({
    queryKey: queryKeys.fondosPlantilla(),
    queryFn: api.obtenerFondosPlantilla,
    staleTime: 1000 * 60 * 10,
  })
}

/**
 * Inicializa un periodo: clona fondos, categorias e ingresos fijos.
 * Invalida el resumen y fondos tras completar.
 */
export function useMutateInicializarPeriodo() {
  const queryClient = useQueryClient()

  return useMutation({
    // Se envuelve para evitar que TanStack Query pase su objeto de contexto
    // como segundo argumento (p_arrastrar_saldos).
    mutationFn: (periodo) => api.inicializarPeriodo(periodo),
    onSuccess: (periodoId, periodo) => {
      // Invalida las queries relacionadas para que se refresquen.
      queryClient.invalidateQueries({ queryKey: queryKeys.periodo(periodo) })
      queryClient.invalidateQueries({ queryKey: queryKeys.resumen(periodoId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.fondos(periodoId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.ingresos(periodoId) })
    },
  })
}

/**
 * Re-sincroniza los fondos de la plantilla hacia un periodo ya inicializado.
 */
export function useSincronizarFondos() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (periodo) => api.sincronizarFondosDesdePlantilla(periodo),
    onSuccess: (_creados, periodo) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.periodo(periodo) })
      queryClient.invalidateQueries({ queryKey: ['resumen'] })
      queryClient.invalidateQueries({ queryKey: ['fondos'] })
      queryClient.invalidateQueries({ queryKey: ['ingresos'] })
    },
  })
}

/**
 * Actualiza el presupuesto de un fondo mensual.
 */
export function useActualizarFondoMensual() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ fondoId, payload }) => api.actualizarFondoMensual(fondoId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumen'] })
      queryClient.invalidateQueries({ queryKey: ['fondos'] })
      queryClient.invalidateQueries({ queryKey: ['ingresos'] })
    },
  })
}

/**
 * Crea un gasto (movimiento simple).
 * Invalida el resumen y los fondos tras completar.
 */
export function useCrearGasto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.crearGasto,
    onSuccess: () => {
      // Invalida TODO lo que pueda estar afectado.
      queryClient.invalidateQueries({ queryKey: ['resumen'] })
      queryClient.invalidateQueries({ queryKey: ['fondos'] })
    },
  })
}

/**
 * Crea un fondo en la plantilla.
 * Invalida la lista de fondos plantilla.
 */
export function useCrearFondoPlantilla() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.crearFondoPlantilla,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.fondosPlantilla() })
    },
  })
}

/**
 * Crea una categoria en un fondo plantilla.
 * Invalida la lista de fondos plantilla.
 */
export function useCrearCategoriaPlantilla() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.crearCategoriaPlantilla,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.fondosPlantilla() })
    },
  })
}

/**
 * Elimina un fondo plantilla.
 */
export function useEliminarFondoPlantilla() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.eliminarFondoPlantilla,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.fondosPlantilla() })
    },
  })
}

/**
 * Elimina una categoria plantilla.
 */
export function useEliminarCategoriaPlantilla() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.eliminarCategoriaPlantilla,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.fondosPlantilla() })
    },
  })
}

/**
 * Transfiere un monto entre fondos de un periodo (Fase 3).
 * Invalida el resumen y los fondos tras completar.
 */
export function useTransferirFondos() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.transferirEntreFondos,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumen'] })
      queryClient.invalidateQueries({ queryKey: ['fondos'] })
      queryClient.invalidateQueries({ queryKey: ['transferencias'] })
    },
  })
}

/**
 * Cierra un periodo, congelando sus movimientos (Fase 3).
 * Invalida el estado del periodo tras completar.
 */
export function useCerrarPeriodo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.cerrarPeriodo,
    onSuccess: (_, periodo) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.periodo(periodo) })
      queryClient.invalidateQueries({ queryKey: ['resumen'] })
      queryClient.invalidateQueries({ queryKey: ['fondos'] })
    },
  })
}

/**
 * Obtiene el historial de transferencias de un periodo (Fase 3).
 */
export function useHistorialTransferencias(periodoId) {
  return useQuery({
    queryKey: ['transferencias', periodoId],
    queryFn: () => api.obtenerHistorialTransferencias(periodoId),
    enabled: !!periodoId,
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Obtiene todos los movimientos de un período para análisis y exportación (Fase 4).
 */
export function useMovimientosDelPeriodo(periodoId) {
  return useQuery({
    queryKey: ['movimientos_periodo', periodoId],
    queryFn: () => api.obtenerMovimientosDelPeriodo(periodoId),
    enabled: !!periodoId,
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Obtiene datos de analytics anuales (últimos 12 meses) para gráficos (Fase 4).
 */
export function useAnalyticsAnual() {
  return useQuery({
    queryKey: ['analytics_anual'],
    queryFn: api.obtenerAnalyticsAnual,
    staleTime: 1000 * 60 * 10,
  })
}

/**
 * Crea un nuevo ingreso en el periodo.
 * Invalida las queries de resumen e ingresos para reflejar cambios en tiempo real.
 */
export function useCrearIngreso() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.crearIngreso,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumen'] })
      queryClient.invalidateQueries({ queryKey: ['ingresos'] })
    },
  })
}

/**
 * Actualiza un ingreso existente.
 * Invalida las queries de resumen e ingresos.
 */
export function useActualizarIngreso() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ ingresoId, payload }) => api.actualizarIngreso(ingresoId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumen'] })
      queryClient.invalidateQueries({ queryKey: ['ingresos'] })
    },
  })
}

/**
 * Elimina un ingreso.
 * Invalida las queries de resumen e ingresos.
 */
export function useEliminarIngreso() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.eliminarIngreso,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumen'] })
      queryClient.invalidateQueries({ queryKey: ['ingresos'] })
    },
  })
}
