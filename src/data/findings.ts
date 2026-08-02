export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'passed' | 'info';
export type FindingStatus = 'open' | 'acknowledged' | 'fixed' | 'accepted' | 'no_action';

export interface Finding {
  id: string;
  title: string;
  severity: Severity;
  confidence: 'High' | 'Medium' | 'Low';
  affectedArea: string;
  observed: string;
  impact: string;
  recommendation: string;
  references: string[];
  detectedAt: string;
  status: FindingStatus;
  category: string;
}

export const findings: Finding[] = [
  {
    id: 'FND-001',
    title: 'Missing Content Security Policy',
    severity: 'medium',
    confidence: 'High',
    affectedArea: 'HTTP response headers',
    observed:
      'No Content-Security-Policy header was returned on any tested response. This header helps the browser restrict which scripts and resources are allowed to run.',
    impact:
      'Without CSP, injected scripts have fewer restrictions, increasing the impact of cross-site scripting and content injection issues.',
    recommendation:
      'Add a Content-Security-Policy header to your web server or application framework. Start restrictive and broaden as needed while testing in staging first.',
    references: ['MDN: Content-Security-Policy', 'OWASP Secure Headers Project'],
    detectedAt: '2026-08-01T14:22:00Z',
    status: 'open',
    category: 'Security headers and TLS',
  },
  {
    id: 'FND-002',
    title: 'Outdated public component detected',
    severity: 'high',
    confidence: 'High',
    affectedArea: 'Web application stack',
    observed:
      'A publicly accessible component appears to be running a version with known disclosed security advisories.',
    impact:
      'Outdated components are a common entry point for attackers and can expose your application to well-documented attacks.',
    recommendation:
      'Update the affected component to the latest stable release and review the advisories for any required configuration changes.',
    references: ['Vendor security advisories', 'OWASP Dependency Management'],
    detectedAt: '2026-08-01T14:24:00Z',
    status: 'open',
    category: 'Known vulnerability indicators',
  },
  {
    id: 'FND-003',
    title: 'Secure cookie flag missing',
    severity: 'medium',
    confidence: 'High',
    affectedArea: 'Session cookies',
    observed:
      'One or more cookies set by the application were not marked with the Secure flag, meaning they could be transmitted over an unencrypted connection.',
    impact:
      'If a session cookie is sent over plain HTTP, it can be intercepted on an untrusted network, potentially allowing session takeover.',
    recommendation:
      'Set the Secure flag on all session and authentication cookies, and ensure the application is only served over HTTPS.',
    references: ['OWASP Session Management Cheat Sheet'],
    detectedAt: '2026-08-01T14:25:00Z',
    status: 'acknowledged',
    category: 'Authentication and session risks',
  },
  {
    id: 'FND-004',
    title: 'TLS configuration',
    severity: 'passed',
    confidence: 'High',
    affectedArea: 'Transport encryption',
    observed:
      'The TLS certificate is valid, trusted, and modern protocol versions are enabled. No weak cipher suites were detected.',
    impact: 'Properly configured TLS protects data in transit between visitors and your website.',
    recommendation: 'Maintain current TLS configuration and monitor for upcoming certificate renewals.',
    references: ['Mozilla SSL Configuration Generator'],
    detectedAt: '2026-08-01T14:20:00Z',
    status: 'fixed',
    category: 'Security headers and TLS',
  },
  {
    id: 'FND-005',
    title: 'Exposed development endpoint',
    severity: 'high',
    confidence: 'Medium',
    affectedArea: 'Application routing',
    observed:
      'A development or debug endpoint appears to be reachable from the public internet and returns internal information.',
    impact:
      'Exposed debug surfaces can leak internal paths, configuration, and sometimes credentials, giving attackers a map of your application.',
    recommendation:
      'Restrict or disable development and debug endpoints in production, or gate them behind authentication and network restrictions.',
    references: ['OWASP Configuration Management'],
    detectedAt: '2026-08-01T14:26:00Z',
    status: 'open',
    category: 'Misconfiguration risks',
  },
  {
    id: 'FND-006',
    title: 'X-Frame-Options header absent',
    severity: 'low',
    confidence: 'High',
    affectedArea: 'HTTP response headers',
    observed: 'The X-Frame-Options or frame-ancestors directive was not present on tested responses.',
    impact: 'Without frame protection, the page can be embedded by other sites, enabling clickjacking attacks.',
    recommendation: 'Set X-Frame-Options or a CSP frame-ancestors directive to prevent unauthorized embedding.',
    references: ['OWASP Clickjacking Defense Cheat Sheet'],
    detectedAt: '2026-08-01T14:27:00Z',
    status: 'open',
    category: 'Security headers and TLS',
  },
  {
    id: 'FND-007',
    title: 'Directory listing enabled',
    severity: 'low',
    confidence: 'Medium',
    affectedArea: 'Web server configuration',
    observed: 'Directory listing appears enabled on a public path, exposing a file index to visitors.',
    impact: 'Exposed file listings can reveal sensitive files, backups, or configuration that should not be public.',
    recommendation: 'Disable directory listing on your web server for public-facing paths.',
    references: ['Server hardening documentation'],
    detectedAt: '2026-08-01T14:28:00Z',
    status: 'accepted',
    category: 'Misconfiguration risks',
  },
  {
    id: 'FND-008',
    title: 'HSTS header not set',
    severity: 'low',
    confidence: 'High',
    affectedArea: 'HTTP response headers',
    observed: 'The Strict-Transport-Security header was not returned, so browsers are not instructed to always use HTTPS.',
    impact: 'Without HSTS, first-time or returning visitors could be downgraded to an unencrypted connection.',
    recommendation: 'Enable HSTS with a reasonable max-age once HTTPS is confirmed working site-wide.',
    references: ['MDN: Strict-Transport-Security'],
    detectedAt: '2026-08-01T14:29:00Z',
    status: 'open',
    category: 'Security headers and TLS',
  },
  {
    id: 'FND-009',
    title: 'DNSSEC not enabled',
    severity: 'low',
    confidence: 'Medium',
    affectedArea: 'DNS configuration',
    observed: 'The domain does not appear to have DNSSEC enabled.',
    impact: 'Without DNSSEC, DNS responses are not cryptographically protected against tampering.',
    recommendation: 'Consider enabling DNSSEC with your domain registrar or DNS provider.',
    references: ['ICANN: DNSSEC'],
    detectedAt: '2026-08-01T14:30:00Z',
    status: 'open',
    category: 'Domain and DNS security signals',
  },
  {
    id: 'FND-010',
    title: 'Verbose server header present',
    severity: 'info',
    confidence: 'High',
    affectedArea: 'HTTP response headers',
    observed: 'The Server header discloses software name and version information.',
    impact: 'Version disclosure makes it easier for attackers to target known issues in that specific version.',
    recommendation: 'Configure your web server to suppress or minimize version information in the Server header.',
    references: ['OWASP Information Exposure'],
    detectedAt: '2026-08-01T14:31:00Z',
    status: 'open',
    category: 'Security headers and TLS',
  },
];

export const severityCounts = {
  critical: 0,
  high: 2,
  medium: 3,
  low: 4,
  passed: 18,
} as const;

export const securityScore = 68;

export const sampleReportSummary = {
  score: securityScore,
  riskLevel: 'Elevated',
  riskSummary:
    'Your website shows a moderate level of exposure. Two high-risk issues and several medium-risk issues should be addressed. No critical vulnerabilities were detected, but the exposed development endpoint and outdated component increase the chance of a successful attack.',
};
