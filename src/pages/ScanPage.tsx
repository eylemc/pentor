import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AlertCircle, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import { useSession } from '@/components/ui/Session';
import { api } from '@/services/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function ScanPage() {
  const { pendingDomain, pendingPackage, setScanId } = useSession();
  const navigate = useNavigate();
  const started = useRef(false);
  const [error, setError] = useState<string | null>(null);

  const testType = pendingPackage === 'advanced' ? 'Advanced Scan' : pendingPackage === 'pro' ? 'Pro Scan' : 'Free Scan';

  useEffect(() => {
    if (!pendingDomain || started.current) return;
    started.current = true;
    const isAdvanced = testType === 'Advanced Scan';
    api.startScan({
      domain: pendingDomain,
      testType,
      acceptedAdvancedRisk: isAdvanced,
      termsVersion: '1.0',
      acceptedAt: new Date().toISOString(),
    }).then((result) => {
      setScanId(result.scanId);
      navigate('/report', { replace: true });
    }).catch((err) => {
      setError(err instanceof Error ? err.message : 'Pentor could not start the scan.');
    });
  }, [navigate, pendingDomain, setScanId, testType]);

  if (!pendingDomain) return <Navigate to="/" replace />;

  return (
    <div className="py-20 px-4 sm:px-6 lg:px-8 max-w-xl mx-auto">
      <Card className="p-8 text-center">
        {error ? (
          <>
            <div className="w-12 h-12 mx-auto rounded-full border border-danger-500/30 bg-danger-500/10 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-danger-400" />
            </div>
            <h1 className="text-xl font-semibold text-gray-100">Scan could not start</h1>
            <p className="text-sm text-danger-300 mt-2 mb-6">{error}</p>
            <Button onClick={() => window.location.reload()} variant="secondary">
              <RefreshCw className="w-4 h-4" /> Retry scan
            </Button>
          </>
        ) : (
          <>
            <div className="relative w-14 h-14 mx-auto mb-5">
              <Loader2 className="absolute inset-0 w-14 h-14 text-cyber-400 animate-spin" />
              <ShieldCheck className="absolute inset-0 m-auto w-6 h-6 text-accent-400" />
            </div>
            <h1 className="text-xl font-semibold text-gray-100">Starting secure scan</h1>
            <p className="text-sm text-gray-500 mt-2">Creating the authorized {testType.toLowerCase()} for <span className="font-mono text-gray-300">{pendingDomain}</span>…</p>
            <p className="text-xs text-gray-600 mt-5">The live scanner will appear automatically.</p>
          </>
        )}
      </Card>
    </div>
  );
}
