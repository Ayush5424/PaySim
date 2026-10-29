import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: {
    text: string;
    variant?: 'emerald' | 'sky' | 'amber' | 'rose' | 'neutral';
  };
  className?: string;
  action?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  badge,
  className = '',
  action,
}) => {
  const badgeStyles = {
    emerald: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60',
    sky: 'bg-sky-950/60 text-sky-400 border-sky-800/60',
    amber: 'bg-amber-950/60 text-amber-400 border-amber-800/60',
    rose: 'bg-rose-950/60 text-rose-400 border-rose-800/60',
    neutral: 'bg-slate-800 text-slate-300 border-slate-700',
  }[badge?.variant || 'neutral'];

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-md p-5 transition-all hover:border-slate-700 hover:shadow-lg ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
          {title}
        </span>
        {icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700/50">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <div className="text-2xl font-bold tracking-tight text-white font-mono">
          {value}
        </div>
        {badge && (
          <span
            className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${badgeStyles}`}
          >
            {badge.text}
          </span>
        )}
      </div>

      {(subtitle || action) && (
        <div className="mt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/50 pt-2">
          {subtitle && <span>{subtitle}</span>}
          {action && <div>{action}</div>}
        </div>
      )}
    </div>
  );
};
