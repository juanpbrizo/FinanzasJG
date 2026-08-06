import { QueryClient } from '@tanstack/react-query'

/**
 * Configuracion unica de TanStack Query.
 * - Los datos financieros cambian por accion del usuario, no solos:
 *   se desactiva el refetch al enfocar la ventana y se usa un staleTime corto.
 * - Sin reintentos sobre errores 4xx (RLS / validacion): reintentar no ayuda.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minuto
      gcTime: 1000 * 60 * 10, // 10 minutos
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        const status = error?.status ?? error?.originalError?.status
        if (typeof status === 'number' && status >= 400 && status < 500) return false
        return failureCount < 2
      },
    },
    mutations: {
      retry: 0,
    },
  },
})
