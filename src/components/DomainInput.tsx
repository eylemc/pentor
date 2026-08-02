import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Lock } from 'lucide-react';
import { normalizeDomain } from '@/services/api';
import { useSession } from '@/components/ui/Session';
import { cn } from '@/lib/cn';

export function DomainInput({ variant = 'hero', large }: { variant?: 'hero' | 'inline'; large?: boolean }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { setPendingDomain, setPendingPackage } = useSession();
  const navigate = useNavigate();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const normalized = normalizeDomain(value);
    if (!normalized) {
      setError('Enter a valid domain name like yourdomain.com. IP addresses are not allowed.');
      return;
    }
    setError(null);
    setPendingDomain(normalized);
    setPendingPackage('free');
    navigate('/verify');
  };

  return (
    <form onSubmit={handleSubmit} className="w-full" noValidate>
      <div
        className={cn(
          'flex flex-col sm:flex-row gap-2.5',
          variant === 'hero' && 'items-stretch',
        )}
      >
        <div className="relative flex-1">
          <div className="absolute left-0 top-0 bottom-0 flex items-center pl-4 text-sm font-mono text-gray-500 pointer-events-none select-none">
            https://
          </div>
          <input
            type="text"
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError(null);
            }}
            placeholder="yourdomain.com"
            aria-label="Domain to test"
            aria-invalid={!!error}
            className={cn(
              'input-base font-mono pl-[4.5rem]',
              large && 'py-3.5 text-base',
              error && 'border-danger-500/60 focus:border-danger-500/70 focus:ring-danger-500/30',
            )}
          />
        </div>
        <button
          type="submit"
          className={cn(
            'inline-flex items-center justify-center gap-2 font-semibold rounded-lg bg-accent-500 text-ink-950 hover:bg-accent-400 transition-all shadow-glow-accent whitespace-nowrap',
            large ? 'px-6 py-3.5 text-base' : 'px-5 py-2.5 text-sm',
          )}
        >
          <Search className="w-4 h-4" />
          Run Free Test
        </button>
      </div>
      {error && (
        <p className="mt-2 text-sm text-danger-400" role="alert">
          {error}
        </p>
      )}
      <div className="mt-3 flex items-start gap-2 text-xs text-gray-500">
        <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0 text-accent-500/70" />
        <span>Authorization verification is required before testing.</span>
      </div>
    </form>
  );
}
