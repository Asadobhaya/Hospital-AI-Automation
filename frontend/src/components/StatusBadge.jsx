// src/components/StatusBadge.jsx — Medical Blue & White Accessible Status Badge
import React from 'react';
import { clsx } from 'clsx';

const statusConfig = {
  confirmed: {
    bg: 'bg-[#E7F5EC] border-[#18794E]/20',
    text: 'text-[#18794E]',
    dot: 'bg-[#18794E]',
    label: 'Confirmed',
  },
  completed: {
    bg: 'bg-[#E7F0FF] border-[#2458A6]/20',
    text: 'text-[#2458A6]',
    dot: 'bg-[#2458A6]',
    label: 'Completed',
  },
  cancelled: {
    bg: 'bg-[#FDECEC] border-[#B42318]/20',
    text: 'text-[#B42318]',
    dot: 'bg-[#B42318]',
    label: 'Cancelled',
  },
  missed: {
    bg: 'bg-[#FFF2D8] border-[#8A4B08]/20',
    text: 'text-[#8A4B08]',
    dot: 'bg-[#8A4B08]',
    label: 'Missed',
  },
  reschedule_pending: {
    bg: 'bg-[#FFF2D8] border-[#8A4B08]/20',
    text: 'text-[#8A4B08]',
    dot: 'bg-[#8A4B08]',
    label: 'Reschedule Pending',
  },
  reschedule_requested: {
    bg: 'bg-[#FFF2D8] border-[#8A4B08]/20',
    text: 'text-[#8A4B08]',
    dot: 'bg-[#8A4B08]',
    label: 'Reschedule Requested',
  },
  pending: {
    bg: 'bg-[#F5F8FC] border-[#DFE6EE]',
    text: 'text-[#4B5D6B]',
    dot: 'bg-[#617181]',
    label: 'Pending',
  },
  scheduled: {
    bg: 'bg-[#E7F1FB] border-[#2F78C8]/25',
    text: 'text-[#173A5E]',
    dot: 'bg-[#2F78C8]',
    label: 'Scheduled',
  },
  success: {
    bg: 'bg-[#E7F5EC] border-[#18794E]/20',
    text: 'text-[#18794E]',
    dot: 'bg-[#18794E]',
    label: 'Success',
  },
  failed: {
    bg: 'bg-[#FDECEC] border-[#B42318]/20',
    text: 'text-[#B42318]',
    dot: 'bg-[#B42318]',
    label: 'Failed',
  },
  delivered: {
    bg: 'bg-[#E7F5EC] border-[#18794E]/20',
    text: 'text-[#18794E]',
    dot: 'bg-[#18794E]',
    label: 'Delivered',
  },
  received: {
    bg: 'bg-[#E7F0FF] border-[#2458A6]/20',
    text: 'text-[#2458A6]',
    dot: 'bg-[#2458A6]',
    label: 'Received',
  },
  queued: {
    bg: 'bg-[#FFF2D8] border-[#8A4B08]/20',
    text: 'text-[#8A4B08]',
    dot: 'bg-[#8A4B08]',
    label: 'Queued',
  },
  in_progress: {
    bg: 'bg-[#E7F0FF] border-[#2458A6]/20',
    text: 'text-[#2458A6]',
    dot: 'bg-[#2458A6]',
    label: 'In Progress',
  },
  resolved: {
    bg: 'bg-[#E7F5EC] border-[#18794E]/20',
    text: 'text-[#18794E]',
    dot: 'bg-[#18794E]',
    label: 'Resolved',
  },
  unresolved: {
    bg: 'bg-[#FDECEC] border-[#B42318]/20',
    text: 'text-[#B42318]',
    dot: 'bg-[#B42318]',
    label: 'Action Required',
  },
  urgent: {
    bg: 'bg-[#FDECEC] border-[#B42318]/30',
    text: 'text-[#B42318]',
    dot: 'bg-[#B42318]',
    label: 'Urgent',
  },
  critical: {
    bg: 'bg-[#FDECEC] border-[#B42318]/30',
    text: 'text-[#B42318]',
    dot: 'bg-[#B42318]',
    label: 'Critical Alert',
  },
  normal: {
    bg: 'bg-[#E7F5EC] border-[#18794E]/20',
    text: 'text-[#18794E]',
    dot: 'bg-[#18794E]',
    label: 'Normal',
  },
  active: {
    bg: 'bg-[#E7F5EC] border-[#18794E]/20',
    text: 'text-[#18794E]',
    dot: 'bg-[#18794E]',
    label: 'Active',
  },
  inactive: {
    bg: 'bg-[#F5F8FC] border-[#DFE6EE]',
    text: 'text-[#617181]',
    dot: 'bg-[#8898AA]',
    label: 'Inactive',
  },
};

export default function StatusBadge({ status, className = '' }) {
  if (!status) return null;

  const key = String(status).toLowerCase();
  const config = statusConfig[key] || {
    bg: 'bg-[#F5F8FC] border-[#DFE6EE]',
    text: 'text-[#4B5D6B]',
    dot: 'bg-[#617181]',
    label: status,
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border shadow-xs',
        config.bg,
        config.text,
        className
      )}
      role="status"
    >
      <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', config.dot)} aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
}
