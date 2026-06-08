import { Modal } from './Modal.jsx';
import { Button } from './Button.jsx';

export function ConfirmDialog({ open, title = 'Confirmer', message, onCancel, onConfirm, isLoading }) {
  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel}>Annuler</Button>
        <Button type="button" variant="danger" onClick={onConfirm} isLoading={isLoading}>Confirmer</Button>
      </div>
    </Modal>
  );
}
