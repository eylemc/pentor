import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle, Loader2, XCircle, ShieldCheck, Clock } from 'lucide-react';
import { api } from '@/services/api';
import { useSession } from '@/components/ui/Session';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/Modal';
import { cn } from '@/lib/cn';

const phases = [
  'Preparing authorized target',
  'Checking public exposure',
  'Reviewing web security configuration',
  'Analyzing detected risks',
  'Preparing report',
];

const logMessages = [
  'Target prepared for controlled assessment',
  'Public exposure mapped safely',
  'Security headers reviewed',
  'TLS configuration checked',
  'DNS and domain signals collected',
  'Application routes enumerated',
  'Analyzing detected risks for impact',
  'Prioritizing findings by severity',
  'Compiling security report',
];

export function ScanProgress({ domain, testType }: { domain: string; testType: string }) {
  const { setScanId } = useSession();
  const navigate = useNavigate();
  const [currentPhase, setCurrentPhase] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const [complete, setComplete] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [startedAt] = useState(new Date());

  useEffect(() => {
    let cancelled = false;
    let phaseIdx = 0;
    let logIdx = 0;

    const advance = () => {
      if (cancelled) return;
      if (phaseIdx < phases.length) {
        setCurrentPhase(phaseIdx);
        const timer = setTimeout(() => {
          phaseIdx++;
          advance();
        }, 2400 + Math.random() * 1200);
        return () => clearTimeout(timer);
      }
      setComplete(true);
    };

    const logTimer = setInterval(() => {
      if (cancelled || logIdx >= logMessages.length) {
        clearInterval(logTimer);
        return;
      }
      setLog((prev) => [...prev, logMessages[logIdx]]);
      logIdx++;
    }, 1600);

    advance();

    return () => {
      cancelled = true;
      clearInterval(logTimer);
    };
  }, []);

  const handleComplete = async () => {
    const isAdvanced = testType.toLowerCase().includes('advanced');
    const res = await api.startScan({
      domain,
      testType,
      acceptedAdvancedRisk: isAdvanced,
      termsVersion: '1.0',
      acceptedAt: new Date().toISOString(),
    });
    setScanId(res.scanId);
    navigate('/report');
  };

  useEffect(() => {
    if (complete) {
      const t = setTimeout(handleComplete, 800);
      return () => clearTimeout(t);
    }
  }, [complete]);

  const handleCancel = () => {
    navigate('/');
  };

  const elapsed = Math.floor((Date.now() - startedAt.getTime()) / 1000);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <div className="p-6 border-b border-ink-700/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-100 flex items-center gap-2.5">
                <Loader2 className={cn('w-5 h-5 text-accent-400', !complete && 'animate-spin-slow')} />
                Security test in progress
              </h1>
              <p className="text-sm text-gray-500 mt-1">Running a controlled, authorized assessment.</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="w-3.5 h-3.5" />
              Elapsed: {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Domain</p>
              <p className="text-gray-200 font-mono mt-1">{domain}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Test type</p>
              <p className="text-gray-200 mt-1">{testType}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Started</p>
              <p className="text-gray-200 mt-1">{startedAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>

          <div className="space-y-3">
            {phases.map((phase, i) => {
              const done = i < currentPhase || complete;
              const active = i === currentPhase && !complete;
              return (
                <div key={phase} className="flex items-center gap-3">
                  <div className="shrink-0">
                    {done ? (
                      <CheckCircle2 className="w-5 h-5 text-accent-400" />
                    ) : active ? (
                      <Loader2 className="w-5 h-5 text-cyber-400 animate-spin-slow" />
                    ) : (
                      <Circle className="w-5 h-5 text-ink-600" />
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-sm transition-colors',
                      done ? 'text-gray-300' : active ? 'text-gray-100 font-medium' : 'text-gray-600',
                    )}
                  >
                    {phase}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="surface p-4 rounded-lg max-h-44 overflow-y-auto">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Activity log</p>
            <div className="space-y-1.5 font-mono text-xs">
              {log.length === 0 && <p className="text-gray-600">Initializing...</p>}
              {log.map((entry, i) => (
                <div key={i} className="flex items-start gap-2 text-gray-400 animate-fade-in">
                  <span className="text-accent-500/60">›</span>
                  <span>{entry}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-accent-500/20 bg-accent-500/5 p-3.5 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-accent-400 shrink-0 mt-0.5" />
            <p className="text-xs text-gray-400">
              Pentor uses controlled checks designed to minimize impact. You can safely leave this page and return later — your test will continue.
            </p>
          </div>

          <div className="flex justify-end">
            <Button variant="ghost" onClick={() => setCancelOpen(true)} className="text-danger-400 hover:bg-danger-500/10">
              <XCircle className="w-4 h-4" />
              Cancel test
            </Button>
          </div>
        </div>
      </Card>

      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={handleCancel}
        title="Cancel this test?"
        message="The test will stop and no report will be generated. You can start a new test at any time."
        confirmLabel="Cancel test"
        danger
      />
    </div>
  );
}
