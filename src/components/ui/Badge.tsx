import { AlertTriangle, ShieldCheck, ShieldAlert, Info, XCircle } from 'lucide-react';
import type { Severity } from '@/data/findings';
import { cn } from '@/lib/cn';

const config: Record<Severity, { label: string; classes: string; icon: typeof AlertTriangle }> = {
  critical: { label: 'Critical', classes: 'bg-danger-500/15 text-danger-400 border-danger-500/30', icon: XCircle },
  high: { label: 'High', classes: 'bg-warn-500/15 text-warn-400 border-warn-500/30', icon: ShieldAlert },
  medium: { label: 'Medium', classes: 'bg-accent-500/15 text-accent-300 border-accent-500/30', icon: AlertTriangle },
  low: { label: 'Low', classes: 'bg-cyber-500/15 text-cyber-400 border-cyber-500/30', icon: Info },
  info: { label: 'Info', classes: 'bg-ink-600/40 text-gray-400 border-ink-600/50', icon: Info },
  passed: { label: 'Passed', classes: 'bg-accent-500/15 text-accent-300 border-accent-500/30', icon: ShieldCheck },
};

export function SeverityBadge({ severity, size = 'sm' }: { severity: Severity; size?: 'sm' | 'md' }) {
  const c = config[severity];
  const Icon = c.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        c.classes,
      )}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      {c.label}
    </span>
  );
}

type StatusType = 'open' | 'acknowledged' | 'fixed' | 'accepted' | 'verified' | 'pending' | 'expired' | 'healthy' | 'attention' | 'new-finding' | 'active' | 'paused' | 'off' | 'completed' | 'in-progress' | 'queued' | 'failed' | 'scope-review' | 'scheduled' | 'report-ready';

const statusConfig: Record<StatusType, { label: string; dot: string; text: string }> = {
  open: { label: 'Open', dot: 'bg-warn-400', text: 'text-warn-400' },
  acknowledged: { label: 'Acknowledged', dot: 'bg-cyber-400', text: 'text-cyber-400' },
  fixed: { label: 'Fixed', dot: 'bg-accent-400', text: 'text-accent-300' },
  accepted: { label: 'Accepted Risk', dot: 'bg-gray-400', text: 'text-gray-400' },
  verified: { label: 'Verified', dot: 'bg-accent-400', text: 'text-accent-300' },
  pending: { label: 'Pending', dot: 'bg-warn-400', text: 'text-warn-400' },
  expired: { label: 'Expired', dot: 'bg-danger-400', text: 'text-danger-400' },
  healthy: { label: 'Healthy', dot: 'bg-accent-400', text: 'text-accent-300' },
  attention: { label: 'Needs attention', dot: 'bg-warn-400', text: 'text-warn-400' },
  'new-finding': { label: 'New finding', dot: 'bg-danger-400', text: 'text-danger-400' },
  active: { label: 'Active', dot: 'bg-accent-400', text: 'text-accent-300' },
  paused: { label: 'Paused', dot: 'bg-warn-400', text: 'text-warn-400' },
  off: { label: 'Off', dot: 'bg-gray-500', text: 'text-gray-400' },
  completed: { label: 'Completed', dot: 'bg-accent-400', text: 'text-accent-300' },
  'in-progress': { label: 'In progress', dot: 'bg-cyber-400', text: 'text-cyber-400' },
  queued: { label: 'Queued', dot: 'bg-gray-400', text: 'text-gray-400' },
  failed: { label: 'Failed', dot: 'bg-danger-400', text: 'text-danger-400' },
  'scope-review': { label: 'Scope review', dot: 'bg-warn-400', text: 'text-warn-400' },
  scheduled: { label: 'Scheduled', dot: 'bg-cyber-400', text: 'text-cyber-400' },
  'report-ready': { label: 'Report ready', dot: 'bg-accent-400', text: 'text-accent-300' },
};

export function StatusBadge({ status }: { status: StatusType }) {
  const c = statusConfig[status];
  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium">
      <span className={cn('w-1.5 h-1.5 rounded-full', c.dot)} />
      <span className={c.text}>{c.label}</span>
    </span>
  );
}
