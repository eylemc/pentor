import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { site, footerLinks } from '@/data/site';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-ink-700/40 bg-ink-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          <div className="col-span-2 md:col-span-1">
            <Logo />
            <p className="mt-4 text-sm text-gray-500 leading-relaxed max-w-xs">{site.tagline}</p>
            <p className="mt-4 text-xs text-gray-600">
              Pentor is operated by {site.company}, a Delaware corporation founded in {site.founded}.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Product</h4>
            <ul className="space-y-2.5">
              {footerLinks.product.map((l) => (
                <li key={l.label}>
                  <FooterLink to={l.to}>{l.label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Legal</h4>
            <ul className="space-y-2.5">
              {footerLinks.legal.map((l) => (
                <li key={l.label}>
                  <FooterLink to={l.to}>{l.label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Company</h4>
            <ul className="space-y-2.5">
              {footerLinks.company.map((l) => (
                <li key={l.label}>
                  <FooterLink to={l.to}>{l.label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-ink-700/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <ShieldCheck className="w-4 h-4 text-accent-500" />
            <span>Authorization required for all testing.</span>
          </div>
          <p className="text-xs text-gray-600">
            © {year} {site.company}. All rights reserved. Pentor™ is a trademark of {site.company}.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="text-sm text-gray-500 hover:text-accent-400 transition-colors">
      {children}
    </Link>
  );
}
