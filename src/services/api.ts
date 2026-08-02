import type { Finding } from '@/data/findings';
import { dashboardDomains, dashboardTests, dashboardReports, humanPentests, monitoredDomains, billingData, accountData } from '@/data/dashboard';
import { pricingPlans, getPlan } from '@/data/pricing';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://95-179-169-114.sslip.io').replace(/\/$/, '');

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `Pentor API request failed (${response.status}).`);
  return payload as T;
}

export interface VerificationRequest {
  domain: string;
  email: string;
  authorized: boolean;
  acceptedTerms: boolean;
  termsVersion: string;
  acceptedAt: string;
}

export interface ScanConfig {
  domain: string;
  testType: string;
  acceptedAdvancedRisk?: boolean;
  termsVersion?: string;
  acceptedAt?: string;
}

export interface ScanStatusResponse {
  domain: string;
  testType: string;
  startedAt: string;
  phase: number;
  phases: string[];
  complete: boolean;
  error?: string | null;
  log: string[];
}

export interface ReportResponse {
  domain: string;
  tier?: string;
  score: number;
  severityCounts: { critical: number; high: number; medium: number; low: number; passed: number };
  findings: Finding[];
  summary: string;
  generatedAt: string;
  scanCoverage?: {
    completed: boolean;
    rawMatches: number;
    uniqueMatches: number;
    duplicatesSuppressed: number;
    passes: { name: string; source: string; status: string; elapsedMs?: number; matches?: number }[];
    limitations: string[];
  };
}

export interface CheckoutSession {
  sessionId: string;
  packageId: string;
  domain: string;
  amount: number;
  billing: string;
  url: string;
}

export interface HumanPentestRequest {
  domain: string;
  company: string;
  contactName: string;
  email: string;
  appType: string;
  scope: string;
  authRequired: 'yes' | 'no';
  preferredWindow: string;
  envNotes: string;
  environment: 'production' | 'staging';
  authorized: boolean;
}

export interface DomainSummary {
  id: string;
  domain: string;
  verification: 'verified' | 'pending' | 'expired';
  lastTest: string;
  monitoring: 'active' | 'paused' | 'off';
  score: number;
}

class ApiService {
  async validateDomain(domain: string): Promise<{ valid: boolean; normalized?: string; error?: string }> {
    return apiRequest('/api/domains/validate', { method: 'POST', body: JSON.stringify({ domain }) });
  }

  async requestDomainVerification(req: VerificationRequest): Promise<{ ok: true; sentTo: string }> {
    return apiRequest('/api/verifications', { method: 'POST', body: JSON.stringify(req) });
  }

  async confirmDomainVerification(domain: string): Promise<{ ok: true; verified: boolean }> {
    return apiRequest('/api/verifications/confirm-demo', { method: 'POST', body: JSON.stringify({ domain }) });
  }

  async startScan(config: ScanConfig): Promise<{ ok: true; scanId: string; startedAt: string }> {
    return apiRequest('/api/scans', { method: 'POST', body: JSON.stringify(config) });
  }

  async getScanStatus(scanId: string): Promise<ScanStatusResponse> {
    return apiRequest(`/api/scans/${encodeURIComponent(scanId)}`);
  }

  async getReport(scanId: string): Promise<ReportResponse> {
    return apiRequest(`/api/scans/${encodeURIComponent(scanId)}/report`);
  }

  async listDomains(): Promise<DomainSummary[]> {
    await delay(500);
    return dashboardDomains;
  }

  async createCheckoutSession(packageId: string, domain: string): Promise<CheckoutSession> {
    await delay(700);
    const plan = getPlan(packageId);
    return {
      sessionId: 'cs_test_' + Math.random().toString(36).slice(2, 10),
      packageId,
      domain,
      amount: plan?.price ?? 0,
      billing: plan?.billing ?? 'one-time',
      url: 'https://checkout.stripe.com/mock',
    };
  }

  async submitHumanPentestRequest(_req: HumanPentestRequest): Promise<{ ok: true; requestId: string }> {
    await delay(1000);
    return { ok: true, requestId: 'HPT-' + Math.floor(100 + Math.random() * 900) };
  }

  async listTests() {
    await delay(400);
    return dashboardTests;
  }
  async listReports() {
    await delay(400);
    return dashboardReports;
  }
  async listHumanPentests() {
    await delay(400);
    return humanPentests;
  }
  async listMonitored() {
    await delay(400);
    return monitoredDomains;
  }
  async getBilling() {
    await delay(400);
    return billingData;
  }
  async getAccount() {
    await delay(400);
    return accountData;
  }
  async listPlans() {
    await delay(200);
    return pricingPlans;
  }
}

export function normalizeDomain(input: string): string | null {
  if (!input) return null;
  let value = input.trim().toLowerCase();
  value = value.replace(/^https?:\/\//, '').replace(/^www\./, '');
  value = value.split('/')[0].split('?')[0].split('#')[0].split(':')[0];
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(value)) return null;
  const valid = /^(?!-)[a-z0-9-]{1,63}(\.[a-z0-9-]{1,63})+$/i.test(value);
  return valid ? value : null;
}

export const api = new ApiService();
