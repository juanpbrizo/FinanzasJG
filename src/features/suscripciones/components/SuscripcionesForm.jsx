import { useState } from 'react'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'

const FRECUENCIAS = ['MENSUAL', 'BIMESTRAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL']

/**
 * SuscripcionesForm: Formulario para crear/editar suscripciones.
 */
export default function SuscripcionesForm({
  tarjetas,
  categorias,
  suscripcionInicial,
  onSubmit,
  isLoading,
}) {
  const [nombre, setNombre] = useState(suscripcionInicial?.nombre || '')
  const [monto, setMonto] = useState(suscripcionInicial?.monto || '')
  const [tarjetaId, setTarjetaId] = useState(suscripcionInicial?.tarjeta_id || '')
  const [categoriaId, setCategoriaId] = useState(suscripcionInicial?.categoria_plantilla_id || '')
  const [frecuencia, setFrecuencia] = useState(suscripcionInicial?.frecuencia || 'MENSUAL')
  const [mesCobro, setMesCobro] = useState(suscripcionInicial?.mes_cobro_anual || '')
  const [diaVencimiento, setDiaVencimiento] = useState(suscripcionInicial?.dia_vencimiento || '1')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!nombre.trim()) {
      setError('El nombre de la suscripción es obligatorio')
      return
    }

    if (!monto || parseFloat(monto) <= 0) {
      setError('El monto debe ser mayor a 0')
      return
    }

    if (!tarjetaId) {
      setError('Seleccioná una tarjeta')
      return
    }

    if (!frecuencia || !FRECUENCIAS.includes(frecuencia)) {
      setError('Frecuencia inválida')
      return
    }

    if (frecuencia === 'ANUAL' && (!mesCobro || mesCobro < 1 || mesCobro > 12)) {
      setError('Las suscripciones anuales requieren un mes de cobro (1-12)')
      return
    }

    if (!diaVencimiento || diaVencimiento < 1 || diaVencimiento > 31) {
      setError('El día de vencimiento debe ser un número entre 1 y 31')
      return
    }

    try {
      const payload = {
        nombre: nombre.trim(),
        monto: parseFloat(monto),
        tarjeta_id: tarjetaId,
        categoria_plantilla_id: categoriaId ? categoriaId : null,
        frecuencia,
        mes_cobro_anual: frecuencia === 'ANUAL' ? parseInt(mesCobro, 10) : null,
        dia_vencimiento: parseInt(diaVencimiento, 10),
      }

      await onSubmit(suscripcionInicial?.id ? { suscripcionId: suscripcionInicial.id, payload } : payload)

      // Limpia el formulario si es creación
      if (!suscripcionInicial) {
        setNombre('')
        setMonto('')
        setTarjetaId('')
        setCategoriaId('')
        setFrecuencia('MENSUAL')
        setMesCobro('')
        setDiaVencimiento('1')
      }
    } catch (err) {
      setError(err?.message || 'Error al guardar la suscripción')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
      <div>
        <label className="block text-sm font-medium text-slate-900">Nombre del servicio</label>
        <Input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Netflix, Spotify, etc"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-900">Monto ($)</label>
          <Input
            type="number"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder="10000"
            step="0.01"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-900">Día de vencimiento</label>
          <Input
            type="number"
            value={diaVencimiento}
            onChange={(e) => setDiaVencimiento(e.target.value)}
            min="1"
            max="31"
            placeholder="1"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-900">Tarjeta</label>
        <select
          value={tarjetaId}
          onChange={(e) => setTarjetaId(e.target.value)}
          className="mt-1 block w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-500 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
        >
          <option value="">Selecciona una tarjeta</option>
          {tarjetas?.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-900">Frecuencia</label>
          <select
            value={frecuencia}
            onChange={(e) => setFrecuencia(e.target.value)}
            className="mt-1 block w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            {FRECUENCIAS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        {frecuencia === 'ANUAL' && (
          <div>
            <label className="block text-sm font-medium text-slate-900">Mes de cobro</label>
            <Input
              type="number"
              value={mesCobro}
              onChange={(e) => setMesCobro(e.target.value)}
              min="1"
              max="12"
              placeholder="6"
            />
          </div>
        )}
      </div>

      {categorias && categorias.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-slate-900">
            Categoría (opcional)
          </label>
          <select
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            className="mt-1 block w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-500 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="">Sin categoría (será asignada automáticamente)</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} ({c.fondo_nombre})
              </option>
            ))}
          </select>
        </div>
      )}

      {error && <div className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</div>}

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading
          ? suscripcionInicial
            ? 'Actualizando...'
            : 'Creando...'
          : suscripcionInicial
            ? 'Actualizar suscripción'
            : 'Crear suscripción'}
      </Button>
    </form>
  )
}
