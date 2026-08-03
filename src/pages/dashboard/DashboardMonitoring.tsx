import { Bell, Globe } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { monitoredDomains } from '@/data/dashboard';
import { useToast } from '@/components/ui/Toast';

export function DashboardMonitoring() {
  const { toast } = useToast();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-50">Monitoring</h1>
        <p className="text-sm text-gray-500 mt-1">Continuous security monitoring for your domains.</p>
      </div>

      <Card>
        <CardHeader title="Monitored domains" subtitle="Scheduled recurring checks with change detection" icon={<Globe className="w-5 h-5" />} />
        <CardBody className="p-0">
          <div className="divide-y divide-ink-700/40">
            {monitoredDomains.map((m) => (
              <div key={m.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-mono text-gray-200">{m.domain}</p>
                    <p className="text-xs text-gray-500">Last check: {m.lastCheck}</p>
                  </div>
                </div>
                <div className="flex items-center gap-5">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">New findings</p>
                    <p className={`text-sm font-bold ${m.newFindings > 0 ? 'text-danger-400' : 'text-gray-300'}`}>{m.newFindings}</p>
                  </div>
                  <StatusBadge status={m.status} />
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Notification settings" icon={<Bell className="w-5 h-5" />} />
        <CardBody className="space-y-3">
          {[
            { label: 'Email me when new findings are detected', on: true },
            { label: 'Email me when monitoring detects changes', on: true },
            { label: 'Weekly security summary email', on: false },
          ].map((n) => (
            <label key={n.label} className="flex items-center justify-between p-3 rounded-lg bg-ink-900/40 border border-ink-700/40 cursor-pointer">
              <span className="text-sm text-gray-300">{n.label}</span>
              <input
                type="checkbox"
                defaultChecked={n.on}
                onChange={() => toast('Notification preferences saved (demo).', 'success')}
                className="w-9 h-5 appearance-none rounded-full bg-ink-700 checked:bg-accent-500 relative transition-colors cursor-pointer before:content-[''] before:absolute before:top-0.5 before:left-0.5 before:w-4 before:h-4 before:rounded-full before:bg-white before:transition-transform checked:before:translate-x-4"
              />
            </label>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
