export type BillingType = 'one-time' | 'monthly' | 'free';

export interface PricingPlan {
  id: 'free' | 'limited' | 'advanced' | 'monitoring' | 'human' | 'domain-credit';
  name: string;
  price: number;
  priceLabel: string;
  billing: BillingType;
  billingNote: string;
  description: string;
  features: string[];
  cta: string;
  ctaTo: string;
  popular?: boolean;
  badge?: string;
  domainCredits?: number;
}

export const pricingPlans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free AI Scan',
    price: 0,
    priceLabel: '$0',
    billing: 'free',
    billingNote: 'No credit card required',
    description: 'A fast AI application security snapshot with visible risk signals.',
    features: [
      'AI application surface snapshot',
      'Traditional security baseline',
      'Passed checks visible',
      'Selected findings revealed',
      'No credit card required',
    ],
    cta: 'Scan AI App Free',
    ctaTo: '/',
  },
  {
    id: 'limited',
    name: 'Pro AI Scan',
    price: 9.99,
    priceLabel: '$9.99',
    billing: 'one-time',
    billingNote: 'One-time payment',
    description: 'Unlock the complete automated AI and web-security report.',
    features: [
      'Full AI security findings',
      'Exposed secret analysis',
      'AI endpoint risk signals',
      'Prioritized fix guidance',
      'Downloadable report',
    ],
    cta: 'Run Pro AI Scan',
    ctaTo: '/checkout/limited',
  },
  {
    id: 'advanced',
    name: 'Deep AI Assessment',
    price: 29.99,
    priceLabel: '$29.99',
    billing: 'one-time',
    billingNote: 'One-time payment',
    description: 'Deeper automated analysis across the AI and traditional attack surface.',
    features: [
      'Everything in Pro AI Scan',
      'Deep application assessment',
      'Broader endpoint and exposure checks',
      'Advanced risk correlation',
      'Professional remediation report',
    ],
    cta: 'Run Deep Assessment',
    ctaTo: '/checkout/advanced',
    popular: true,
    badge: 'Most Popular',
  },
  {
    id: 'monitoring',
    name: 'AI Security Monitoring',
    price: 9.99,
    priceLabel: '$9.99',
    billing: 'monthly',
    billingNote: '$9.99/month — cancel anytime',
    description: 'Recurring checks for new AI exposure and web-security regressions.',
    features: [
      'Scheduled AI app scans',
      'Deployment change detection',
      'New-risk notifications',
      'Security history',
      'Cancel anytime',
    ],
    cta: 'Start AI Monitoring',
    ctaTo: '/checkout/monitoring',
  },
  {
    id: 'human',
    name: 'Human AI Pentest',
    price: 399,
    priceLabel: '$399',
    billing: 'one-time',
    billingNote: 'One-time — scheduled after scope review',
    description: 'A manual AI application assessment by a vetted white-hat specialist.',
    features: [
      'Manual AI attack-path assessment',
      'Validated vulnerabilities',
      'Prompt, endpoint and backend review',
      'Detailed fix instructions',
      'Professional report',
    ],
    cta: 'Request Human Pentest',
    ctaTo: '/human-pentest',
  },
];

export const domainCreditPlan: PricingPlan = {
  id: 'domain-credit',
  name: 'AI App Domain Credit',
  price: 5,
  priceLabel: '$5',
  billing: 'one-time',
  billingNote: 'One-time payment',
  description: 'Add one reusable Pro AI Scan credit for an authorized domain.',
  features: [
    'One Pro AI Scan domain credit',
    'Full AI and web-security findings',
    'Prioritized remediation guidance',
    'Credit remains available until used',
  ],
  cta: 'Add Domain Credit',
  ctaTo: '/checkout/domain-credit',
  domainCredits: 1,
};

export function getPlan(id: string): PricingPlan | undefined {
  if (id === domainCreditPlan.id) return domainCreditPlan;
  return pricingPlans.find((p) => p.id === id);
}
