import { type FC, type ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'host' | 'ready';
}

const VARIANT_CLASSES = {
  default: 'bg-surface-3 text-slate-300 border border-border',
  success: 'bg-emerald-900/50 text-emerald-400 border border-emerald-700/40',
  warning: 'bg-amber-900/50 text-amber-400 border border-amber-700/40',
  danger:  'bg-red-900/50 text-red-400 border border-red-700/40',
  info:    'bg-primary/20 text-violet-300 border border-primary/30',
  host:    'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  ready:   'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
} as const;

export const Badge: FC<BadgeProps> = ({ children, variant = 'default' }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${VARIANT_CLASSES[variant]}`}>
    {children}
  </span>
);
