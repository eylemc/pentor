export const site = {
  brand: 'Pentor',
  domain: 'pentor.net',
  company: 'VPNMaster, Inc.',
  founded: 2011,
  jurisdiction: 'Delaware, United States',
  address: '501 Silverside Rd, Suite 105, Wilmington, DE 19809, United States',
  phone: '+1 914-363-2825',
  legalEmail: 'legal@pentor.net',
  securityEmail: 'security@pentor.net',
  tagline: 'We think like attackers, so you can stay protected.',
  email: 'support@pentor.net',
} as const;

export type NavItem = { label: string; to: string };

export const navItems: NavItem[] = [
  { label: 'How It Works', to: '/#how-it-works' },
  { label: 'Pricing', to: '/#pricing' },
  { label: 'Human Pentest', to: '/#human-pentest' },
];

export const footerLinks = {
  product: [
    { label: 'How It Works', to: '/#how-it-works' },
    { label: 'Pricing', to: '/#pricing' },
    { label: 'Human Pentest', to: '/#human-pentest' },
    { label: 'Sample Report', to: '/report' },
  ],
  legal: [
    { label: 'Responsible Use', to: '/responsible-use' },
    { label: 'Terms of Service', to: '/terms' },
    { label: 'Privacy Policy', to: '/privacy' },
  ],
  company: [
    { label: 'About Us', to: '/about' },
    { label: 'Contact', to: '/contact' },
    { label: 'Status', to: '/status' },
  ],
} as const;

export const trustIndicators = [
  'Safe, controlled checks',
  'Clear remediation instructions',
  'Human testing available',
  'Built for small businesses',
] as const;

export const howItWorks = [
  {
    step: 1,
    title: 'Enter your domain',
    description: 'Tell us which website you want tested. We normalize the address and get it ready for a controlled assessment.',
  },
  {
    step: 2,
    title: 'Verify authorization by email',
    description: 'Pentor sends a verification link to an administrative email on your domain. We only test after you confirm you are authorized.',
  },
  {
    step: 3,
    title: 'Receive your security report',
    description: 'Get a clear, prioritized report with plain-language explanations and recommended fixes you can act on right away.',
  },
] as const;

export const whatPentorChecks = [
  {
    title: 'Web application exposure',
    description: 'Publicly reachable pages, endpoints, and application surfaces that could be reached by an attacker.',
  },
  {
    title: 'Security headers and TLS',
    description: 'Transport encryption and browser security headers that protect data in transit and at rest in the browser.',
  },
  {
    title: 'Publicly exposed services',
    description: 'Services and ports visible to the internet that may not need to be publicly reachable.',
  },
  {
    title: 'Known vulnerability indicators',
    description: 'Signals tied to publicly disclosed issues in software and components your site depends on.',
  },
  {
    title: 'Misconfiguration risks',
    description: 'Common setup mistakes that accidentally expose data or weaken your defenses.',
  },
  {
    title: 'Authentication and session risks',
    description: 'How logins, sessions, and cookies are handled — and where those choices could be abused.',
  },
  {
    title: 'Domain and DNS security signals',
    description: 'DNS records and email-authentication signals that help prevent spoofing and impersonation.',
  },
  {
    title: 'Actionable remediation priorities',
    description: 'Every finding is ranked by risk so you know what to fix first, with clear recommended actions.',
  },
] as const;
