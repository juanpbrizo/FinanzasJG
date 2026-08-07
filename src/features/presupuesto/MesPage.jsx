import { useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { History, Plus, RefreshCw } from 'lucide-react'
import { esPeriodoValido, periodoActual } from '../../lib/formatters'
import Spinner from '../../components/ui/Spinner'
import Button from '../../components/ui/Button'
import Toast from '../../components/ui/Toast'
import PeriodSelector from './components/PeriodSelector'
import EmptyState from './components/EmptyState'
import InitializeModal from './components/InitializeModal'
import SummaryCards from './components/SummaryCards'
import FondosList from './components/FondosList'
import CreateGastoModal from './components/CreateGastoModal'
import CreateIngresoModal from './components/CreateIngresoModal'
import IngresosDelMesPanel from './components/IngresosDelMesPanel'
import DineroSinAsignarWidget from './components/DineroSinAsignarWidget'
import HistorialTransferenciasDrawer from './components/HistorialTransferenciasDrawer'
import BotonCerrarPeriodo from './components/BotonCerrarPeriodo'
import {
  usePeriodo,
  useResumenPeriodo,
  useFondosMensuales,
  useIngresos,
  useMutateInicializarPeriodo,
  useSincronizarFondos,
  useActualizarFondoMensual,
  useCrearGasto,
  useCrearIngreso,
  useActualizarIngreso,
  useEliminarIngreso,
} from './hooks'

export default function MesPage() {
  const { periodo } = useParams()
  const [showInitModal, setShowInitModal] = useState(false)
  const [showGastoModal, setShowGastoModal] = useState(false)
  const [showIngresoModal, setShowIngresoModal] = useState(false)
  const [showHistorial, setShowHistorial] = useState(false)
  const [editingIngreso, setEditingIngreso] = useState(null)
  const [toast, setToast] = useState(null)

  // Hooks SIEMPRE llamados, independientemente de validaciones.
  const { data: periodoData, isLoading: periodoLoading, error: periodoError } = usePeriodo(periodo)
  const { data: resumen } = useResumenPeriodo(periodoData?.id)
  const { data: fondos, isLoading: fondosLoading } = useFondosMensuales(periodoData?.id)
  const { data: ingresos, isLoading: ingresosLoading } = useIngresos(periodoData?.id)
  const inicializar = useMutateInicializarPeriodo()
  const sincronizarFondos = useSincronizarFondos()
  const actualizarFondo = useActualizarFondoMensual()
  const crearGasto = useCrearGasto()
  const crearIngreso = useCrearIngreso()
  const actualizarIngreso = useActualizarIngreso()
  const eliminarIngreso = useEliminarIngreso()

  if (!esPeriodoValido(periodo)) {
    return <Navigate to={`/mes/${periodoActual()}`} replace />
  }

  const estaCerrado = periodoData?.estado === 'cerrado'

  const handleInitialize = async () => {
    try {
      await inicializar.mutateAsync(periodo)
      setShowInitModal(false)
    } catch (error) {
      console.error('Error al inicializar:', error?.message, error)
    }
  }

  const handleCrearGasto = async (gastoData) => {
    if (estaCerrado) {
      setToast({
        variant: 'error',
        message: 'El período está cerrado: no se pueden registrar nuevos gastos.',
      })
      return false
    }

    try {
      await crearGasto.mutateAsync(gastoData)
      setShowGastoModal(false)
      setToast({ variant: 'success', message: 'Gasto registrado correctamente' })
      return true
    } catch (error) {
      console.error('Error al crear gasto:', {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
      })

      const esPermiso = error?.code === '42501' || error?.status === 403
      setToast({
        variant: 'error',
        message: esPermiso
          ? 'No tenés permiso para registrar este gasto. Verificá que el período te pertenezca y no esté cerrado.'
          : (error?.message ?? 'No se pudo registrar el gasto'),
      })
      return false
    }
  }

  const handleSincronizarFondos = async () => {
    try {
      const creados = await sincronizarFondos.mutateAsync(periodo)
      setToast({
        variant: 'success',
        message:
          creados > 0
            ? `Fondos y categorías actualizados desde la plantilla (${creados} nuevo${creados === 1 ? '' : 's'})`
            : 'Fondos y categorías actualizados desde la plantilla',
      })
    } catch (error) {
      console.error('Error al sincronizar fondos:', error?.message, error)
      setToast({
        variant: 'error',
        message: error?.message ?? 'No se pudieron sincronizar los fondos',
      })
    }
  }

  const handleActualizarPresupuesto = async (fondoId, monto) => {
    try {
      await actualizarFondo.mutateAsync({
        fondoId,
        payload: { monto_presupuestado: monto },
      })
    } catch (error) {
      console.error('Error al actualizar presupuesto:', error?.message, error)
    }
  }

  const handleCrearIngreso = async (ingresoData) => {
    try {
      await crearIngreso.mutateAsync({
        periodo_id: periodoData?.id,
        ...ingresoData,
      })
      setShowIngresoModal(false)
      setEditingIngreso(null)
    } catch (error) {
      console.error('Error al crear ingreso:', error)
    }
  }

  const handleActualizarIngreso = async (ingresoData) => {
    try {
      await actualizarIngreso.mutateAsync({
        ingresoId: editingIngreso.id,
        payload: ingresoData,
      })
      setShowIngresoModal(false)
      setEditingIngreso(null)
    } catch (error) {
      console.error('Error al actualizar ingreso:', error)
    }
  }

  const handleEliminarIngreso = async (ingresoId) => {
    try {
      await eliminarIngreso.mutateAsync(ingresoId)
    } catch (error) {
      console.error('Error al eliminar ingreso:', error)
    }
  }

  const handleEditarIngreso = (ingreso) => {
    setEditingIngreso(ingreso)
    setShowIngresoModal(true)
  }

  // Obtener todas las categorias para el selector del gasto.
  const todasLasCategorias = fondos?.flatMap((fondo) => fondo.categorias_mensuales ?? []) ?? []

  if (periodoLoading || fondosLoading) return <Spinner />

  return (
    <div className="space-y-6">
      {(periodoError || inicializar.isError) && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">No se pudo cargar o inicializar el período</p>
          <p className="mt-1">
            {periodoError?.message || inicializar.error?.message || 'Error desconocido'}
          </p>
          {(periodoError?.hint || inicializar.error?.hint) && (
            <p className="mt-1 opacity-80">{periodoError?.hint || inicializar.error?.hint}</p>
          )}
        </div>
      )}

      {/* Navegacion de periodo + Acciones */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <PeriodSelector periodo={periodo} />
        </div>
        {periodoData && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSincronizarFondos}
              disabled={estaCerrado || sincronizarFondos.isPending}
              title="Trae al mes los fondos y categorías nuevos de tu plantilla"
              className="gap-2"
            >
              <RefreshCw
                className={`w-4 h-4 ${sincronizarFondos.isPending ? 'animate-spin' : ''}`}
              />
              {sincronizarFondos.isPending ? 'Sincronizando...' : 'Sincronizar Fondos'}
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setEditingIngreso(null)
                setShowIngresoModal(true)
              }}
              disabled={estaCerrado}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Agregar Ingreso
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistorial(true)}
              className="gap-2"
            >
              <History className="w-4 h-4" />
              Historial
            </Button>
            <BotonCerrarPeriodo
              periodo={periodo}
              periodoEstado={periodoData?.estado}
              onSuccess={() => {
                // Refrescar datos
              }}
            />
          </div>
        )}
      </div>

      {/* Empty state: el periodo no existe aun */}
      {!periodoData ? (
        <>
          <EmptyState
            periodo={periodo}
            onInitialize={() => setShowInitModal(true)}
          />
          <InitializeModal
            isOpen={showInitModal}
            onClose={() => setShowInitModal(false)}
            onConfirm={handleInitialize}
            isLoading={inicializar.isPending}
          />
        </>
      ) : (
        <>
          {/* Tarjetas de resumen */}
          <SummaryCards resumen={resumen} />

          {/* Panel de Ingresos (FASE 1 - Completado) */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Ingresos del Período</h3>
              <Button
                onClick={() => {
                  setEditingIngreso(null)
                  setShowIngresoModal(true)
                }}
                disabled={periodoData?.estado === 'cerrado'}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Agregar Ingreso
              </Button>
            </div>
            <IngresosDelMesPanel
              ingresos={ingresos}
              isLoading={ingresosLoading}
              onEdit={handleEditarIngreso}
              onDelete={handleEliminarIngreso}
              isDisabled={periodoData?.estado === 'cerrado' || eliminarIngreso.isPending}
            />
          </div>

          {/* Widget Dinero Sin Asignar (FASE 3) */}
          <DineroSinAsignarWidget
            resumen={resumen}
            fondos={fondos}
            periodoId={periodoData?.id}
            periodoEstado={periodoData?.estado}
            onTransferirSuccess={() => {
              // Los hooks ya invalidan automaticamente
            }}
          />

          {/* Boton flotante para crear gasto */}
          <button
            onClick={() => setShowGastoModal(true)}
            disabled={periodoData?.estado === 'cerrado'}
            className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-xl text-white shadow-lg hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
            title={periodoData?.estado === 'cerrado' ? 'Período cerrado' : 'Crear gasto'}
          >
            +
          </button>

          {/* Lista de fondos */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Fondos del Mes</h2>
            <FondosList
              fondos={fondos}
              onUpdatePresupuesto={handleActualizarPresupuesto}
              isLocked={estaCerrado}
              isSaving={actualizarFondo.isPending}
            />
          </div>

          {/* Modales y Drawers */}
          <CreateGastoModal
            isOpen={showGastoModal}
            onClose={() => setShowGastoModal(false)}
            onSubmit={handleCrearGasto}
            categorias={todasLasCategorias}
            isLoading={crearGasto.isPending}
          />

          <CreateIngresoModal
            key={editingIngreso?.id ?? 'nuevo-ingreso'}
            isOpen={showIngresoModal}
            onClose={() => {
              setShowIngresoModal(false)
              setEditingIngreso(null)
            }}
            onSubmit={editingIngreso ? handleActualizarIngreso : handleCrearIngreso}
            isLoading={crearIngreso.isPending || actualizarIngreso.isPending}
            initialData={
              editingIngreso
                ? {
                    descripcion: editingIngreso.descripcion,
                    monto: String(editingIngreso.monto ?? ''),
                    es_fijo: editingIngreso.es_fijo,
                    fecha: editingIngreso.fecha,
                  }
                : null
            }
          />

          <HistorialTransferenciasDrawer
            isOpen={showHistorial}
            onClose={() => setShowHistorial(false)}
            periodoId={periodoData?.id}
          />
        </>
      )}

      <Toast
        message={toast?.message}
        variant={toast?.variant}
        onDismiss={() => setToast(null)}
      />
    </div>
  )
}
