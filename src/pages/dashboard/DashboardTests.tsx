import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { dashboardTests } from '@/data/dashboard';
import { FlaskConical } from 'lucide-react';

export function DashboardTests() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-50">Tests</h1>
        <p className="text-sm text-gray-500 mt-1">All security tests across your domains.</p>
      </div>

      <Card>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-700/40 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="text-left font-semibold px-4 py-3">Test ID</th>
                  <th className="text-left font-semibold px-4 py-3">Domain</th>
                  <th className="text-left font-semibold px-4 py-3">Package</th>
                  <th className="text-left font-semibold px-4 py-3">Status</th>
                  <th className="text-left font-semibold px-4 py-3">Started</th>
                  <th className="text-left font-semibold px-4 py-3">Completed</th>
                  <th className="text-left font-semibold px-4 py-3">Score</th>
                  <th className="text-right font-semibold px-4 py-3">Report</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-700/30">
                {dashboardTests.map((t) => (
                  <tr key={t.id} className="hover:bg-ink-800/40 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-gray-300">{t.id}</td>
                    <td className="px-4 py-3.5 font-mono text-gray-200">{t.domain}</td>
                    <td className="px-4 py-3.5 text-gray-400">{t.package}</td>
                    <td className="px-4 py-3.5"><StatusBadge status={t.status} /></td>
                    <td className="px-4 py-3.5 text-gray-400">{t.started}</td>
                    <td className="px-4 py-3.5 text-gray-400">{t.completed}</td>
                    <td className="px-4 py-3.5 text-gray-200 font-medium">{t.score ?? '—'}</td>
                    <td className="px-4 py-3.5 text-right">
                      {t.status === 'completed' ? (
                        <Link to="/report" className="inline-flex items-center gap-1.5 text-sm text-accent-400 hover:underline">
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </Link>
                      ) : (
                        <span className="text-xs text-gray-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {dashboardTests.length === 0 && (
        <EmptyState icon={<FlaskConical className="w-10 h-10" />} title="No tests yet" description="Run your first security test to see results here." />
      )}
    </div>
  );
}
