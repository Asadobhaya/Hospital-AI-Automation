// src/components/ErrorState.jsx — Accessible Medical Blue & White Error State
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
      <div className="w-12 h-12 rounded-xl bg-[#FDECEC] border border-[#B42318]/25 flex items-center justify-center mb-3 text-[#B42318]">
        <AlertCircle className="w-6 h-6 text-[#B42318]" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-[#B42318] tracking-tight mb-1">{title}</h3>
      <p className="text-sm text-[#617181] max-w-md mb-4 leading-relaxed">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} icon={RotateCcw}>
          Retry Request
        </Button>
      )}
    </div>
  );
}
