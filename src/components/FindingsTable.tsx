import { useMemo, useState } from 'react';
import { Search, ArrowUpDown } from 'lucide-react';
import type { Finding, Severity, FindingStatus } from '@/data/findings';
import { FindingCard } from '@/components/FindingCard';
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
];

export function FindingsTable({ findings }: { findings: Finding[] }) {
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState<Severity | 'all'>('all');
  const [status, setStatus] = useState<FindingStatus | 'all'>('all');
  const [sort, setSort] = useState<SortKey>('severity');

  const filtered = useMemo(() => {
    let result = [...findings];
    if (severity !== 'all') result = result.filter((f) => f.severity === severity);
    if (status !== 'all') result = result.filter((f) => f.status === status);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (f) => f.title.toLowerCase().includes(q) || f.affectedArea.toLowerCase().includes(q) || f.category.toLowerCase().includes(q),
      );
    }
    result.sort((a, b) => {
      if (sort === 'severity') return severityOrder[a.severity] - severityOrder[b.severity];
      if (sort === 'date') return new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime();
      return a.status.localeCompare(b.status);
    });
    return result;
  }, [findings, severity, status, search, sort]);

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
        {filtered.length} {filtered.length === 1 ? 'finding' : 'findings'}
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
    </div>
  );
}
