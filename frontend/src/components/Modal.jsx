// src/components/Modal.jsx — Production Accessible Modal Dialog (Medical Blue & White)
import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function Modal({
  open,
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  description = '',
}) {
  const overlayRef = useRef(null);
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);
  const show = open !== undefined ? open : isOpen;

  // Track and restore focus
  useEffect(() => {
    if (show) {
      previousActiveElement.current = document.activeElement;
      document.body.style.overflow = 'hidden';

      // Focus first focusable element inside modal after paint
      setTimeout(() => {
        if (modalRef.current) {
          const focusable = modalRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length > 0) {
            focusable[0].focus();
          }
        }
      }, 50);
    } else {
      document.body.style.overflow = '';
      if (previousActiveElement.current && typeof previousActiveElement.current.focus === 'function') {
        previousActiveElement.current.focus();
      }
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [show]);

  // Escape key and tab key trapping
  useEffect(() => {
    if (!show) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }

      // Trap focus
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            last.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === last) {
            first.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [show, onClose]);

  if (!show) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  const selectedSize = sizeClasses[size] || sizeClasses.md;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#172B3A]/50 backdrop-blur-2xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      role="presentation"
    >
      <div
        ref={modalRef}
        className={`bg-white border border-[#DFE6EE] rounded-xl shadow-xl w-full ${selectedSize} max-h-[90vh] flex flex-col overflow-hidden text-[#4B5D6B] transform transition-all`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={description ? 'modal-desc' : undefined}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DFE6EE] bg-white">
          <div>
            <h2 id="modal-title" className="text-lg font-semibold text-[#172B3A] tracking-tight">
              {title}
            </h2>
            {description && (
              <p id="modal-desc" className="text-xs text-[#617181] mt-0.5">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#617181] hover:text-[#172B3A] rounded-lg hover:bg-[#EDF4FB] transition cursor-pointer focus-visible:ring-2 focus-visible:ring-[#175DB5]"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 bg-white">{children}</div>
      </div>
    </div>
  );
}
