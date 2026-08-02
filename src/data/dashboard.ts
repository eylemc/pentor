export interface DashboardDomain {
  id: string;
  domain: string;
  verification: 'verified' | 'pending' | 'expired';
  lastTest: string;
  monitoring: 'active' | 'paused' | 'off';
  score: number;
}

export const dashboardDomains: DashboardDomain[] = [
  {
    id: 'dom-1',
    domain: 'acme-widgets.com',
    verification: 'verified',
    lastTest: '2026-08-01',
    monitoring: 'active',
    score: 68,
  },
  {
    id: 'dom-2',
    domain: 'shop.acme-widgets.com',
    verification: 'verified',
    lastTest: '2026-07-28',
    monitoring: 'paused',
    score: 81,
  },
  {
    id: 'dom-3',
    domain: 'staging.acme-widgets.com',
    verification: 'pending',
    lastTest: '—',
    monitoring: 'off',
    score: 0,
  },
];

export interface DashboardTest {
  id: string;
  domain: string;
  package: string;
  status: 'completed' | 'in-progress' | 'queued' | 'failed';
  started: string;
  completed: string;
  score: number | null;
}

export const dashboardTests: DashboardTest[] = [
  {
    id: 'TST-2041',
    domain: 'acme-widgets.com',
    package: 'Pro Deep Scan',
    status: 'completed',
    started: '2026-08-01 14:20',
    completed: '2026-08-01 14:34',
    score: 68,
  },
  {
    id: 'TST-2038',
    domain: 'shop.acme-widgets.com',
    package: 'Pro Scan',
    status: 'completed',
    started: '2026-07-28 09:11',
    completed: '2026-07-28 09:18',
    score: 81,
  },
  {
    id: 'TST-2050',
    domain: 'acme-widgets.com',
    package: 'Pro Deep Scan',
    status: 'in-progress',
    started: '2026-08-02 08:02',
    completed: '—',
    score: null,
  },
];

export interface MonitoredDomain {
  id: string;
  domain: string;
  status: 'healthy' | 'attention' | 'new-finding';
  lastCheck: string;
  newFindings: number;
}

export const monitoredDomains: MonitoredDomain[] = [
  {
    id: 'mon-1',
    domain: 'acme-widgets.com',
    status: 'attention',
    lastCheck: '2026-08-02 06:00',
    newFindings: 2,
  },
  {
    id: 'mon-2',
    domain: 'shop.acme-widgets.com',
    status: 'healthy',
    lastCheck: '2026-08-02 06:00',
    newFindings: 0,
  },
];

export interface DashboardReport {
  id: string;
  title: string;
  domain: string;
  testType: string;
  date: string;
}

export const dashboardReports: DashboardReport[] = [
  {
    id: 'RPT-2041',
    title: 'Pro Deep Scan — acme-widgets.com',
    domain: 'acme-widgets.com',
    testType: 'Pro Deep Scan',
    date: '2026-08-01',
  },
  {
    id: 'RPT-2038',
    title: 'Pro Scan — shop.acme-widgets.com',
    domain: 'shop.acme-widgets.com',
    testType: 'Pro Scan',
    date: '2026-07-28',
  },
];

export interface HumanPentestRecord {
  id: string;
  domain: string;
  status: 'scope-review' | 'scheduled' | 'in-progress' | 'report-ready';
  scopeReview: 'pending' | 'approved' | 'awaiting-info';
  detail: string;
}

export const humanPentests: HumanPentestRecord[] = [
  {
    id: 'HPT-118',
    domain: 'acme-widgets.com',
    status: 'scope-review',
    scopeReview: 'awaiting-info',
    detail: 'Pentor is reviewing your requested scope. Additional environment notes requested.',
  },
];

export interface Invoice {
  id: string;
  description: string;
  date: string;
  amount: string;
}

export interface BillingData {
  currentPlan: string;
  domainCredits: number;
  purchaseHistory: { id: string; item: string; date: string; amount: string }[];
  invoices: Invoice[];
}

export const billingData: BillingData = {
  currentPlan: 'Continuous Monitoring',
  domainCredits: 2,
  purchaseHistory: [
    { id: 'INV-1042', item: 'Pro Scan — 3 domain credits', date: '2026-08-01', amount: '$19.90' },
    { id: 'INV-1041', item: 'Continuous Monitoring (monthly)', date: '2026-08-01', amount: '$9.99' },
    { id: 'INV-1038', item: 'Additional domain credit', date: '2026-07-28', amount: '$5.00' },
  ],
  invoices: [
    { id: 'INV-1042', description: 'Pro Scan — 3 credits', date: '2026-08-01', amount: '$19.90' },
    { id: 'INV-1041', description: 'Monitoring (Aug)', date: '2026-08-01', amount: '$9.99' },
    { id: 'INV-1038', description: 'Domain credit', date: '2026-07-28', amount: '$5.00' },
  ],
};

export interface AccountData {
  name: string;
  email: string;
  notifications: { type: string; enabled: boolean }[];
}

export const accountData: AccountData = {
  name: 'Jordan Avery',
  email: 'jordan@acme-widgets.com',
  notifications: [
    { type: 'New findings detected', enabled: true },
    { type: 'Monitoring change alerts', enabled: true },
    { type: 'Weekly security summary', enabled: false },
    { type: 'Product updates', enabled: false },
  ],
};

export const overviewStats = [
  { label: 'Verified domains', value: '2', icon: 'globe' },
  { label: 'Latest security score', value: '68/100', icon: 'shield' },
  { label: 'Open high-risk findings', value: '2', icon: 'alert' },
  { label: 'Monitoring status', value: 'Active', icon: 'activity' },
] as const;

export const recentTests = dashboardTests.slice(0, 3);
