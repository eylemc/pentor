import { useMemo, useState } from 'react';
import { Search, ArrowUpDown, LockKeyhole, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Finding, Severity, FindingStatus } from '@/data/findings';
import { FindingCard } from '@/components/FindingCard';
import { SeverityBadge } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';

type SortKey = 'severity' | 'status' | 'date';

const severityOrder: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4, passed: 5 };

const severityFilters: { value: Severity | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
  { value: 'passed', label: 'Passed' },
];

const statusFilters: { value: FindingStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All status' },
  { value: 'open', label: 'Open' },
  { value: 'acknowledged', label: 'Acknowledged' },
  { value: 'fixed', label: 'Fixed' },
  { value: 'accepted', label: 'Accepted risk' },
  { value: 'no_action', label: 'No action needed' },
];

interface LockedFindingPreview {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  section: 'network' | 'database';
}

const lockedSectionLabels: Record<LockedFindingPreview['section'], string> = {
  network: 'Network Security',
  database: 'Database Security',
};

const lockedAccentClasses: Record<LockedFindingPreview['severity'], { border: string; icon: string; glow: string }> = {
  critical: { border: 'border-l-danger-500', icon: 'text-danger-400', glow: 'bg-danger-500/15' },
  high: { border: 'border-l-warn-500', icon: 'text-warn-400', glow: 'bg-warn-500/15' },
  medium: { border: 'border-l-accent-500', icon: 'text-accent-400', glow: 'bg-accent-500/15' },
  low: { border: 'border-l-cyber-500', icon: 'text-cyber-400', glow: 'bg-cyber-500/15' },
};

const safeLockedHints: Record<LockedFindingPreview['section'], Array<{ title: string; text: string }>> = {
  network: [
    { title: 'Browser security control requires review', text: 'A browser-facing protection appears missing or incomplete on the public web surface.' },
    { title: 'Domain trust configuration requires review', text: 'A public domain or email-security control may not be fully configured.' },
    { title: 'Transport protection signal detected', text: 'An HTTPS, TLS, or secure-transport setting requires closer validation.' },
    { title: 'Public information exposure detected', text: 'The public response may reveal more technical information than necessary.' },
    { title: 'Session protection control requires review', text: 'A browser session or cookie-related safeguard may need additional hardening.' },
  ],
  database: [
    { title: 'Public data-access control requires review', text: 'A public data path produced a security signal that should be validated in the full report.' },
    { title: 'Input handling signal detected', text: 'A public input or query behavior requires closer database-security review.' },
    { title: 'Database exposure control requires review', text: 'A public-facing database or service boundary may need additional restriction.' },
    { title: 'Access isolation signal detected', text: 'A data-access boundary requires further validation before it can be considered secure.' },
    { title: 'Application data protection requires review', text: 'A public application-to-data interaction produced a security-relevant signal.' },
  ],
};

function getSafeLockedHint(finding: LockedFindingPreview, index: number) {
  const hints = safeLockedHints[finding.section];
  return hints[index % hints.length];
}

