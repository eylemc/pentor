import { cn } from '@/lib/cn';
import { Check } from 'lucide-react';
import type { PricingPlan } from '@/data/pricing';

export function PricingCard({ plan, className }: { plan: PricingPlan; className?: string }) {
  return (
    <div
      className={cn(
        'relative surface shadow-card flex flex-col p-6 transition-all duration-300 hover:border-ink-600',
        plan.popular && 'border-accent-500/50 shadow-glow-accent',
        className,
      )}
    >
      {plan.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-accent-500 text-ink-950 shadow-glow-accent">
            {plan.badge}
          </span>
        </div>
      )}

      <div className="mb-5">
        <h3 className="text-lg font-semibold text-gray-100">{plan.name}</h3>
        <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
      </div>

      <div className="mb-5">
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-bold text-gray-100">{plan.priceLabel}</span>
          {plan.billing === 'monthly' && <span className="text-sm text-gray-500">/month</span>}
        </div>
        <p className="text-xs text-gray-500 mt-1.5">{plan.billingNote}</p>
      </div>

      <ul className="space-y-2.5 mb-6 flex-1">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm text-gray-300">
            <Check className="w-4 h-4 text-accent-400 shrink-0 mt-0.5" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <a
        href={plan.ctaTo}
        className={cn(
          'inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-all w-full',
          plan.popular
            ? 'bg-accent-500 text-ink-950 hover:bg-accent-400 shadow-glow-accent'
            : 'bg-ink-700 text-gray-100 hover:bg-ink-600 border border-ink-600/80',
        )}
      >
        {plan.cta}
      </a>
    </div>
  );
}
