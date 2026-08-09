import Modal from '../../../components/ui/Modal'
import TarjetaForm from '../../tarjetas/components/TarjetaForm'

/**
 * CreateTarjetaModal: Modal emergente para crear/editar tarjeta de crédito.
 */
export default function CreateTarjetaModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  tarjetaInicial,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={tarjetaInicial ? 'Editar Tarjeta' : 'Crear Nueva Tarjeta'}
    >
      <TarjetaForm
        tarjetaInicial={tarjetaInicial}
        onSubmit={async (data) => {
          await onSubmit(data)
          onClose()
        }}
        onCancel={onClose}
        isLoading={isLoading}
      />
    </Modal>
  )
}
