import { type FC, type ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const VARIANT_CLASSES = {
  primary:   'bg-indigo-600 text-white hover:bg-indigo-500 disabled:bg-indigo-800',
  secondary: 'bg-slate-700 text-white hover:bg-slate-600 disabled:bg-slate-800',
  danger:    'bg-red-700 text-white hover:bg-red-600 disabled:bg-red-900',
  ghost:     'bg-transparent text-slate-300 hover:bg-slate-800 disabled:opacity-40',
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
      inline-flex items-center justify-center gap-2 rounded-xl font-medium
      transition-colors focus-visible:outline-none focus-visible:ring-2
      focus-visible:ring-indigo-500 disabled:cursor-not-allowed
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
