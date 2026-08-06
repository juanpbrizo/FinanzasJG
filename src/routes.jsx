import { Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import NotFoundPage from './components/NotFoundPage'
import LoginPage from './features/auth/LoginPage'
import ProtectedRoute from './features/auth/ProtectedRoute'
import DashboardPage from './features/dashboard/DashboardPage'
import DashboardAnalyticsPage from './features/dashboard/DashboardAnalyticsPage'
import MesPage from './features/presupuesto/MesPage'
import TarjetasPage from './features/tarjetas/TarjetasPage'
import ConfiguracionPage from './features/configuracion/ConfiguracionPage'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="analytics/:periodo?" element={<DashboardAnalyticsPage />} />
          <Route path="mes/:periodo" element={<MesPage />} />
          <Route path="tarjetas" element={<TarjetasPage />} />
          <Route path="configuracion" element={<ConfiguracionPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
