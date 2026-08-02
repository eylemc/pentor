import { CreditCard, Download, ArrowUpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { billingData } from '@/data/dashboard';
import { domainCreditPlan, pricingPlans } from '@/data/pricing';
import { useToast } from '@/components/ui/Toast';

export function DashboardBilling() {
  const { toast } = useToast();
  const upgrades = pricingPlans.filter((p) => p.id !== 'free' && p.id !== 'monitoring');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-50">Billing</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your plan, purchases, and invoices.</p>
      </div>

      <Card>
        <CardHeader title="Domain credits" icon={<CreditCard className="w-5 h-5" />} />
        <CardBody>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-3xl font-bold text-gray-100">{billingData.domainCredits}</p>
              <p className="text-sm text-gray-500">Available Pro domain credits</p>
            </div>
            <Link to="/checkout/domain-credit">
              <Button variant="primary" size="sm">Add domain credit — {domainCreditPlan.priceLabel}</Button>
            </Link>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Current plan" icon={<CreditCard className="w-5 h-5" />} />
        <CardBody>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-lg font-semibold text-gray-100">{billingData.currentPlan}</p>
              <p className="text-sm text-gray-500">$9.99/month · renews automatically · cancel anytime</p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => toast('Subscription management coming soon.', 'info')}>
              Manage subscription
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Purchase history" />
        <CardBody className="p-0">
          <div className="divide-y divide-ink-700/40">
            {billingData.purchaseHistory.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm text-gray-200">{p.item}</p>
                  <p className="text-xs text-gray-500">{p.id} · {p.date}</p>
                </div>
                <span className="text-sm font-medium text-gray-200">{p.amount}</span>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Invoices" action={<span className="text-xs text-gray-500">Download for your records</span>} />
        <CardBody className="p-0">
          <div className="divide-y divide-ink-700/40">
            {billingData.invoices.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-ink-800 border border-ink-700/50 flex items-center justify-center">
                    <Download className="w-4 h-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-200">{inv.description}</p>
                    <p className="text-xs text-gray-500">{inv.id} · {inv.date} · {inv.amount}</p>
                  </div>
                </div>
                <button onClick={() => toast('Invoice download started (demo).', 'info')} className="text-sm text-accent-400 hover:underline">
                  Download
                </button>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Upgrade options" icon={<ArrowUpCircle className="w-5 h-5" />} />
        <CardBody>
          <div className="grid sm:grid-cols-3 gap-4">
            {upgrades.map((plan) => (
              <div key={plan.id} className="surface p-4">
                <p className="text-sm font-semibold text-gray-100">{plan.name}</p>
                <p className="text-2xl font-bold text-gray-100 mt-1">{plan.priceLabel}</p>
                <p className="text-xs text-gray-500">{plan.billingNote}</p>
                <Link to={`/checkout/${plan.id}`} className="mt-3 block">
                  <span className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-semibold rounded-lg bg-ink-700 text-gray-100 hover:bg-ink-600 transition-colors">
                    {plan.cta}
                  </span>
                </Link>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
