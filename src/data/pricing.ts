export type BillingType = 'one-time' | 'monthly' | 'free';

export interface PricingPlan {
  id: 'free' | 'pro' | 'domain-credit' | 'monitoring' | 'human';
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
    name: 'Free Scan',
    price: 0,
    priceLabel: '$0',
    billing: 'free',
    billingNote: 'No credit card required',
    description: 'Run the same fast standard checks as Pro and preview the most important findings.',
    features: [
      'Pro-standard network & app checks',
      'Pro-standard database checks',
      'Passed checks fully visible',
      'Top security findings preview',
      'Additional findings blurred',
      'Email authorization',
      'No credit card required',
    ],
    cta: 'Start Free',
    ctaTo: '/',
  },
  {
    id: 'pro',
    name: 'Pro Scan',
    price: 19.90,
    priceLabel: '$19.90',
    billing: 'one-time',
    billingNote: 'One-time payment · includes 3 domain credits',
    description: 'One professional assessment with flexible depth and no confusing tiers.',
    features: [
      '3 verified domain credits',
      'Network & application security',
      'SQL, NoSQL & database exposure checks',
      'Optional Deep Vulnerability Scan',
      'Step-by-step remediation guidance',
      'Professional PDF report',
      'Additional domains only $5 each',
    ],
    cta: 'Get Pro — 3 Domains',
    ctaTo: '/checkout/pro',
    popular: true,
    badge: 'Best Value',
    domainCredits: 3,
  },
  {
    id: 'monitoring',
    name: 'Continuous Monitoring',
    price: 9.99,
    priceLabel: '$9.99',
    billing: 'monthly',
    billingNote: '$9.99/month — cancel anytime',
    description: 'Scheduled recurring checks with new-risk alerts.',
    features: [
      'Scheduled recurring checks',
      'Change detection',
      'New-risk notifications',
      'Security history',
      'Cancel anytime',
    ],
    cta: 'Start Monitoring',
    ctaTo: '/checkout/monitoring',
  },
  {
    id: 'human',
    name: 'Human Pentest',
    price: 399,
    priceLabel: '$399',
    billing: 'one-time',
    billingNote: 'One-time — scheduled after scope review',
    description: 'A manual white-hat assessment by a vetted specialist.',
    features: [
      'Manual white-hat assessment',
      'Validated vulnerabilities',
      'Attack-path analysis',
      'Detailed fix instructions',
      'Professional report',
    ],
    cta: 'Request Human Test',
    ctaTo: '/human-pentest',
  },
];

export const domainCreditPlan: PricingPlan = {
  id: 'domain-credit',
  name: 'Additional Domain Credit',
  price: 5,
  priceLabel: '$5',
  billing: 'one-time',
  billingNote: 'One-time payment · never expires until used',
  description: 'Add another verified domain to your Pro security workspace.',
  features: [
    '1 additional domain credit',
    'Network & application security',
    'Database & injection security',
    'Optional Deep Vulnerability Scan',
    'Professional PDF report',
  ],
  cta: 'Buy Domain Credit',
  ctaTo: '/checkout/domain-credit',
  domainCredits: 1,
};

export function getPlan(id: string): PricingPlan | undefined {
  if (id === 'limited' || id === 'advanced') return pricingPlans.find((plan) => plan.id === 'pro');
  return id === 'domain-credit' ? domainCreditPlan : pricingPlans.find((plan) => plan.id === id);
}
