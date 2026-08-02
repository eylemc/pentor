import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';

export function Logo({ className, onClick }: { className?: string; onClick?: () => void }) {
  return (
    <Link to="/" onClick={onClick} className={cn('inline-flex items-center gap-2.5 group', className)} aria-label="Pentor home">
      <span className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-ink-800 border border-accent-500/30 shadow-glow-accent transition-transform group-hover:scale-105">
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-accent-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5l8-3z" />
          <circle cx="12" cy="11" r="3" />
          <path d="M12 8v6M9.5 9.5l5 3M14.5 9.5l-5 3" opacity="0.5" />
        </svg>
      </span>
      <span className="text-xl font-bold tracking-tight text-gray-100 uppercase">Pentor</span>
    </Link>
  );
}
