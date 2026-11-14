import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function Modal({ open, isOpen, onClose, title, children, size = 'md' }) {
  const overlayRef = useRef(null);
  const show = open !== undefined ? open : isOpen;

  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [show]);

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    if (show) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [show, onClose]);

  if (!show) return null;

  const sizeClass = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }[size] || 'max-w-lg';

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        className={`bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full ${sizeClass} max-h-[90vh] flex flex-col overflow-hidden text-slate-100`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <h2 className="text-lg font-semibold text-white tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 bg-slate-900/90">{children}</div>
      </div>
    </div>
  );
}
