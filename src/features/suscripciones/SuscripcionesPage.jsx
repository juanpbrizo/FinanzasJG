import { useMemo, useState } from 'react'
import Spinner from '../../components/ui/Spinner'
import SuscripcionesForm from './components/SuscripcionesForm'
import SuscripcionesList from './components/SuscripcionesList'
import {
  useSuscripciones,
  useCrearSuscripcion,
  useActualizarSuscripcion,
  useDesactivarSuscripcion,
  useEliminarSuscripcion,
} from './hooks'
import { useTarjetas } from '../tarjetas/hooks'
import { useFondosPlantilla } from '../presupuesto/hooks'

/**
 * SuscripcionesPage: Gestión de suscripciones recurrentes.
 */
export default function SuscripcionesPage() {
  const [suscripcionEnEdicion, setSuscripcionEnEdicion] = useState(null)

  // Queries
  const { data: suscripciones, isLoading: suscripcionesLoading } = useSuscripciones()
  const { data: tarjetas } = useTarjetas()
  const { data: fondosPlantilla } = useFondosPlantilla()

  // Mutations
  const crearSuscripcion = useCrearSuscripcion()
  const actualizarSuscripcion = useActualizarSuscripcion()
  const desactivarSuscripcion = useDesactivarSuscripcion()
  const eliminarSuscripcion = useEliminarSuscripcion()

  // Extrae categorías de fondos plantilla
  const categorias = fondosPlantilla
    ? fondosPlantilla.flatMap((fondo) =>
        fondo.categorias_plantilla ? fondo.categorias_plantilla.map((c) => ({ ...c, fondo_nombre: fondo.nombre })) : []
      )
    : []

  const handleCrearSuscripcion = async (payload) => {
    await crearSuscripcion.mutateAsync(payload)
  }

  const handleEditarSuscripcion = (suscripcion) => {
    setSuscripcionEnEdicion(suscripcion)
  }

  const handleActualizarSuscripcion = async (payload) => {
    await actualizarSuscripcion.mutateAsync({
      suscripcionId: suscripcionEnEdicion.id,
      payload,
    })
    setSuscripcionEnEdicion(null)
  }

  const handleDesactivarSuscripcion = async (suscripcionId) => {
    if (confirm('¿Desactivar esta suscripción?')) {
      await desactivarSuscripcion.mutateAsync(suscripcionId)
    }
  }

  const handleEliminarSuscripcion = async (suscripcionId) => {
    if (confirm('¿Eliminar esta suscripción? No se puede deshacer.')) {
      await eliminarSuscripcion.mutateAsync(suscripcionId)
    }
  }

  // Calcula total de comprometido por suscripciones activas
  const totalSuscripciones = useMemo(
    () =>
      (suscripciones || [])
        .filter((s) => s.activa)
        .reduce((sum, s) => sum + Number(s.monto || 0), 0),
    [suscripciones],
  )

  if (suscripcionesLoading) return <Spinner />

  return (
    <div className="space-y-8">
      {/* Sección: Resumen */}
      {(suscripciones || []).filter((s) => s.activa).length > 0 && (
        <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h2 className="text-lg font-semibold text-slate-900">Resumen de Suscripciones</h2>
          <div className="mt-2 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-600">Suscripciones activas</p>
              <p className="text-2xl font-bold text-slate-900">
                {(suscripciones || []).filter((s) => s.activa).length}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-600">Gasto mensual comprometido</p>
              <p className="text-2xl font-bold text-slate-900">
                {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(totalSuscripciones)}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Sección: Gestión */}
      <section>
        <h2 className="mb-4 text-2xl font-bold text-slate-900">
          {suscripcionEnEdicion ? 'Editar suscripción' : 'Crear suscripción recurrente'}
        </h2>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Formulario */}
          <div>
            <SuscripcionesForm
              tarjetas={tarjetas}
              categorias={categorias}
              suscripcionInicial={suscripcionEnEdicion}
              onSubmit={suscripcionEnEdicion ? handleActualizarSuscripcion : handleCrearSuscripcion}
              isLoading={
                crearSuscripcion.isPending ||
                actualizarSuscripcion.isPending
              }
            />
            {suscripcionEnEdicion && (
              <button
                onClick={() => setSuscripcionEnEdicion(null)}
                className="mt-2 w-full px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded"
              >
                Cancelar edición
              </button>
            )}
          </div>

          {/* Lista */}
          <div>
            <h3 className="mb-3 text-lg font-semibold text-slate-900">Suscripciones registradas</h3>
            <SuscripcionesList
              suscripciones={suscripciones}
              tarjetas={tarjetas}
              categorias={categorias}
              onEdit={handleEditarSuscripcion}
              onDesactivar={handleDesactivarSuscripcion}
              onEliminar={handleEliminarSuscripcion}
              isLoading={
                desactivarSuscripcion.isPending ||
                eliminarSuscripcion.isPending
              }
            />
          </div>
        </div>
      </section>
    </div>
  )
}
