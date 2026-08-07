import { useMemo, useState } from 'react'
import Spinner from '../../components/ui/Spinner'
import TarjetaForm from './components/TarjetaForm'
import TarjetasList from './components/TarjetasList'
import CompraCuotasForm from './components/CompraCuotasForm'
import ProyeccionCuotasTabla from './components/ProyeccionCuotasTabla'
import CuotaEditModal from './components/CuotaEditModal'
import { construirProyeccionCuotas } from './proyeccion'
import {
  useTarjetas,
  useCrearTarjeta,
  useActualizarTarjeta,
  useEliminarTarjeta,
  useResumenTarjetas,
  useComprasCuotas,
  useRegistrarCompraCuotas,
  useMovimientosDeCompras,
  useActualizarCuotaIndividual,
  useRecalcularCuotasPendientes,
} from './hooks'
import { useFondosPlantilla } from '../presupuesto/hooks'

export default function TarjetasPage() {
  const [tarjetaEnEdicion, setTarjetaEnEdicion] = useState(null)
  const [showCuotaModal, setShowCuotaModal] = useState(false)
  const [cuotaSeleccionada, setCuotaSeleccionada] = useState(null)

  // Queries
  const { data: tarjetas, isLoading: tarjetasLoading } = useTarjetas()
  const { data: comprasCuotas, isLoading: comprasLoading } = useComprasCuotas()
  const { data: fondosPlantilla } = useFondosPlantilla()

  // Mutations
  const crearTarjeta = useCrearTarjeta()
  const actualizarTarjeta = useActualizarTarjeta()
  const eliminarTarjeta = useEliminarTarjeta()
  const registrarCompraCuotas = useRegistrarCompraCuotas()
  const ajustarCuota = useActualizarCuotaIndividual()
  const recalcularSaldo = useRecalcularCuotasPendientes()

  // Disponible por tarjeta y movimientos de cada compra.
  // Los movimientos se resuelven con useQueries: la cantidad de compras es
  // variable y llamar useQuery dentro de un forEach rompe las Rules of Hooks.
  const compraIds = useMemo(() => comprasCuotas?.map((c) => c.id) ?? [], [comprasCuotas])

  const { data: disponibles } = useResumenTarjetas()
  const todoMovimientos = useMovimientosDeCompras(compraIds)
  const movimientosProyectados = useMemo(
    () => construirProyeccionCuotas(comprasCuotas ?? [], todoMovimientos ?? []),
    [comprasCuotas, todoMovimientos],
  )

  const handleCrearTarjeta = async (payload) => {
    await crearTarjeta.mutateAsync(payload)
  }

  const handleEditarTarjeta = (tarjeta) => {
    setTarjetaEnEdicion(tarjeta)
  }

  const handleActualizarTarjeta = async (payload) => {
    await actualizarTarjeta.mutateAsync({
      tarjetaId: tarjetaEnEdicion.id,
      payload,
    })
    setTarjetaEnEdicion(null)
  }

  const handleEliminarTarjeta = async (tarjetaId) => {
    if (confirm('¿Eliminar esta tarjeta?')) {
      await eliminarTarjeta.mutateAsync(tarjetaId)
    }
  }

  const handleRegistrarCompraCuotas = async (payload) => {
    await registrarCompraCuotas.mutateAsync(payload)
  }

  const handleAjustarCuota = async (movimientoId, nuevoMonto) => {
    await ajustarCuota.mutateAsync({ movimientoId, nuevoMonto })
    setShowCuotaModal(false)
    setCuotaSeleccionada(null)
  }

  const handleRecalcularSaldo = async (compraId, nuevoSaldo) => {
    await recalcularSaldo.mutateAsync({ compraId, nuevoSaldo })
    setShowCuotaModal(false)
    setCuotaSeleccionada(null)
  }

  const handleSeleccionarCuota = (movimiento) => {
    setCuotaSeleccionada(movimiento)
    setShowCuotaModal(true)
  }

  if (tarjetasLoading || comprasLoading) return <Spinner />

  return (
    <div className="space-y-8">
      {/* Sección: Gestión de Tarjetas */}
      <section>
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Mis Tarjetas de Crédito</h2>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Formulario de crear/editar */}
          <div>
            <h3 className="mb-3 text-lg font-semibold text-slate-900">
              {tarjetaEnEdicion ? 'Editar tarjeta' : 'Agregar nueva tarjeta'}
            </h3>
            <TarjetaForm
              tarjetaInicial={tarjetaEnEdicion}
              onSubmit={tarjetaEnEdicion ? handleActualizarTarjeta : handleCrearTarjeta}
              isLoading={crearTarjeta.isPending || actualizarTarjeta.isPending}
            />
          </div>

          {/* Lista de tarjetas */}
          <div>
            <h3 className="mb-3 text-lg font-semibold text-slate-900">Tarjetas registradas</h3>
            <TarjetasList
              tarjetas={tarjetas}
              disponibles={disponibles ?? {}}
              onEdit={handleEditarTarjeta}
              onDelete={handleEliminarTarjeta}
              isLoading={eliminarTarjeta.isPending}
            />
          </div>
        </div>
      </section>

      {/* Sección: Compras en Cuotas */}
      <section>
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Registrar Compra en Cuotas</h2>
        <CompraCuotasForm
          tarjetas={tarjetas}
          fondosPlantilla={fondosPlantilla}
          onSubmit={handleRegistrarCompraCuotas}
          isLoading={registrarCompraCuotas.isPending}
        />
      </section>

      {/* Sección: Proyección de Cuotas */}
      {movimientosProyectados.length > 0 && (
        <section>
          <h2 className="mb-4 text-2xl font-bold text-slate-900">Proyección de Cuotas (12 meses)</h2>
          <ProyeccionCuotasTabla
            movimientos={movimientosProyectados}
            onCuotaClick={handleSeleccionarCuota}
          />
          <p className="mt-2 text-xs text-slate-600">
            Usa el botón “Ajustar” de cada cuota para modificarla o recalcular el saldo pendiente.
          </p>
        </section>
      )}

      {/* Modal de edición de cuota */}
      <CuotaEditModal
        key={cuotaSeleccionada?.id ?? 'sin-cuota'}
        isOpen={showCuotaModal}
        onClose={() => {
          setShowCuotaModal(false)
          setCuotaSeleccionada(null)
        }}
        movimiento={cuotaSeleccionada}
        compra={comprasCuotas?.find((c) => c.id === cuotaSeleccionada?.compra_cuota_id) ?? null}
        onAjustarCuota={handleAjustarCuota}
        onRecalcularSaldo={handleRecalcularSaldo}
        isLoading={ajustarCuota.isPending || recalcularSaldo.isPending}
      />
    </div>
  )
}
