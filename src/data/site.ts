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
  tagline: 'Security testing built for AI-powered and AI-generated applications.',
  email: 'support@pentor.net',
} as const;

export type NavItem = { label: string; to: string };

export const navItems: NavItem[] = [
  { label: 'AI Security', to: '/#ai-security' },
  { label: 'How It Works', to: '/#how-it-works' },
  { label: 'Pricing', to: '/#pricing' },
  { label: 'Human Pentest', to: '/#human-pentest' },
];

export const footerLinks = {
  product: [
    { label: 'AI App Security', to: '/#ai-security' },
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
  'Built for AI apps',
  'Safe, controlled checks',
  'Actionable fix guidance',
  'Traditional security included',
] as const;

export const howItWorks = [
  {
    step: 1,
    title: 'Enter your application domain',
    description: 'Submit the public domain of the AI-powered or AI-generated application you are authorized to test.',
  },
  {
    step: 2,
    title: 'Pentor maps the AI attack surface',
    description: 'Pentor examines client assets, exposed AI services, application endpoints, configuration signals, and traditional web-security controls.',
  },
  {
    step: 3,
    title: 'Receive prioritized AI security findings',
    description: 'Get a clear report explaining exposed secrets, costly misconfigurations, AI endpoint risks, and the fixes that matter first.',
  },
] as const;

export const whatPentorChecks = [
  {
    title: 'AI secret exposure',
    description: 'Client-side assets and public responses are reviewed for exposed LLM credentials, privileged backend keys, and sensitive configuration.',
  },
  {
    title: 'AI endpoint exposure',
    description: 'Public chat, generation, assistant, agent, and model-proxy endpoints are identified and assessed for unsafe exposure.',
  },
  {
    title: 'AI cost-abuse risk',
    description: 'Signals that could let unauthenticated or automated users consume paid model resources are highlighted.',
  },
  {
    title: 'Prompt and data leakage',
    description: 'Controlled checks look for prompt disclosure, sensitive context exposure, and unsafe model-response behavior.',
  },
  {
    title: 'Backend privilege exposure',
    description: 'Supabase, Firebase, storage, database, and service-role configuration mistakes commonly shipped by AI coding workflows.',
  },
  {
    title: 'AI stack intelligence',
    description: 'Public signals associated with model providers, AI SDKs, vector stores, frameworks, and AI application platforms.',
  },
  {
    title: 'Traditional web security',
    description: 'TLS, headers, cookies, DNS, public services, common misconfigurations, and known vulnerability indicators remain included.',
  },
  {
    title: 'Prioritized remediation',
    description: 'Findings are ranked by real business impact, with clear instructions for developers and non-security founders.',
  },
] as const;
