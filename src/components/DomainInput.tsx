import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShieldCheck } from 'lucide-react';
import { normalizeDomain } from '@/services/api';
import { useSession } from '@/components/ui/Session';
import { cn } from '@/lib/cn';

export function DomainInput({ variant = 'hero', large }: { variant?: 'hero' | 'inline'; large?: boolean }) {
  const [value, setValue] = useState('');
  const [authorized, setAuthorized] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setPendingDomain, setPendingPackage, setPendingScanScope, setPendingDeepScan } = useSession();
  const navigate = useNavigate();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const normalized = normalizeDomain(value);
    if (!normalized) {
      setError('Enter a valid domain name like yourdomain.com. IP addresses are not allowed.');
      return;
    }
    if (!authorized || !acceptedTerms) {
      setError('Confirm authorization and accept the responsible-use terms to begin the free scan.');
      return;
    }

    setError(null);
    setPendingDomain(normalized);
    setPendingPackage('free');
    setPendingScanScope({ network: true, database: true });
    setPendingDeepScan(false);
    sessionStorage.setItem('pentor-free-scan-consent', JSON.stringify({
      domain: normalized,
      authorized: true,
      acceptedTerms: true,
      termsVersion: '1.0',
      acceptedAt: new Date().toISOString(),
    }));
    navigate('/scan');
  };

  return (
    <form onSubmit={handleSubmit} className="w-full" noValidate>
      <div className={cn('flex flex-col sm:flex-row gap-2.5', variant === 'hero' && 'items-stretch')}>
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

      <div className="mt-3 space-y-2.5 rounded-lg border border-ink-700/60 bg-ink-900/35 p-3.5">
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={authorized}
            onChange={(e) => {
              setAuthorized(e.target.checked);
              if (error) setError(null);
            }}
            className="mt-0.5 w-4 h-4 rounded border-ink-600 bg-ink-900 text-accent-500 focus:ring-accent-500/40"
          />
          <span className="text-xs leading-relaxed text-gray-400">I own this domain or have explicit authorization to perform a safe security scan.</span>
        </label>
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => {
              setAcceptedTerms(e.target.checked);
              if (error) setError(null);
            }}
            className="mt-0.5 w-4 h-4 rounded border-ink-600 bg-ink-900 text-accent-500 focus:ring-accent-500/40"
          />
          <span className="text-xs leading-relaxed text-gray-400">
            I accept the <Link to="/terms" className="text-accent-400 hover:underline">Terms</Link> and{' '}
            <Link to="/responsible-use" className="text-accent-400 hover:underline">Responsible Use Policy</Link>.
          </span>
        </label>
      </div>

      {error && <p className="mt-2 text-sm text-danger-400" role="alert">{error}</p>}
      <div className="mt-3 flex items-start gap-2 text-xs text-gray-500">
        <ShieldCheck className="w-3.5 h-3.5 mt-0.5 shrink-0 text-accent-500/70" />
        <span>No email verification. Safe Free Scan starts immediately after authorization confirmation.</span>
      </div>
    </form>
  );
}
