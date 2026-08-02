import { ChevronDown, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import type { Finding } from '@/data/findings';
import { SeverityBadge, StatusBadge } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';

type FindingClass = 'confirmed_vulnerability' | 'potential_vulnerability' | 'security_misconfiguration' | 'hardening_recommendation' | 'informational' | 'coverage_limitation' | 'control_passed';

const findingClassLabels: Record<FindingClass, string> = {
  confirmed_vulnerability: 'Confirmed vulnerability',
  potential_vulnerability: 'Potential · validate',
  security_misconfiguration: 'Security misconfiguration',
  hardening_recommendation: 'Hardening recommendation',
  informational: 'Informational',
  coverage_limitation: 'Coverage limitation',
  control_passed: 'Control passed',
};

export function FindingCard({ finding, defaultOpen }: { finding: Finding; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const displayStatus = finding.severity === 'passed' ? 'no_action' : finding.status;
  const findingClass = (finding as Finding & { findingClass?: FindingClass }).findingClass;

  return (
    <div className="surface shadow-card overflow-hidden transition-colors hover:border-ink-600">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between gap-4 p-4 text-left" aria-expanded={open}>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <SeverityBadge severity={finding.severity} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-gray-100 truncate">{finding.title}</p>
              {findingClass && (
                <span className="rounded border border-ink-600 bg-ink-800/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  {findingClassLabels[findingClass]}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{finding.id} · {finding.affectedArea} · {finding.confidence} confidence</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="hidden sm:block"><StatusBadge status={displayStatus} /></span>
          <ChevronDown className={cn('w-4 h-4 text-gray-500 transition-transform', open && 'rotate-180')} />
        </div>
      </button>

      {open && (
        <div className="border-t border-ink-700/50 p-5 space-y-4 animate-fade-in">
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <Field label="Affected area" value={finding.affectedArea} />
            <Field label="Confidence" value={finding.confidence} />
            <Field label="Category" value={finding.category} />
            {findingClass && <Field label="Evidence classification" value={findingClassLabels[findingClass]} />}
            <Field label="Detection date" value={new Date(finding.detectedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} />
          </div>
          <DetailSection label="What Pentor observed" value={finding.observed} />
          <DetailSection label="Why it matters" value={finding.impact} />
          {finding.severity !== 'passed' && <DetailSection label="Recommended fix" value={finding.recommendation} />}
          {finding.references.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">References</p>
              <div className="flex flex-wrap gap-2">
                {finding.references.map((ref) => (
                  <span key={ref} className="inline-flex items-center gap-1.5 text-xs text-gray-400 bg-ink-800/60 border border-ink-700/50 rounded-md px-2.5 py-1">
                    <ExternalLink className="w-3 h-3" />{ref}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="sm:hidden"><StatusBadge status={displayStatus} /></div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">{label}</p><p className="text-sm text-gray-200">{value}</p></div>;
}

function DetailSection({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{label}</p><p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{value}</p></div>;
}
