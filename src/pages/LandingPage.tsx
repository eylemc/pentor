import { ShieldCheck, FileText, UserSearch, Building2, Mail, Search, Eye, ShieldAlert, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DomainInput } from '@/components/DomainInput';
import { PricingCard } from '@/components/PricingCard';
import { SeverityBadge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { LinkButton } from '@/components/ui/Button';
import { trustIndicators, howItWorks, whatPentorChecks } from '@/data/site';
import { pricingPlans } from '@/data/pricing';
import { findings, securityScore } from '@/data/findings';
import { faqItems } from '@/data/faq';

const previewFindings = ['FND-001', 'FND-002', 'FND-003', 'FND-004', 'FND-005'].map(
  (id) => findings.find((f) => f.id === id)!,
);

const trustIcons = [ShieldCheck, FileText, UserSearch, Building2];

export function LandingPage() {
  return (
    <div className="overflow-x-hidden">
      <Hero />
      <WhatPentorChecks />
      <HowItWorks />
      <SampleFindings />
      <HumanPentestSection />
      <PricingSection />
      <FaqSection />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative">
      <div className="absolute inset-0 bg-grid-faint bg-grid-sm opacity-40" />
      <div className="absolute inset-0 bg-radial-fade" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent-500/25 bg-accent-500/10 text-xs text-accent-300 mb-6 animate-fade-in">
            <ShieldCheck className="w-3.5 h-3.5" />
            AI App Security Platform
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-50 leading-[1.1] animate-fade-up">
            Built your app with AI?
            <br />
            Secure it before launch.
          </h1>
          <p className="mt-5 text-lg text-gray-400 leading-relaxed max-w-2xl animate-fade-up" style={{ animationDelay: '0.1s' }}>
            Scan AI-powered and AI-generated applications for leaked secrets, exposed AI endpoints, prompt-security risks, costly misconfigurations, and traditional web vulnerabilities.
          </p>
          <p className="mt-3 text-sm text-gray-500 max-w-2xl animate-fade-up" style={{ animationDelay: '0.15s' }}>
            Designed for applications built with tools such as Bolt, Lovable, Cursor, Claude Code, v0, and modern AI development stacks.
          </p>

          <div className="mt-8 max-w-xl animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <DomainInput large />
          </div>

          <div className="mt-5 animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <Link to="/report" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-accent-400 transition-colors">
              <FileText className="w-4 h-4" />
              View AI Security Report Preview
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fade-up" style={{ animationDelay: '0.4s' }}>
            {trustIndicators.map((indicator, i) => {
              const Icon = trustIcons[i];
              return (
                <div key={indicator} className="flex items-center gap-2 text-sm text-gray-400">
                  <Icon className="w-4 h-4 text-accent-400/70 shrink-0" />
                  <span>{indicator}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="max-w-2xl mb-12">
      <p className="text-xs font-semibold text-accent-400 uppercase tracking-wider mb-3">{eyebrow}</p>
      <h2 className="text-3xl sm:text-4xl font-bold text-gray-50 tracking-tight">{title}</h2>
      {subtitle && <p className="mt-4 text-lg text-gray-400 leading-relaxed">{subtitle}</p>}
    </div>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 lg:py-28 border-t border-ink-700/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="How It Works"
          title="From domain to prioritized AI security report"
          subtitle="Pentor combines AI-specific application checks with the traditional security coverage already expected from a serious scanner."
        />
        <div className="grid md:grid-cols-3 gap-6">
          {howItWorks.map((step, i) => {
            const icons = [Search, Mail, FileText];
            const Icon = icons[i];
            return (
              <Card key={step.step} className="p-6 hover:border-ink-600 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-accent-500/15 border border-accent-500/30 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-accent-400" />
                  </div>
                  <span className="text-3xl font-bold text-ink-600">{step.step}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-100">{step.title}</h3>
                <p className="text-sm text-gray-400 mt-2 leading-relaxed">{step.description}</p>
              </Card>
            );
          })}
        </div>
        <div className="mt-8 rounded-lg border border-accent-500/20 bg-accent-500/5 p-4 flex items-start gap-3 max-w-2xl">
          <ShieldCheck className="w-5 h-5 text-accent-400 shrink-0 mt-0.5" />
          <p className="text-sm text-gray-400">
            Pentor performs controlled checks only against targets you are authorized to test. Scan limits are designed to reduce disruption and avoid destructive behavior.
          </p>
        </div>
      </div>
    </section>
  );
}

function WhatPentorChecks() {
  return (
    <section id="ai-security" className="py-20 lg:py-28 border-t border-ink-700/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="AI App Security"
          title="Security checks built around how AI apps actually fail"
          subtitle="Pentor focuses on the mistakes that reach production when applications are assembled quickly with AI coding tools, model APIs, hosted backends, and modern AI frameworks."
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {whatPentorChecks.map((item, i) => {
            const icons = [Eye, ShieldCheck, Search, ShieldAlert, Eye, Mail, Globe, ShieldCheck];
            const Icon = icons[i % icons.length];
            return (
              <div key={item.title} className="surface p-5 hover:border-ink-600 transition-colors">
                <Icon className="w-5 h-5 text-accent-400 mb-3" />
                <h3 className="text-sm font-semibold text-gray-100">{item.title}</h3>
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{item.description}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-8 grid md:grid-cols-2 gap-4 max-w-4xl">
          <div className="rounded-lg border border-accent-500/20 bg-accent-500/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent-400">Primary focus</p>
            <p className="mt-2 text-base font-semibold text-gray-100">AI application risk</p>
            <p className="mt-2 text-sm text-gray-400">Secrets, model endpoints, backend privileges, prompt behavior, data exposure, and cost abuse.</p>
          </div>
          <div className="rounded-lg border border-ink-700/50 bg-ink-800/40 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Included foundation</p>
            <p className="mt-2 text-base font-semibold text-gray-100">Traditional web security</p>
            <p className="mt-2 text-sm text-gray-400">TLS, headers, DNS, cookies, public services, known vulnerabilities, and common misconfigurations.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function SampleFindings() {
  return (
    <section className="py-20 lg:py-28 border-t border-ink-700/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Report Preview"
          title="AI risk first. Traditional findings included."
          subtitle="The current preview uses mock findings while the AI-specific detection engine is being expanded."
        />
        <Card raised className="overflow-hidden">
          <div className="p-5 border-b border-ink-700/50 flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs text-gray-500">Demo preview · example.com</p>
              <h3 className="text-base font-semibold text-gray-100 mt-0.5">Pentor Security Report Preview</h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-warn-400">{securityScore}</span>
              <span className="text-xs text-gray-500">/100</span>
            </div>
          </div>
          <div className="divide-y divide-ink-700/40">
            {previewFindings.map((f) => (
              <div key={f.id} className="p-5 flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-5">
                <div className="shrink-0">
                  <SeverityBadge severity={f.severity} size="md" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-100">{f.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{f.observed}</p>
                  <div className="mt-3 grid sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-gray-600 uppercase tracking-wider font-semibold mb-0.5">Business impact</p>
                      <p className="text-gray-400">{f.impact}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 uppercase tracking-wider font-semibold mb-0.5">Recommended action</p>
                      <p className="text-gray-400">{f.recommendation}</p>
                    </div>
                  </div>
                </div>
                <div className="shrink-0 text-xs text-gray-500 sm:text-right">
                  <p className="uppercase tracking-wider font-semibold text-gray-600 mb-0.5">Status</p>
                  <p className={f.status === 'fixed' ? 'text-accent-300' : 'text-warn-400'}>
                    {f.status === 'fixed' ? 'Passed' : 'Open'}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-5 border-t border-ink-700/50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-600">Mock data shown for demonstration purposes.</p>
            <LinkButton to="/report" variant="outline" size="sm">View Full Sample Report</LinkButton>
          </div>
        </Card>
      </div>
    </section>
  );
}

function HumanPentestSection() {
  return (
    <section id="human-pentest" className="py-20 lg:py-28 border-t border-ink-700/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <SectionHeading
              eyebrow="Human AI App Pentest"
              title="Need an expert to investigate what automation cannot prove?"
              subtitle="A vetted white-hat specialist manually examines your authorized AI application, validates attack paths, and delivers a professional report."
            />
            <ul className="space-y-3 mb-8">
              {[
                'AI application attack-path analysis',
                'Manual validation of automated findings',
                'Authentication and authorization testing',
                'Prompt, model, and backend abuse review',
                'Professional PDF report',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-gray-300">
                  <ShieldCheck className="w-4 h-4 text-accent-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <LinkButton to="/human-pentest" size="lg">
                <UserSearch className="w-4 h-4" />
                Request Human Pentest
              </LinkButton>
              <div>
                <p className="text-2xl font-bold text-gray-100">$399</p>
                <p className="text-xs text-gray-500">one-time · scheduled after scope review</p>
              </div>
            </div>
            <div className="mt-6 rounded-lg border border-accent-500/20 bg-accent-500/5 p-4 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-accent-400 shrink-0 mt-0.5" />
              <p className="text-sm text-gray-400">
                Scope and authorization are confirmed before manual testing begins.
              </p>
            </div>
          </div>

          <Card raised className="p-6 lg:p-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-ink-700/40">
                <div className="w-12 h-12 rounded-lg bg-accent-500/15 border border-accent-500/30 flex items-center justify-center">
                  <UserSearch className="w-6 h-6 text-accent-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-100">Manual AI application assessment</h3>
                  <p className="text-xs text-gray-500">Vetted white-hat specialists</p>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Approach', value: 'Manual, attacker-mindset testing' },
                  { label: 'AI scope', value: 'Models, prompts, endpoints, data and tools' },
                  { label: 'Validation', value: 'Every reported issue confirmed by a human' },
                  { label: 'Output', value: 'Professional report with prioritized fixes' },
                  { label: 'Authorization', value: 'Required and confirmed before testing' },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center py-2 border-b border-ink-700/30 last:border-0">
                    <span className="text-sm text-gray-500">{row.label}</span>
                    <span className="text-sm text-gray-200 text-right">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section id="pricing" className="py-20 lg:py-28 border-t border-ink-700/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Pricing"
          title="Start with an AI app security check"
          subtitle="Run the free scan, unlock deeper AI and traditional security findings, or add a human specialist when the application needs manual validation."
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {pricingPlans.map((plan) => (
            <PricingCard key={plan.id} plan={plan} className={plan.popular ? 'lg:translate-y-[-8px]' : ''} />
          ))}
        </div>
        <p className="mt-8 text-xs text-gray-600 text-center max-w-2xl mx-auto">
          Exact AI-specific coverage varies by package and detected application surface. No automated or human test can prove the absence of every vulnerability.
        </p>
      </div>
    </section>
  );
}

function FaqSection() {
  return (
    <section className="py-20 lg:py-28 border-t border-ink-700/30">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="FAQ" title="Questions, answered" />
        <div className="space-y-3">
          {faqItems.map((item) => (
            <details key={item.question} className="surface group">
              <summary className="flex items-center justify-between gap-4 p-5 cursor-pointer text-sm font-medium text-gray-200 list-none">
                {item.question}
                <span className="text-accent-400 transition-transform group-open:rotate-45 shrink-0 text-xl leading-none">+</span>
              </summary>
              <div className="px-5 pb-5 text-sm text-gray-400 leading-relaxed">
                {item.answer}
              </div>
            </details>
          ))}
        </div>
        <div className="mt-10 text-center">
          <p className="text-sm text-gray-500 mb-4">Ready to check your AI application?</p>
          <LinkButton to="/dashboard" size="lg">
            <ShieldCheck className="w-4 h-4" />
            Scan Your AI App
          </LinkButton>
        </div>
      </div>
    </section>
  );
}
