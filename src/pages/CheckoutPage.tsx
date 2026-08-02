import { useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { CheckoutSummary } from '@/components/CheckoutSummary';
import { getPlan } from '@/data/pricing';
import { useSession } from '@/components/ui/Session';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/services/api';

export function CheckoutPage() {
  const { packageId } = useParams<{ packageId: string }>();
  const plan = packageId ? getPlan(packageId) : undefined;
  const { pendingDomain } = useSession();
  const { toast } = useToast();
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!plan) return <Navigate to="/#pricing" replace />;

  const domain = pendingDomain ?? 'yourdomain.com';

  const handleContinue = async () => {
    setLoading(true);
    try {
      await api.createCheckoutSession(plan.id, domain);
      toast('Redirecting to Stripe Checkout... (demo)', 'info');
      setTimeout(() => toast('This is a demo. Stripe integration coming soon.', 'info'), 1500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-12 lg:py-16 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto">
      <Link to="/#pricing" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to pricing
      </Link>

      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-accent-500/10 border border-accent-500/20 text-xs text-accent-300 mb-3">
          <ShieldCheck className="w-3.5 h-3.5" />
          Secure checkout
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-50">Review your order</h1>
        <p className="text-sm text-gray-500 mt-1">Confirm the details before proceeding to payment.</p>
      </div>

      <CheckoutSummary
        plan={plan}
        domain={domain}
        acceptedTerms={acceptedTerms}
        onAcceptTerms={setAcceptedTerms}
        onContinue={handleContinue}
        loading={loading}
      />
    </div>
  );
}
