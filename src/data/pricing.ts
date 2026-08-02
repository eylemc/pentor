export type BillingType = 'one-time' | 'monthly' | 'free';

export interface PricingPlan {
  id: 'free' | 'limited' | 'advanced' | 'monitoring' | 'human';
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
}

export const pricingPlans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free Test',
    price: 0,
    priceLabel: '$0',
    billing: 'free',
    billingNote: 'No credit card required',
    description: 'A basic security snapshot to see where you stand today.',
    features: [
      'Basic security snapshot',
      'Limited safe checks',
      'Email authorization',
      'Summary results',
      'No credit card required',
    ],
    cta: 'Start Free',
    ctaTo: '/',
  },
  {
    id: 'limited',
    name: 'Pro Scan',
    price: 9.99,
    priceLabel: '$9.99',
    billing: 'one-time',
    billingNote: 'One-time payment',
    description: 'Expanded automated checks with risk prioritization.',
    features: [
      'Expanded automated checks',
      'More detailed findings',
      'Risk prioritization',
      'Fix recommendations',
      'Downloadable report',
    ],
    cta: 'Run Pro Scan',
    ctaTo: '/checkout/limited',
  },
  {
    id: 'advanced',
    name: 'Advanced Test',
    price: 29.99,
    priceLabel: '$29.99',
    billing: 'one-time',
    billingNote: 'One-time payment',
    description: 'Deeper automated assessment with AI-assisted analysis.',
    features: [
      'Deeper automated assessment',
      'Broader application checks',
      'AI-assisted finding analysis',
      'Detailed remediation guidance',
      'Downloadable professional report',
    ],
    cta: 'Run Advanced Test',
    ctaTo: '/checkout/advanced',
    popular: true,
    badge: 'Most Popular',
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

export function getPlan(id: string): PricingPlan | undefined {
  return pricingPlans.find((p) => p.id === id);
}
