import Modal from '../../../components/ui/Modal'
import CompraCuotasForm from './CompraCuotasForm'

/**
 * CreateCompraTarjetaModal: Modal emergente para registrar compra en cuotas.
 */
export default function CreateCompraTarjetaModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  tarjetas,
  fondosPlantilla,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registrar Compra en Cuotas">
      <CompraCuotasForm
        tarjetas={tarjetas}
        fondosPlantilla={fondosPlantilla}
        onSubmit={async (data) => {
          await onSubmit(data)
          onClose()
        }}
        isLoading={isLoading}
      />
    </Modal>
  )
}
