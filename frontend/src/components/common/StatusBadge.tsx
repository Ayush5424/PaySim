import React from 'react';
import { TransactionStatus } from '../../types/transaction';

interface StatusBadgeProps {
  status: TransactionStatus | string;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showDot = true,
}) => {
  const normalized = (status || 'INITIATED').toUpperCase();

  let colorClasses = 'bg-slate-800 text-slate-300 border-slate-700';
  let dotColor = 'bg-slate-400';
  let pulse = false;

  switch (normalized) {
    case 'SUCCESS':
      colorClasses = 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60 dark:bg-emerald-950/40';
      dotColor = 'bg-emerald-400';
      break;
    case 'PROCESSING':
      colorClasses = 'bg-sky-950/60 text-sky-400 border-sky-800/60 dark:bg-sky-950/40';
      dotColor = 'bg-sky-400';
      pulse = true;
      break;
    case 'INITIATED':
    case 'PENDING':
      colorClasses = 'bg-amber-950/60 text-amber-400 border-amber-800/60 dark:bg-amber-950/40';
      dotColor = 'bg-amber-400';
      pulse = true;
      break;
    case 'FAILED':
      colorClasses = 'bg-rose-950/60 text-rose-400 border-rose-800/60 dark:bg-rose-950/40';
      dotColor = 'bg-rose-400';
      break;
    default:
      colorClasses = 'bg-slate-800 text-slate-400 border-slate-700';
      dotColor = 'bg-slate-400';
  }

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1.5 font-medium',
    md: 'text-xs px-2.5 py-1 gap-2 font-medium',
    lg: 'text-sm px-3.5 py-1.5 gap-2.5 font-semibold',
  }[size];

  const dotSize = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border tracking-wide font-mono uppercase ${colorClasses} ${sizeClasses}`}
    >
      {showDot && (
        <span className="relative flex">
          {pulse && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColor}`}
            />
          )}
          <span className={`relative inline-flex rounded-full ${dotSize} ${dotColor}`} />
        </span>
      )}
      {normalized}
    </span>
  );
};
