import { useState } from 'react'
import { ArrowRightLeft } from 'lucide-react'
import { useTransferirFondos } from '../hooks'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import Input from '../../../components/ui/Input'

/**
 * Modal de transferencia entre fondos.
 * Si isAutoAsign=true, preselectiona fondos de ahorro/inversión como destino.
 */
export default function TransferenciaFondosModal({
  isOpen,
  onClose,
  periodoId,
  fondos,
  _dineroSinAsignar,
  _isAutoAsign,
  onSuccess,
}) {
  const [origenId, setOrigenId] = useState('')
  const [destinoId, setDestinoId] = useState('')
  const [monto, setMonto] = useState('')
  const [motivo, setMotivo] = useState('')

  const transferir = useTransferirFondos()

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!origenId || !destinoId || !monto) {
      alert('Completa todos los campos')
      return
    }

    if (origenId === destinoId) {
      alert('Origen y destino no pueden ser el mismo fondo')
      return
    }

    try {
      await transferir.mutateAsync({
        periodo_id: periodoId,
        origen_id: origenId,
        destino_id: destinoId,
        monto: parseFloat(monto),
        motivo: motivo || 'Reasignación de fondos',
      })

      // Reset
      setOrigenId('')
      setDestinoId('')
      setMonto('')
      setMotivo('')
      onSuccess?.()
    } catch (error) {
      console.error('Error al transferir:', error)
      alert('Error: ' + error.message)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Transferir Entre Fondos">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Fondo Origen */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fondo Origen
          </label>
          <select
            value={origenId}
            onChange={(e) => setOrigenId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">Seleccionar...</option>
            {fondos?.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nombre} (${f.monto_presupuestado?.toLocaleString('es-AR') || 0})
              </option>
            ))}
          </select>
        </div>

        {/* Icono de transferencia */}
        <div className="flex justify-center">
          <ArrowRightLeft className="w-5 h-5 text-gray-400" />
        </div>

        {/* Fondo Destino */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fondo Destino
          </label>
          <select
            value={destinoId}
            onChange={(e) => setDestinoId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">Seleccionar...</option>
            {fondos?.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nombre} (${f.monto_presupuestado?.toLocaleString('es-AR') || 0})
              </option>
            ))}
          </select>
        </div>

        {/* Monto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Monto
          </label>
          <Input
            type="number"
            min="0.01"
            step="0.01"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder="Ej: 50000"
            className="w-full"
          />
        </div>

        {/* Motivo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Motivo (opcional)
          </label>
          <Input
            type="text"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej: Reasignación por ahorro excedente"
            className="w-full"
          />
        </div>

        {/* Botones */}
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={transferir.isPending}
            isLoading={transferir.isPending}
          >
            Transferir
          </Button>
        </div>
      </form>
    </Modal>
  )
}
