import { useMemo, useState } from 'react';
import { Search, ArrowUpDown, LockKeyhole } from 'lucide-react';
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
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value as Severity | 'all')}
            className="input-base cursor-pointer"
            aria-label="Filter by severity"
          >
            {severityFilters.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as FindingStatus | 'all')}
            className="input-base cursor-pointer"
            aria-label="Filter by status"
          >
            {statusFilters.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
          <div className="relative">
            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="input-base pl-9 cursor-pointer"
              aria-label="Sort findings"
            >
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
          <div className="surface p-8 text-center">
            <p className="text-sm text-gray-500">No findings match your filters.</p>
          </div>
        ) : (
          filtered.map((f) => <FindingCard key={f.id} finding={f} />)
        )}
      </div>

      {filteredLocked.length > 0 && (
        <div className="space-y-3 pt-1">
          <div className="rounded-lg border border-accent-500/25 bg-accent-500/5 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <LockKeyhole className="w-5 h-5 text-accent-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-100">{filteredLocked.length} additional security {filteredLocked.length === 1 ? 'finding' : 'findings'} detected</p>
                <p className="text-xs text-gray-500 mt-0.5">Unlock every vulnerability, technical evidence, remediation step, and the complete security report.</p>
              </div>
            </div>
            <Link to="/checkout/pro" className="inline-flex items-center justify-center rounded-md bg-accent-500 px-4 py-2 text-sm font-semibold text-ink-950 hover:bg-accent-400 transition-colors whitespace-nowrap">
              Unlock Full Report — $19.90
            </Link>
          </div>

          {filteredLocked.slice(0, 5).map((finding) => (
            <div key={finding.id} className="relative overflow-hidden rounded-xl border border-ink-700 bg-ink-900 p-5 min-h-[168px]">
              <div className="relative z-10 flex items-start justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <SeverityBadge severity={finding.severity} />
                  <span className="text-sm font-semibold text-gray-200">{lockedSectionLabels[finding.section]}</span>
                </div>
                <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Open</span>
              </div>

              <div aria-hidden="true" className="mt-5 space-y-3 blur-[6px] opacity-55 select-none pointer-events-none">
                <div className="h-3.5 w-[78%] rounded bg-gray-300/45" />
                <div className="h-3 w-[92%] rounded bg-gray-500/45" />
                <div className="h-3 w-[66%] rounded bg-gray-500/40" />
                <div className="h-3 w-[84%] rounded bg-gray-600/45" />
              </div>

              <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-center border-t border-ink-700/80 bg-ink-950/80 px-4 py-3 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-100">
                  <LockKeyhole className="w-4 h-4 text-accent-400" />
                  Unlock the complete finding
                </div>
              </div>
            </div>
          ))}

          {filteredLocked.length > 5 && <p className="text-center text-xs text-gray-500">+ {filteredLocked.length - 5} more findings in the full Pro report</p>}
        </div>
      )}
    </div>
  );
}
