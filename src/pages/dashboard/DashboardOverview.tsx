import { Globe, ShieldCheck, AlertTriangle, Activity, ArrowRight, FlaskConical } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { SecurityScore } from '@/components/SecurityScore';
import { overviewStats, recentTests, dashboardDomains } from '@/data/dashboard';
import { securityScore } from '@/data/findings';

const iconMap: Record<string, typeof Globe> = {
  globe: Globe, shield: ShieldCheck, alert: AlertTriangle, activity: Activity,
};

export function DashboardOverview() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-50">Overview</h1>
        <p className="text-sm text-gray-500 mt-1">Your security posture at a glance.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewStats.map((stat) => {
          const Icon = iconMap[stat.icon];
          return (
            <Card key={stat.label} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-100 mt-1.5">{stat.value}</p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-accent-500/10 border border-accent-500/20 flex items-center justify-center">
                  <Icon className="w-4.5 h-4.5 w-5 h-5 text-accent-400" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader title="Latest security score" subtitle="acme-widgets.com" />
          <CardBody className="flex flex-col items-center py-8">
            <SecurityScore score={securityScore} size="md" />
            <Link to="/dashboard/tests" className="mt-4 text-sm text-accent-400 hover:underline">View latest report</Link>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Recent tests" action={<Link to="/dashboard/tests" className="text-sm text-accent-400 hover:underline inline-flex items-center gap-1">View all <ArrowRight className="w-3.5 h-3.5" /></Link>} />
          <CardBody className="p-0">
            <div className="divide-y divide-ink-700/40">
              {recentTests.map((test) => (
                <div key={test.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <FlaskConical className="w-4 h-4 text-gray-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-200 truncate">{test.id} · {test.domain}</p>
                      <p className="text-xs text-gray-500">{test.package} · {test.started}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    {test.score !== null && <span className="text-sm font-bold text-gray-100">{test.score}</span>}
                    <StatusBadge status={test.status} />
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Your domains" action={<Link to="/dashboard/domains" className="text-sm text-accent-400 hover:underline inline-flex items-center gap-1">Manage <ArrowRight className="w-3.5 h-3.5" /></Link>} />
        <CardBody className="p-0">
          <div className="divide-y divide-ink-700/40">
            {dashboardDomains.map((d) => (
              <div key={d.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-mono text-gray-200">{d.domain}</span>
                </div>
                <div className="flex items-center gap-4">
                  <StatusBadge status={d.verification} />
                  <StatusBadge status={d.monitoring} />
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
