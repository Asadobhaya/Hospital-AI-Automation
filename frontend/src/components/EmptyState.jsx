// src/components/EmptyState.jsx — Accessible Medical Blue & White Empty State
import React from 'react';
import { Inbox } from 'lucide-react';
import Button from './Button';

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'No records found',
  message = 'There is currently no data matching this view.',
  actionLabel = '',
  onAction = null,
  actionIcon = null,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-12 h-12 rounded-xl bg-[#E7F1FB] border border-[#2F78C8]/25 flex items-center justify-center mb-3 text-[#2F78C8] shadow-2xs">
        <Icon className="w-6 h-6 text-[#2F78C8]" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-[#172B3A] tracking-tight mb-1">{title}</h3>
      <p className="text-sm text-[#617181] max-w-sm mb-4 leading-relaxed">{message}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction} icon={actionIcon}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
