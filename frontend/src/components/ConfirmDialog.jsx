// src/components/ConfirmDialog.jsx — Accessible Action Confirmation Dialog (Medical Blue & White)
import React from 'react';
import Modal from './Modal';
import Button from './Button';

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
        <p className="text-sm text-[#4B5D6B] leading-relaxed">{message}</p>
        <div className="flex justify-end gap-3 pt-3 border-t border-[#DFE6EE]">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            size="sm"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