export function FindingsTable({ findings, lockedFindings = [] }: { findings: Finding[]; lockedFindings?: LockedFindingPreview[] }) {
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState<Severity | 'all'>('all');
  const [status, setStatus] = useState<FindingStatus | 'all'>('all');
  const [sort, setSort] = useState<SortKey>('severity');

  const filtered = useMemo(() => {
    let result = [...findings];
    if (severity !== 'all') result = result.filter((f) => f.severity === severity);
    if (status !== 'all') result = result.filter((f) => (f.severity === 'passed' ? 'no_action' : f.status) === status);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (f) => f.title.toLowerCase().includes(q) || f.affectedArea.toLowerCase().includes(q) || f.category.toLowerCase().includes(q),
      );
    }
    result.sort((a, b) => {
      if (sort === 'severity') return severityOrder[a.severity] - severityOrder[b.severity];
      if (sort === 'date') return new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime();
      const aStatus = a.severity === 'passed' ? 'no_action' : a.status;
      const bStatus = b.severity === 'passed' ? 'no_action' : b.status;
      return aStatus.localeCompare(bStatus);
    });
    return result;
  }, [findings, severity, status, search, sort]);

  const filteredLocked = useMemo(() => {
    if (search.trim() || (status !== 'all' && status !== 'open')) return [];
    if (severity === 'all') return lockedFindings;
    return lockedFindings.filter((finding) => finding.severity === severity);
  }, [lockedFindings, search, severity, status]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search findings..."
            className="input-base pl-10"
            aria-label="Search findings"
          />
        </div>
        <div className="flex gap-2">
          <select value={severity} onChange={(e) => setSeverity(e.target.value as Severity | 'all')} className="input-base cursor-pointer" aria-label="Filter by severity">
            {severityFilters.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value as FindingStatus | 'all')} className="input-base cursor-pointer" aria-label="Filter by status">
            {statusFilters.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
          <div className="relative">
            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="input-base pl-9 cursor-pointer" aria-label="Sort findings">
              <option value="severity">Severity</option>
              <option value="date">Date</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-500">
        {filtered.length} visible {filtered.length === 1 ? 'finding' : 'findings'}
        {filteredLocked.length > 0 ? ` · ${filteredLocked.length} locked` : ''}
      </p>

      <div className={cn('space-y-3')}>
        {filtered.length === 0 ? (
          <div className="surface p-8 text-center"><p className="text-sm text-gray-500">No findings match your filters.</p></div>
        ) : filtered.map((f) => <FindingCard key={f.id} finding={f} />)}
      </div>

      {filteredLocked.length > 0 && (
        <div className="space-y-3 pt-1">
          <div className="rounded-lg border border-accent-500/30 bg-accent-500/5 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_0_28px_rgba(16,185,129,0.06)]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-accent-500/30 bg-accent-500/10"><LockKeyhole className="w-5 h-5 text-accent-400" /></div>
              <div>
                <p className="text-sm font-semibold text-gray-100">{filteredLocked.length} additional security {filteredLocked.length === 1 ? 'finding' : 'findings'} detected</p>
                <p className="text-xs text-gray-500 mt-0.5">Unlock every vulnerability, technical evidence, remediation step, and the complete security report.</p>
              </div>
            </div>
            <Link to="/checkout/pro" className="inline-flex items-center justify-center gap-2 rounded-md bg-accent-500 px-5 py-2.5 text-sm font-bold text-ink-950 hover:bg-accent-400 transition-colors whitespace-nowrap">
              <LockKeyhole className="w-4 h-4" /> Unlock Full Report — $19.90
            </Link>
          </div>

          {filteredLocked.slice(0, 5).map((finding, index) => {
            const accent = lockedAccentClasses[finding.severity];
            const hint = getSafeLockedHint(finding, index);
            return (
              <div key={finding.id} className={`overflow-hidden rounded-xl border border-ink-700 border-l-4 ${accent.border} bg-ink-900`}>
                <div className="grid lg:grid-cols-[150px_minmax(0,1fr)_310px]">
                  <div className="hidden lg:flex items-center justify-center border-r border-ink-700 bg-ink-950/35 p-5">
                    <div className={`flex h-24 w-24 items-center justify-center rounded-full border border-current/30 ${accent.glow} ${accent.icon} shadow-[0_0_30px_currentColor]`}>
                      <AlertTriangle className="h-14 w-14" strokeWidth={1.8} />
                    </div>
                  </div>

                  <div className="relative min-h-[190px] p-5 sm:p-6">
                    <div className="relative z-10 flex items-start justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <SeverityBadge severity={finding.severity} />
                        <span className="text-base font-semibold text-gray-100">{lockedSectionLabels[finding.section]}</span>
                      </div>
                      <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Open</span>
                    </div>

                    <h3 className="mt-4 text-base font-semibold text-gray-200">{hint.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-gray-400">{hint.text}</p>

                    <div aria-hidden="true" className="mt-5 space-y-3 blur-[6px] opacity-55 select-none pointer-events-none">
                      <div className="h-3.5 w-[78%] rounded bg-gray-300/45" />
                      <div className="h-3 w-[92%] rounded bg-gray-500/45" />
                      <div className="h-3 w-[66%] rounded bg-gray-500/40" />
                    </div>
                  </div>

                  <div className="border-t lg:border-l lg:border-t-0 border-ink-700 bg-ink-950/45 p-5 sm:p-6 flex flex-col justify-center">
                    <div className="flex items-center gap-2 text-gray-100"><LockKeyhole className="w-5 h-5 text-accent-400" /><p className="text-sm font-semibold">Finding details are locked</p></div>
                    <p className="mt-2 text-xs text-gray-500">Upgrade to Pro to see:</p>
                    <div className="mt-3 space-y-2">
                      {['Full vulnerability description', 'Technical evidence', 'Affected endpoint and impact', 'Step-by-step remediation'].map((item) => (
                        <div key={item} className="flex items-center gap-2 text-xs text-gray-400"><CheckCircle2 className="w-3.5 h-3.5 text-accent-400 shrink-0" /><span>{item}</span></div>
                      ))}
                    </div>
                    <Link to="/checkout/pro" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-accent-500 px-4 py-2.5 text-sm font-bold text-ink-950 hover:bg-accent-400 transition-colors">
                      <LockKeyhole className="w-4 h-4" /> Unlock This Finding
                    </Link>
                    <p className="mt-2 text-center text-[11px] text-gray-600">Included in the Pro report</p>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredLocked.length > 5 && <p className="text-center text-xs text-gray-500">+ {filteredLocked.length - 5} more findings in the full Pro report</p>}

          <div className="rounded-xl border border-accent-500/25 bg-gradient-to-r from-accent-500/10 via-ink-900 to-cyber-500/5 p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-2"><LockKeyhole className="w-6 h-6 text-accent-400" /><h3 className="text-xl font-bold text-gray-50">Get the Complete Security Report</h3></div>
              <p className="mt-2 text-sm text-gray-400">Unlock all findings, technical evidence, remediation steps, and the downloadable PDF report.</p>
            </div>
            <Link to="/checkout/pro" className="inline-flex items-center justify-center gap-2 rounded-md bg-accent-500 px-6 py-3 text-sm font-bold text-ink-950 hover:bg-accent-400 transition-colors whitespace-nowrap">
              <LockKeyhole className="w-4 h-4" /> Unlock Full Report — $19.90
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
