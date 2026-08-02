import { type ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface CardProps {
  children: ReactNode;
  className?: string;
  raised?: boolean;
}

export function Card({ children, className, raised }: CardProps) {
  return (
    <div className={cn(raised ? 'surface-raised' : 'surface', 'shadow-card', className)}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, icon }: { title: string; subtitle?: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 p-5 border-b border-ink-700/50">
      <div className="flex items-start gap-3">
        {icon && <div className="text-accent-400 shrink-0 mt-0.5">{icon}</div>}
        <div>
          <h3 className="text-base font-semibold text-gray-100">{title}</h3>
          {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('p-5', className)}>{children}</div>;
}
