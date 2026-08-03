import { Globe, MoreVertical, Plus } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { dashboardDomains } from '@/data/dashboard';
import { useToast } from '@/components/ui/Toast';

export function DashboardDomains() {
  const { toast } = useToast();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-50">Domains</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your verified domains.</p>
        </div>
        <Button size="sm" onClick={() => toast('Add domain flow coming soon.', 'info')}>
          <Plus className="w-4 h-4" />
          Add domain
        </Button>
      </div>

      <Card>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-700/40 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="text-left font-semibold px-4 py-3">Domain</th>
                  <th className="text-left font-semibold px-4 py-3">Verification</th>
                  <th className="text-left font-semibold px-4 py-3">Last test</th>
                  <th className="text-left font-semibold px-4 py-3">Monitoring</th>
                  <th className="text-left font-semibold px-4 py-3">Score</th>
                  <th className="text-right font-semibold px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-700/30">
                {dashboardDomains.map((d) => (
                  <tr key={d.id} className="hover:bg-ink-800/40 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Globe className="w-4 h-4 text-gray-500" />
                        <span className="font-mono text-gray-200">{d.domain}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5"><StatusBadge status={d.verification} /></td>
                    <td className="px-4 py-3.5 text-gray-400">{d.lastTest}</td>
                    <td className="px-4 py-3.5"><StatusBadge status={d.monitoring} /></td>
                    <td className="px-4 py-3.5 text-gray-200 font-medium">{d.score > 0 ? d.score : '—'}</td>
                    <td className="px-4 py-3.5 text-right">
                      <button className="text-gray-500 hover:text-gray-300" onClick={() => toast('Domain actions coming soon.', 'info')} aria-label="Domain actions">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
