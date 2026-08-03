import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { LinkButton } from '@/components/ui/Button';
import { navItems } from '@/data/site';
import { cn } from '@/lib/cn';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const isHome = location.pathname === '/';
  const handleHashNav = (to: string) => {
    if (isHome && to.startsWith('/#')) {
      const el = document.querySelector(to.slice(1));
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={cn(
        'fixed top-0 inset-x-0 z-50 transition-all duration-300',
        scrolled ? 'bg-ink-950/85 backdrop-blur-md border-b border-ink-700/40' : 'bg-transparent',
      )}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Logo />

        <div className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              onClick={() => handleHashNav(item.to)}
              className="px-3.5 py-2 text-sm text-gray-400 hover:text-gray-100 transition-colors rounded-lg hover:bg-ink-800/60"
            >
              {item.label}
            </Link>
          ))}
          <Link to="/signin" className="px-3.5 py-2 text-sm text-gray-400 hover:text-gray-100 transition-colors">
            Sign In
          </Link>
        </div>

        <div className="hidden lg:flex items-center gap-3">
          <LinkButton to="/dashboard" variant="primary" size="md">
            <ShieldCheck className="w-4 h-4" />
            Test Your Site
          </LinkButton>
        </div>

        <button
          className="lg:hidden p-2 text-gray-300 hover:text-white"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="lg:hidden bg-ink-950/95 backdrop-blur-md border-b border-ink-700/40 animate-fade-in">
          <div className="px-4 py-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                onClick={() => handleHashNav(item.to)}
                className="block px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-ink-800/60 rounded-lg transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <Link to="/signin" className="block px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-ink-800/60 rounded-lg transition-colors">
              Sign In
            </Link>
            <div className="pt-3">
              <LinkButton to="/dashboard" variant="primary" size="md" className="w-full" onClick={() => setMobileOpen(false)}>
                <ShieldCheck className="w-4 h-4" />
                Test Your Site
              </LinkButton>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export function NavbarSpacer() {
  return <div className="h-16" />;
}
