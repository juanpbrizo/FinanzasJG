import { useMemo, useState } from "react"
import { Plus } from "lucide-react"
import Spinner from "../../components/ui/Spinner"
import ProyeccionCuotasTabla from "./components/ProyeccionCuotasTabla"
import CuotaEditModal from "./components/CuotaEditModal"
import CreateCompraTarjetaModal from "./components/CreateCompraTarjetaModal"
import { construirProyeccionCuotas } from "./proyeccion"
import {
  useTarjetas,
  useComprasCuotas,
  useRegistrarCompraCuotas,
  useMovimientosDeCompras,
  useActualizarCuotaIndividual,
  useRecalcularCuotasPendientes,
} from "./hooks"
import { useFondosPlantilla } from "../presupuesto/hooks"

export default function TarjetasPage() {
  const [showCompraCuotasModal, setShowCompraCuotasModal] = useState(false)
  const [showCuotaModal, setShowCuotaModal] = useState(false)
  const [cuotaSeleccionada, setCuotaSeleccionada] = useState(null)

  const { data: tarjetas, isLoading: tarjetasLoading } = useTarjetas()
  const { data: comprasCuotas, isLoading: comprasLoading } = useComprasCuotas()
  const { data: fondosPlantilla } = useFondosPlantilla()

  const registrarCompraCuotas = useRegistrarCompraCuotas()
  const ajustarCuota = useActualizarCuotaIndividual()
  const recalcularSaldo = useRecalcularCuotasPendientes()

  const compraIds = useMemo(() => comprasCuotas?.map((c) => c.id) ?? [], [comprasCuotas])

  const todoMovimientos = useMovimientosDeCompras(compraIds)
  const movimientosProyectados = useMemo(
    () => construirProyeccionCuotas(comprasCuotas ?? [], todoMovimientos ?? []),
    [comprasCuotas, todoMovimientos],
  )

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
    <div className="space-y-6 sm:space-y-8">
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Registro de Compras en Cuotas
          </h2>
          <button
            onClick={() => setShowCompraCuotasModal(true)}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            title="Registrar nuevo cargo"
          >
            <Plus className="h-5 w-5" />
            <span className="sr-only">Registrar cargo</span>
          </button>
        </div>

        <CreateCompraTarjetaModal
          isOpen={showCompraCuotasModal}
          onClose={() => setShowCompraCuotasModal(false)}
          onSubmit={handleRegistrarCompraCuotas}
          isLoading={registrarCompraCuotas.isPending}
          tarjetas={tarjetas}
          fondosPlantilla={fondosPlantilla}
        />
      </section>

      {movimientosProyectados.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl sm:text-2xl font-bold text-slate-900">
            Proyeccion de Cuotas (12 meses)
          </h2>
          <ProyeccionCuotasTabla
            movimientos={movimientosProyectados}
            onCuotaClick={handleSeleccionarCuota}
          />
          <p className="mt-2 text-xs text-slate-600">
            Usa el boton "Ajustar" de cada cuota para modificarla o recalcular el saldo pendiente.
          </p>
        </section>
      )}

      <CuotaEditModal
        key={cuotaSeleccionada?.id ?? "sin-cuota"}
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

