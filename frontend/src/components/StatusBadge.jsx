import { clsx } from 'clsx';

const statusConfig = {
  confirmed: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500', label: 'Confirmed' },
  completed: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', label: 'Completed' },
  cancelled: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', label: 'Cancelled' },
  missed: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500', label: 'Missed' },
  reschedule_pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500', label: 'Reschedule Pending' },
  pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500', label: 'Pending' },
  scheduled: { bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-500', label: 'Scheduled' },
  // Call/message statuses
  success: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500', label: 'Success' },
  failed: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', label: 'Failed' },
  delivered: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500', label: 'Delivered' },
  sent: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', label: 'Sent' },
  read: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500', label: 'Read' },
  queued: { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-500', label: 'Queued' },
  in_progress: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', label: 'In Progress' },
  connected: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500', label: 'Connected' },
  disconnected: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', label: 'Disconnected' },
  active: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500', label: 'Active' },
  expired: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', label: 'Expired' },
  revoked: { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-500', label: 'Revoked' },
  critical: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', label: 'Critical' },
  normal: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500', label: 'Normal' },
};

export default function StatusBadge({ status, className }) {
  const key = status?.toLowerCase()?.replace(/\s+/g, '_');
  const config = statusConfig[key] || {
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    dot: 'bg-gray-500',
    label: status || 'Unknown',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
        config.bg,
        config.text,
        className
      )}
    >
      <span className={clsx('w-1.5 h-1.5 rounded-full', config.dot)} />
      {config.label}
    </span>
  );
}
