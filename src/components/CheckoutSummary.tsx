import { ShieldCheck, Calendar, Check } from 'lucide-react';
import type { PricingPlan } from '@/data/pricing';
import { cn } from '@/lib/cn';

export function CheckoutSummary({
  plan,
  domain,
  acceptedTerms,
  onAcceptTerms,
  onContinue,
  loading,
}: {
  plan: PricingPlan;
  domain: string;
  acceptedTerms: boolean;
  onAcceptTerms: (v: boolean) => void;
  onContinue: () => void;
  loading?: boolean;
}) {
  return (
    <div className="surface-raised shadow-card overflow-hidden">
      <div className="p-6 border-b border-ink-700/50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-100">{plan.name}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{plan.billingNote}</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-gray-100">{plan.priceLabel}</span>
            {plan.billing === 'monthly' && <span className="text-sm text-gray-500">/mo</span>}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{plan.domainCredits ? 'Domain credits' : 'Domain'}</p>
            <p className="text-gray-200 mt-1 break-all">{plan.domainCredits ? `${plan.domainCredits} credit${plan.domainCredits === 1 ? '' : 's'}` : <span className="font-mono">{domain || '—'}</span>}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Billing</p>
            <p className="text-gray-200 mt-1 flex items-center gap-1.5">
              {plan.billing === 'monthly' ? (
                <><Calendar className="w-3.5 h-3.5 text-cyber-400" /> Monthly subscription</>
              ) : plan.billing === 'free' ? (
                'No charge'
              ) : (
                'One-time payment'
              )}
            </p>
          </div>
        </div>

        {plan.billing === 'monthly' && (
          <div className="rounded-lg border border-cyber-500/20 bg-cyber-500/5 p-3">
            <p className="text-xs text-cyber-400/90">
              This is a recurring subscription at $9.99/month. You can cancel anytime. Billing renews automatically until canceled.
            </p>
          </div>
        )}

        {plan.domainCredits && (
          <div className="rounded-lg border border-accent-500/20 bg-accent-500/5 p-3">
            <p className="text-xs text-accent-300/90">
              Each credit activates a Pro assessment for one verified domain. Credits do not expire until used; additional credits are $5 each.
            </p>
          </div>
        )}

        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">What's included</p>
          <ul className="space-y-2">
            {plan.features.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-gray-300">
                <Check className="w-4 h-4 text-accent-400 shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-accent-500/20 bg-accent-500/5 p-3.5 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-accent-400 shrink-0 mt-0.5" />
          <p className="text-xs text-gray-400">
            You must own or have explicit authorization to test this domain. Testing begins only after authorization is verified.
          </p>
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => onAcceptTerms(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-ink-600 bg-ink-900 text-accent-500 focus:ring-accent-500/40"
          />
          <span className="text-sm text-gray-400">
            I accept the Terms of Service and Responsible Use Policy, and confirm I am authorized to test this domain.
          </span>
        </label>

        <button
          onClick={onContinue}
          disabled={!acceptedTerms || loading}
          className={cn(
            'w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold rounded-xl transition-all',
            acceptedTerms
              ? 'bg-accent-500 text-ink-950 hover:bg-accent-400 shadow-glow-accent'
              : 'bg-ink-700 text-gray-500 cursor-not-allowed',
          )}
        >
          {loading && <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin-slow" />}
          Continue to Secure Checkout
        </button>
        <p className="text-xs text-gray-600 text-center">You'll be redirected to Stripe Checkout to complete payment securely.</p>
      </div>
    </div>
  );
}
