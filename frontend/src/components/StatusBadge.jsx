// src/components/StatusBadge.jsx — High-Contrast Accessible Clinical Status Badge
import React from 'react';
import { clsx } from 'clsx';

const statusConfig = {
  confirmed: {
    bg: 'bg-emerald-950/60 border-emerald-500/30',
    text: 'text-emerald-400',
    dot: 'bg-emerald-400',
    label: 'Confirmed',
  },
  completed: {
    bg: 'bg-sky-950/60 border-sky-500/30',
    text: 'text-sky-400',
    dot: 'bg-sky-400',
    label: 'Completed',
  },
  cancelled: {
    bg: 'bg-rose-950/60 border-rose-500/30',
    text: 'text-rose-400',
    dot: 'bg-rose-400',
    label: 'Cancelled',
  },
  missed: {
    bg: 'bg-amber-950/60 border-amber-500/30',
    text: 'text-amber-400',
    dot: 'bg-amber-400',
    label: 'Missed',
  },
  reschedule_pending: {
    bg: 'bg-amber-950/60 border-amber-500/30',
    text: 'text-amber-400',
    dot: 'bg-amber-400',
    label: 'Reschedule Pending',
  },
  reschedule_requested: {
    bg: 'bg-amber-950/60 border-amber-500/30',
    text: 'text-amber-400',
    dot: 'bg-amber-400',
    label: 'Reschedule Requested',
  },
  pending: {
    bg: 'bg-slate-800/80 border-slate-700/60',
    text: 'text-slate-300',
    dot: 'bg-slate-400',
    label: 'Pending',
  },
  scheduled: {
    bg: 'bg-indigo-950/60 border-indigo-500/30',
    text: 'text-indigo-400',
    dot: 'bg-indigo-400',
    label: 'Scheduled',
  },
  success: {
    bg: 'bg-emerald-950/60 border-emerald-500/30',
    text: 'text-emerald-400',
    dot: 'bg-emerald-400',
    label: 'Success',
  },
  failed: {
    bg: 'bg-rose-950/60 border-rose-500/30',
    text: 'text-rose-400',
    dot: 'bg-rose-400',
    label: 'Failed',
  },
  no_answer: {
    bg: 'bg-slate-800/80 border-slate-700/50',
    text: 'text-slate-400',
    dot: 'bg-slate-500',
    label: 'No Answer',
  },
  delivered: {
    bg: 'bg-emerald-950/60 border-emerald-500/30',
    text: 'text-emerald-400',
    dot: 'bg-emerald-400',
    label: 'Delivered',
  },
  sent: {
    bg: 'bg-sky-950/60 border-sky-500/30',
    text: 'text-sky-400',
    dot: 'bg-sky-400',
    label: 'Sent',
  },
  read: {
    bg: 'bg-teal-950/60 border-teal-500/30',
    text: 'text-teal-300',
    dot: 'bg-teal-400',
    label: 'Read',
  },
  queued: {
    bg: 'bg-slate-800/70 border-slate-700/50',
    text: 'text-slate-300',
    dot: 'bg-slate-400',
    label: 'Queued',
  },
  in_progress: {
    bg: 'bg-blue-950/60 border-blue-500/30',
    text: 'text-blue-400',
    dot: 'bg-blue-400 animate-pulse',
    label: 'In Progress',
  },
  active: {
    bg: 'bg-emerald-950/60 border-emerald-500/30',
    text: 'text-emerald-400',
    dot: 'bg-emerald-400',
    label: 'Active',
  },
  expired: {
    bg: 'bg-rose-950/60 border-rose-500/30',
    text: 'text-rose-400',
    dot: 'bg-rose-400',
    label: 'Expired',
  },
  revoked: {
    bg: 'bg-slate-800/80 border-slate-700/50',
    text: 'text-slate-400',
    dot: 'bg-slate-500',
    label: 'Revoked',
  },
  critical: {
    bg: 'bg-red-950/70 border-red-500/40',
    text: 'text-red-300 font-semibold',
    dot: 'bg-red-400 animate-pulse',
    label: 'Critical',
  },
  normal: {
    bg: 'bg-slate-800/60 border-slate-700/50',
    text: 'text-slate-300',
    dot: 'bg-slate-400',
    label: 'Normal',
  },
};

export default function StatusBadge({ status, className = '' }) {
  const key = status?.toLowerCase()?.replace(/[\s-]+/g, '_');
  const config = statusConfig[key] || {
    bg: 'bg-slate-800/80 border-slate-700/50',
    text: 'text-slate-300',
    dot: 'bg-slate-400',
    label: status || 'Unknown',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border tracking-wide select-none',
        config.bg,
        config.text,
        className
      )}
    >
      <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', config.dot)} aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
}
