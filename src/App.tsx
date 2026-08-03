import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PublicLayout } from '@/components/PublicLayout';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ToastProvider } from '@/components/ui/Toast';
import { SessionProvider } from '@/components/ui/Session';

import { LandingPage } from '@/pages/LandingPage';
import { VerifyPage } from '@/pages/VerifyPage';
import { ScanPage } from '@/pages/ScanPage';
import { ReportPage } from '@/pages/ReportPage';
import { CheckoutPage } from '@/pages/CheckoutPage';
import { HumanPentestPage } from '@/pages/HumanPentestPage';
import { SignInPage } from '@/pages/SignInPage';
import { LegalPage } from '@/pages/LegalPage';
import { AboutPage } from '@/pages/AboutPage';

import { DashboardOverview } from '@/pages/dashboard/DashboardOverview';
import { DashboardDomains } from '@/pages/dashboard/DashboardDomains';
import { DashboardTests } from '@/pages/dashboard/DashboardTests';
import { DashboardMonitoring } from '@/pages/dashboard/DashboardMonitoring';
import { DashboardReports } from '@/pages/dashboard/DashboardReports';
import { DashboardHumanPentests } from '@/pages/dashboard/DashboardHumanPentests';
import { DashboardBilling } from '@/pages/dashboard/DashboardBilling';
import { DashboardAccount } from '@/pages/dashboard/DashboardAccount';

export default function App() {
  return (
    <SessionProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/verify" element={<VerifyPage />} />
              <Route path="/scan" element={<ScanPage />} />
              <Route path="/report" element={<ReportPage />} />
              <Route path="/checkout/:packageId" element={<CheckoutPage />} />
              <Route path="/human-pentest" element={<HumanPentestPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/terms" element={<LegalPage type="terms" />} />
              <Route path="/privacy" element={<LegalPage type="privacy" />} />
              <Route path="/responsible-use" element={<LegalPage type="responsible-use" />} />
              <Route path="/contact" element={<LegalPage type="contact" />} />
              <Route path="/status" element={<LegalPage type="status" />} />
            </Route>

            <Route path="/signin" element={<SignInPage />} />

            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardOverview />} />
              <Route path="domains" element={<DashboardDomains />} />
              <Route path="tests" element={<DashboardTests />} />
              <Route path="monitoring" element={<DashboardMonitoring />} />
              <Route path="reports" element={<DashboardReports />} />
              <Route path="human-pentests" element={<DashboardHumanPentests />} />
              <Route path="billing" element={<DashboardBilling />} />
              <Route path="account" element={<DashboardAccount />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </SessionProvider>
  );
}
