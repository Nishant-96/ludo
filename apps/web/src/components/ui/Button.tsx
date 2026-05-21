import { type FC, type ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const VARIANT_CLASSES = {
  primary:   'bg-primary hover:bg-primary-light active:bg-primary-dark text-white shadow-glow-sm hover:shadow-glow disabled:bg-primary/40 disabled:shadow-none',
  secondary: 'bg-surface-3 text-white hover:bg-surface-3/80 border border-border disabled:opacity-40',
  danger:    'bg-red-700 text-white hover:bg-red-600 active:bg-red-800 disabled:bg-red-900/50',
  ghost:     'bg-transparent text-slate-300 hover:bg-surface-2 hover:text-white disabled:opacity-40',
  success:   'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white disabled:bg-emerald-900/50',
} as const;

const SIZE_CLASSES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
} as const;

export const Button: FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  children,
  className = '',
  ...props
}) => (
  <button
    disabled={disabled ?? isLoading}
    className={`
      inline-flex items-center justify-center gap-2 rounded-xl font-semibold
      transition-all duration-150 focus-visible:outline-none focus-visible:ring-2
      focus-visible:ring-primary/70 disabled:cursor-not-allowed disabled:opacity-50
      ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}
    `}
    {...props}
  >
    {isLoading && (
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
    )}
    {children}
  </button>
);
