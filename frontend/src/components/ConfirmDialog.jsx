import Modal from './Modal';

export default function ConfirmDialog({
  open,
  isOpen,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger = false,
  loading = false,
  onConfirm,
  onClose,
}) {
  return (
    <Modal open={open ?? isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        <p className="text-sm text-slate-300">{message}</p>
        <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm font-medium text-white rounded-xl transition disabled:opacity-50 cursor-pointer shadow-sm ${
              danger
                ? 'bg-red-600 hover:bg-red-500 shadow-red-600/20'
                : 'bg-primary-600 hover:bg-primary-500 shadow-primary-600/20'
            }`}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
