import { Download, FileText } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { dashboardReports } from '@/data/dashboard';
import { useToast } from '@/components/ui/Toast';

export function DashboardReports() {
  const { toast } = useToast();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-50">Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Download and review your security reports.</p>
      </div>

      {dashboardReports.length === 0 ? (
        <EmptyState icon={<FileText className="w-10 h-10" />} title="No reports yet" description="Reports appear here after you run a test." />
      ) : (
        <Card>
          <CardBody className="p-0">
            <div className="divide-y divide-ink-700/40">
              {dashboardReports.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-ink-800 border border-ink-700/50 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-200 truncate">{r.title}</p>
                      <p className="text-xs text-gray-500">{r.testType} · {r.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button onClick={() => toast('Report download started (demo).', 'info')} className="inline-flex items-center gap-1.5 text-sm text-accent-400 hover:underline">
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
