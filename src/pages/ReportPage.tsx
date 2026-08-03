import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Download, RefreshCw, ArrowUpCircle, UserSearch, ShieldCheck, AlertTriangle, CheckCircle2,
  Radar, Clock3, Activity, LockKeyhole,
} from 'lucide-react';
import { SecurityScore } from '@/components/SecurityScore';
import { FindingsTable } from '@/components/FindingsTable';
import { SeverityBadge } from '@/components/ui/Badge';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button, LinkButton } from '@/components/ui/Button';
import { findings, securityScore, severityCounts, sampleReportSummary } from '@/data/findings';
import { useToast } from '@/components/ui/Toast';
import { api, type ReportResponse, type ScanStatusResponse } from '@/services/api';
import { useSession } from '@/components/ui/Session';

export function ReportPage() {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [scanStatus, setScanStatus] = useState<ScanStatusResponse | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [restarting, setRestarting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();
  const { scanId, setScanId } = useSession();
  const navigate = useNavigate();

  const runFreshScan = async () => {
    if (!report || restarting) return;
    setRestarting(true);
    try {
      const isAdvanced = report.tier?.toLowerCase().includes('advanced');
      const result = await api.startScan({
        domain: report.domain, testType: report.tier ?? 'Free Scan', forceRescan: true,
        acceptedAdvancedRisk: isAdvanced, termsVersion: '1.0', acceptedAt: new Date().toISOString(),
      });
      setScanId(result.scanId);
      setReport(null);
      setScanStatus(null);
      setElapsedSeconds(0);
      setError(null);
      setLoading(true);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not start a fresh scan.', 'error');
      setRestarting(false);
    }
  };

  const cancelActiveScan = async () => {
    if (!scanId) return;
    try { await api.cancelScan(scanId); } catch { /* The scan may have completed between polls. */ }
    setScanId(null);
    navigate('/');
  };

  const downloadReport = async () => {
    if (!report || downloading) return;
    setDownloading(true);
    try {
      const { generateReportPdf } = await import('@/lib/reportPdf');
      await generateReportPdf(report);
      toast('PDF report downloaded.', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not generate the PDF report.', 'error');
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    if (!scanId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const deadline = Date.now() + 13 * 60_000;
    const load = async () => {
      try {
        const status = await api.getScanStatus(scanId);
        if (!cancelled) setScanStatus(status);
        if (status.error) throw new Error(status.error);
        if (!status.complete) {
          if (Date.now() >= deadline) throw new Error('The scan exceeded the thirteen-minute report wait limit.');
          if (!cancelled) timer = setTimeout(load, 1_500);
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 700));
        const data = await api.getReport(scanId);
        if (!cancelled) {
          setReport(data);
          setRestarting(false);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load the report.');
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [scanId]);

  useEffect(() => {
    if (!loading) return;
    const startedAt = scanStatus?.startedAt ? new Date(scanStatus.startedAt).getTime() : Date.now();
    const updateElapsed = () => setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    updateElapsed();
    const timer = setInterval(updateElapsed, 1_000);
    return () => clearInterval(timer);
  }, [loading, scanStatus?.startedAt]);

  const activeFindings = report?.findings ?? findings;
  const activeScore = report?.score ?? securityScore;
  const activeCounts = report?.severityCounts ?? severityCounts;
  const activeSummary = report?.summary ?? sampleReportSummary.riskSummary;

  if (loading) {
    return (
      <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <ScanWaiting status={scanStatus} elapsedSeconds={elapsedSeconds} onCancel={cancelActiveScan} />
      </div>
    );
  }

  if (error) {
    return <div className="py-20 px-4 text-center text-danger-400">{error}</div>;
  }

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyber-500/10 border border-cyber-500/20 text-xs text-cyber-400 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-cyber-400 animate-pulse-soft" />
            {report ? `Live ${report.tier ?? 'Free Scan'} v1` : 'Demo report'} · {report?.domain ?? 'example.com'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-50">Security Report</h1>
          <p className="text-sm text-gray-500 mt-1">Generated on {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          {report?.servedFromCache && <p className="text-xs text-cyber-400 mt-1">Instant cached report · run a fresh scan whenever you need current results.</p>}
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Button variant="secondary" size="sm" onClick={downloadReport} disabled={!report || downloading}>
            <Download className="w-4 h-4" />
            {downloading ? 'Generating PDF…' : 'Download Report'}
          </Button>
          <Button variant="secondary" size="sm" onClick={runFreshScan} disabled={restarting}>
            <RefreshCw className="w-4 h-4" />
            {restarting ? 'Starting…' : 'Run Fresh Scan'}
          </Button>
          <LinkButton to="/checkout/advanced" variant="outline" size="sm">
            <ArrowUpCircle className="w-4 h-4" />
            Upgrade Test
          </LinkButton>
          <LinkButton to="/human-pentest" variant="primary" size="sm">
            <UserSearch className="w-4 h-4" />
            Request Human Review
          </LinkButton>
        </div>
      </div>

      {/* Top summary */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-1 flex flex-col items-center justify-center p-6">
          <SecurityScore score={activeScore} size="lg" />
          <p className="text-xs text-gray-500 mt-3">{activeScore >= 85 ? 'Low' : activeScore >= 65 ? 'Elevated' : 'High'} risk level</p>
        </Card>
        <Card className="lg:col-span-2 p-6">
          <h3 className="text-base font-semibold text-gray-100 mb-3">Overall risk summary</h3>
          <p className="text-sm text-gray-400 leading-relaxed">{activeSummary}</p>
          <div className="mt-5 grid grid-cols-3 sm:grid-cols-6 gap-3">
            <Stat label="Critical" value={activeCounts.critical} variant="critical" />
            <Stat label="High" value={activeCounts.high} variant="high" />
            <Stat label="Medium" value={activeCounts.medium} variant="medium" />
            <Stat label="Low" value={activeCounts.low} variant="low" />
            <Stat label="Passed" value={activeCounts.passed} variant="passed" />
            <Stat label="Score" value={`${activeScore}`} variant="score" />
          </div>
        </Card>
      </div>

      {report?.scanCoverage && (
        <Card className="mb-8">
          <CardHeader
            title="Advanced scan coverage"
            subtitle={`${report.scanCoverage.rawMatches} raw matches · ${report.scanCoverage.uniqueMatches} unique findings · ${report.scanCoverage.duplicatesSuppressed} duplicates suppressed`}
            icon={<ShieldCheck className="w-5 h-5" />}
          />
          <CardBody>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {report.scanCoverage.passes.map((pass) => (
                <div key={pass.name} className="rounded-lg border border-ink-700 bg-ink-900/50 p-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`text-xs font-semibold uppercase tracking-wider ${pass.status === 'completed' ? 'text-accent-400' : 'text-warn-400'}`}>{pass.status}</span>
                    <span className="text-xs text-gray-500">{pass.source}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-200">{pass.name}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {pass.elapsedMs != null ? `${(pass.elapsedMs / 1000).toFixed(1)}s` : 'Completed'}
                    {pass.matches != null ? ` · ${pass.matches} matches` : ''}
                  </p>
                </div>
              ))}
            </div>
            {report.scanCoverage.limitations.map((limitation) => (
              <div key={limitation} className="mt-4 rounded-lg border border-cyber-500/20 bg-cyber-500/5 p-3 text-sm text-gray-400">
                {limitation}
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {/* Severity distribution */}
      <Card className="mb-8">
        <CardHeader title="Severity distribution" subtitle="How findings break down by severity" icon={<AlertTriangle className="w-5 h-5" />} />
        <CardBody>
          <div className="space-y-3">
            {(['critical', 'high', 'medium', 'low', 'passed'] as const).map((sev) => {
              const count = activeCounts[sev];
              const total = Object.values(activeCounts).reduce<number>((a, b) => a + b, 0);
              const pct = total > 0 ? (count / total) * 100 : 0;
              const colors: Record<string, string> = {
                critical: 'bg-danger-500', high: 'bg-warn-500', medium: 'bg-accent-500', low: 'bg-cyber-500', passed: 'bg-accent-600',
              };
              return (
                <div key={sev} className="flex items-center gap-4">
                  <div className="w-20 shrink-0">
                    <SeverityBadge severity={sev} />
                  </div>
                  <div className="flex-1 h-2.5 rounded-full bg-ink-800 overflow-hidden">
                    <div className={`h-full rounded-full ${colors[sev]} transition-all duration-700`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-sm text-gray-400 w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {/* Findings */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-100 mb-1">Findings</h2>
        <p className="text-sm text-gray-500 mb-5">Click any finding to see full details, impact, and recommended fixes.</p>
      </div>
      <FindingsTable findings={activeFindings} />

      <div className="mt-10 rounded-lg border border-accent-500/20 bg-accent-500/5 p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-accent-400 shrink-0 mt-0.5" />
        <p className="text-sm text-gray-400">
          Pentor {report?.tier ?? 'Free Scan'} uses controlled, non-destructive checks. Results are limited to the observed surface and do not prove the absence of other vulnerabilities.
        </p>
      </div>
    </div>
  );
}

function ScanWaiting({ status, elapsedSeconds, onCancel }: { status: ScanStatusResponse | null; elapsedSeconds: number; onCancel: () => void }) {
  const rawType = (status?.testType ?? 'advanced').toLowerCase();
  const type = rawType.includes('advanced') ? 'advanced' : rawType.includes('pro') ? 'pro' : 'free';
  const tier = type === 'advanced' ? 'Advanced Scan' : type === 'pro' ? 'Pro Scan' : 'Free Scan';
  const estimate = type === 'advanced' ? '3–12 minutes' : type === 'pro' ? '30–90 seconds' : 'Under 30 seconds';
  const targetSeconds = type === 'advanced' ? 420 : type === 'pro' ? 60 : 25;
  const estimatedProgress = Math.min(92, Math.max(6, Math.round(6 + (elapsedSeconds / targetSeconds) * 86)));
  const stages = type === 'advanced'
    ? ['Preparing authorized target', 'Running baseline security checks', 'Fingerprinting platform and DNS', 'Running safe vulnerability templates', 'Validating and prioritizing findings', 'Building your report']
    : type === 'pro'
      ? ['Preparing authorized target', 'Running baseline security checks', 'Fingerprinting platform and DNS', 'Checking email and DNS security', 'Validating and prioritizing findings', 'Building your report']
      : ['Preparing authorized target', 'Checking TLS and HTTP security', 'Reviewing public security signals', 'Validating findings', 'Building your report'];
  const currentPhase = status?.currentPhase ?? stages[0];
  const normalizedPhase = currentPhase.toLowerCase();
  const activeStage = normalizedPhase.includes('report') ? stages.length - 1
    : normalizedPhase.includes('validating') ? stages.length - 2
      : normalizedPhase.includes('template') || normalizedPhase.includes('exposure') ? Math.min(3, stages.length - 1)
        : normalizedPhase.includes('fingerprint') || normalizedPhase.includes('dns') ? Math.min(2, stages.length - 1)
          : normalizedPhase.includes('baseline') || normalizedPhase.includes('tls') ? 1 : 0;
  const progress = status?.complete ? 100 : Math.min(94, Math.max(estimatedProgress, status?.progress ?? 0));
  const formatElapsed = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyber-500/25 bg-cyber-500/10 text-xs font-medium text-cyber-400 mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyber-400 animate-pulse" />
          Live scan in progress
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-50">Pentor is testing {status?.domain ?? 'your site'}</h1>
        <p className="text-gray-400 mt-3">Keep this page open. Your report will appear here automatically.</p>
      </div>

      <Card className="overflow-hidden border-cyber-500/20">
        <div className="grid lg:grid-cols-[320px_1fr]">
          <div className="relative min-h-[330px] flex items-center justify-center overflow-hidden border-b lg:border-b-0 lg:border-r border-ink-700 bg-gradient-to-br from-cyber-500/10 via-ink-900 to-accent-500/5">
            <div className="absolute w-64 h-64 rounded-full border border-cyber-500/10" />
            <div className="absolute w-48 h-48 rounded-full border border-cyber-500/15" />
            <div className="absolute w-32 h-32 rounded-full border border-cyber-500/20" />
            <div className="absolute w-64 h-64 rounded-full overflow-hidden animate-spin [animation-duration:4s]">
              <div className="absolute left-1/2 top-1/2 w-1/2 h-px origin-left bg-gradient-to-r from-cyber-400 to-transparent shadow-[0_0_18px_rgba(34,211,238,0.8)]" />
            </div>
            <div className="relative w-24 h-24 rounded-full bg-ink-900 border border-cyber-400/30 shadow-[0_0_45px_rgba(34,211,238,0.16)] flex items-center justify-center">
              <Radar className="w-11 h-11 text-cyber-400 animate-pulse" />
            </div>
            <div className="absolute bottom-7 text-center">
              <p className="text-sm font-semibold text-gray-100">{tier}</p>
              <p className="text-xs text-gray-500 mt-1">Controlled, non-destructive testing</p>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="grid sm:grid-cols-3 gap-3 mb-8">
              <ScanMetric icon={Clock3} label="Elapsed" value={formatElapsed(elapsedSeconds)} />
              <ScanMetric icon={Activity} label="Estimated total" value={estimate} />
              <ScanMetric icon={LockKeyhole} label="Authorization" value="Verified" />
            </div>

            <div className="flex items-end justify-between gap-4 mb-2">
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500">Current phase</p>
                <p className="text-sm font-medium text-gray-100 mt-1">{currentPhase}</p>
              </div>
              <span className="text-2xl font-bold text-cyber-400 tabular-nums">{progress}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-ink-800 overflow-hidden mb-7">
              <div className="h-full rounded-full bg-gradient-to-r from-accent-500 to-cyber-400 transition-all duration-1000 shadow-[0_0_12px_rgba(34,211,238,0.35)]" style={{ width: `${progress}%` }} />
            </div>

            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
              {stages.map((stage, index) => {
                const complete = index < activeStage;
                const active = index === activeStage;
                return (
                  <div key={stage} className={`flex items-center gap-2.5 text-sm ${active ? 'text-gray-100' : complete ? 'text-accent-400' : 'text-gray-600'}`}>
                    {complete ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <span className={`w-4 h-4 rounded-full border shrink-0 ${active ? 'border-cyber-400 bg-cyber-400/15 shadow-[0_0_8px_rgba(34,211,238,0.4)]' : 'border-ink-600'}`} />}
                    <span>{stage}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      <p className="text-center text-xs text-gray-600 mt-4">
        Progress combines live scanner phases with an elapsed-time estimate. Pentor only completes it after the scanner validates the results.
      </p>
      <div className="flex justify-center mt-5">
        <Button variant="ghost" size="sm" onClick={onCancel} className="text-danger-400 hover:bg-danger-500/10">
          Cancel test
        </Button>
      </div>
    </div>
  );
}

function ScanMetric({ icon: Icon, label, value }: { icon: typeof Clock3; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ink-700 bg-ink-900/60 p-3.5">
      <div className="flex items-center gap-2 text-gray-500 mb-1.5">
        <Icon className="w-4 h-4" />
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-sm font-semibold text-gray-100 tabular-nums">{value}</p>
    </div>
  );
}

function Stat({ label, value, variant }: { label: string; value: number | string; variant: string }) {
  const colors: Record<string, string> = {
    critical: 'text-danger-400', high: 'text-warn-400', medium: 'text-accent-300', low: 'text-cyber-400', passed: 'text-accent-300', score: 'text-gray-100',
  };
  const icons: Record<string, typeof AlertTriangle> = {
    critical: AlertTriangle, high: AlertTriangle, medium: AlertTriangle, low: AlertTriangle, passed: CheckCircle2, score: ShieldCheck,
  };
  const Icon = icons[variant] ?? ShieldCheck;
  return (
    <div className="text-center">
      <Icon className={`w-4 h-4 mx-auto mb-1 ${colors[variant]}`} />
      <p className={`text-lg font-bold ${colors[variant]}`}>{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
