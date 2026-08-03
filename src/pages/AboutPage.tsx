import { Building2, CalendarDays, BrainCircuit, Globe2, Landmark, MapPin, Phone, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { site } from '@/data/site';

const foundations = [
  {
    icon: ShieldCheck,
    title: 'Security roots',
    text: 'Our history began in internet security, privacy infrastructure, network operations, and systems administration. Pentor brings that operational background into modern application security testing.',
  },
  {
    icon: BrainCircuit,
    title: 'Practical AI',
    text: 'We build AI-assisted products around a simple principle: automation should make complex technical work clearer, faster, and more actionable—not hide uncertainty behind a score.',
  },
  {
    icon: Globe2,
    title: 'Built for real businesses',
    text: 'Our platforms are designed for founders, developers, and growing teams that need serious technical capability without enterprise complexity or enterprise pricing.',
  },
];

export function AboutPage() {
  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent-500/25 bg-accent-500/10 text-xs font-medium text-accent-400 mb-6">
            <Building2 className="w-3.5 h-3.5" />
            Established in {site.founded}
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-50 tracking-tight">Built on internet security and technology experience dating back to 2011.</h1>
          <p className="text-lg text-gray-400 leading-relaxed mt-6">
            Pentor is operated by {site.company}, an active Delaware corporation founded in {site.founded}. We develop practical security and AI data-intelligence products that help businesses understand complex digital systems and act with confidence.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mt-12">
          <Stat icon={CalendarDays} value="2011" label="Year incorporated" />
          <Stat icon={Landmark} value="Delaware" label="U.S. corporation" />
          <Stat icon={ShieldCheck} value="Pentor" label="Security platform" />
        </div>

        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6 mt-6">
          <Card className="p-7 sm:p-9">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent-400 mb-3">Our company</p>
            <h2 className="text-2xl font-semibold text-gray-100">A durable corporate foundation for ambitious products.</h2>
            <div className="space-y-4 text-sm text-gray-400 leading-relaxed mt-5">
              <p>
                {site.company} is a Delaware corporation, benefiting from Delaware&apos;s well-established corporate-law framework and its clarity, predictability, and flexibility for businesses of every size.
              </p>
              <p>
                We maintain the corporate filings and governance required of an active Delaware corporation. That structure supports our long-term mission to build advanced AI data-intelligence and cybersecurity platforms with accountable operations, clear ownership, and professional standards.
              </p>
              <p>
                Pentor is the next chapter of that history: a controlled, authorization-first security testing platform built to turn technical findings into understandable business risk and concrete remediation steps.
              </p>
            </div>
          </Card>

          <Card className="p-7 sm:p-9 bg-gradient-to-br from-accent-500/10 to-cyber-500/5">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent-400 mb-3">Corporate details</p>
            <h2 className="text-xl font-semibold text-gray-100 mb-6">{site.company}</h2>
            <div className="space-y-5">
              <Detail icon={Landmark} label="Jurisdiction" value={site.jurisdiction} />
              <Detail icon={MapPin} label="Business address" value={site.address} />
              <Detail icon={Phone} label="Telephone" value={site.phone} href="tel:+19143632825" />
            </div>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-5 mt-6">
          {foundations.map(({ icon: Icon, title, text }) => (
            <Card key={title} className="p-6">
              <div className="w-10 h-10 rounded-lg border border-accent-500/25 bg-accent-500/10 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-accent-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-100">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed mt-2">{text}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, value, label }: { icon: typeof CalendarDays; value: string; label: string }) {
  return (
    <Card className="p-5 flex items-center gap-4">
      <Icon className="w-6 h-6 text-accent-400" />
      <div>
        <p className="text-xl font-bold text-gray-100">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </Card>
  );
}

function Detail({ icon: Icon, label, value, href }: { icon: typeof Landmark; label: string; value: string; href?: string }) {
  const content = <span className="text-sm text-gray-300 leading-relaxed">{value}</span>;
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-accent-400 shrink-0 mt-0.5" />
      <div>
        <p className="text-xs text-gray-600 mb-1">{label}</p>
        {href ? <a href={href} className="hover:text-accent-400 transition-colors">{content}</a> : content}
      </div>
    </div>
  );
}
