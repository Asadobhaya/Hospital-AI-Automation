// src/components/ErrorState.jsx — Accessible Dark Surface Error State
import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import Button from './Button';

export default function ErrorState({
  title = 'Failed to load data',
  message = 'An unexpected network error occurred while communicating with the hospital backend.',
  onRetry = null,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-rose-950/50 border border-rose-500/30 flex items-center justify-center mb-4 text-rose-400">
        <AlertCircle className="w-7 h-7" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-rose-200 tracking-tight mb-1">{title}</h3>
      <p className="text-sm text-slate-400 max-w-md mb-5 leading-relaxed">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} icon={RotateCcw}>
          Retry Request
        </Button>
      )}
    </div>
  );
}
