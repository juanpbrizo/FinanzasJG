import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { HashRouter } from 'react-router-dom'

import './index.css'
import { isSupabaseConfigured } from './lib/supabase'
import { queryClient } from './lib/queryClient'
import EnvErrorScreen from './components/EnvErrorScreen'
import AuthProvider from './features/auth/AuthProvider'
import AppRoutes from './routes'

const root = createRoot(document.getElementById('root'))

// Fail fast: sin credenciales validas no se monta ningun proveedor.
if (!isSupabaseConfigured) {
  root.render(
    <StrictMode>
      <EnvErrorScreen />
    </StrictMode>,
  )
} else {
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <HashRouter>
            <AppRoutes />
          </HashRouter>
        </AuthProvider>
      </QueryClientProvider>
    </StrictMode>,
  )
}
