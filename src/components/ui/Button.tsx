import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from 'react';
import { Link } from 'react-router-dom';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg';

const variants: Record<Variant, string> = {
  primary:
    'bg-accent-500 text-ink-950 hover:bg-accent-400 font-semibold shadow-glow-accent hover:shadow-glow-accent',
  secondary: 'bg-ink-700 text-gray-100 hover:bg-ink-600 border border-ink-600/80',
  ghost: 'text-gray-300 hover:text-white hover:bg-ink-800/70',
  outline: 'border border-accent-500/60 text-accent-400 hover:bg-accent-500/10',
  danger: 'bg-danger-600 text-white hover:bg-danger-500 font-semibold',
};

const sizes: Record<Size, string> = {
  sm: 'px-3.5 py-2 text-xs rounded-lg',
  md: 'px-5 py-2.5 text-sm rounded-lg',
  lg: 'px-6 py-3.5 text-base rounded-xl',
};

interface BaseProps {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  className?: string;
  loading?: boolean;
}

type ButtonProps = BaseProps & ButtonHTMLAttributes<HTMLButtonElement>;
type LinkButtonProps = BaseProps & { to: string; onClick?: () => void };

const base = 'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap';

export function Button({ variant = 'primary', size = 'md', className = '', loading, children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin-slow" />
      )}
      {children}
    </button>
  );
}

export const LinkButton = forwardRef<HTMLAnchorElement, LinkButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, ...rest }, ref) => (
    <Link ref={ref} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...rest}>
      {children}
    </Link>
  ),
);
LinkButton.displayName = 'LinkButton';
