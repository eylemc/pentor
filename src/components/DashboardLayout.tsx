import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Globe, FlaskConical, Activity, FileText, UserCog,
  CreditCard, User, Menu, X, LogOut, ShieldCheck, ChevronRight,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { cn } from '@/lib/cn';

const sidebarItems = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/domains', label: 'Domains', icon: Globe },
  { to: '/dashboard/tests', label: 'Tests', icon: FlaskConical },
  { to: '/dashboard/monitoring', label: 'Monitoring', icon: Activity },
  { to: '/dashboard/reports', label: 'Reports', icon: FileText },
  { to: '/dashboard/human-pentests', label: 'Human Pentests', icon: UserCog },
  { to: '/dashboard/billing', label: 'Billing', icon: CreditCard },
  { to: '/dashboard/account', label: 'Account', icon: User },
];

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-ink-950 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-ink-700/40 bg-ink-900/60 fixed inset-y-0 left-0 z-30">
        <div className="h-16 flex items-center px-5 border-b border-ink-700/40">
          <Logo />
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {sidebarItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-accent-500/10 text-accent-300 border border-accent-500/20'
                    : 'text-gray-400 hover:text-gray-100 hover:bg-ink-800/60 border border-transparent',
                )
              }
            >
              <item.icon className="w-4.5 h-4.5 w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-ink-700/40 space-y-1">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-gray-100 hover:bg-ink-800/60 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Back to site
          </Link>
        </div>
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-ink-900 border-r border-ink-700/40 flex flex-col animate-slide-in-right">
            <div className="h-16 flex items-center justify-between px-5 border-b border-ink-700/40">
              <Logo onClick={() => setSidebarOpen(false)} />
              <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-white" aria-label="Close menu">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {sidebarItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                      isActive
                        ? 'bg-accent-500/10 text-accent-300'
                        : 'text-gray-400 hover:text-gray-100 hover:bg-ink-800/60',
                    )
                  }
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:pl-64 min-w-0">
        <div className="h-16 sticky top-0 z-20 bg-ink-950/85 backdrop-blur-md border-b border-ink-700/40 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 text-gray-300 hover:text-white"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Breadcrumb path={location.pathname} />
          </div>
          <Link
            to="/"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-accent-500 text-ink-950 hover:bg-accent-400 transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
            Test Your Site
          </Link>
        </div>
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

function Breadcrumb({ path }: { path: string }) {
  const parts = path.split('/').filter(Boolean);
  if (parts.length <= 1) {
    return <span className="text-sm font-medium text-gray-300">Dashboard</span>;
  }
  const label = parts[1].replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <nav className="flex items-center gap-1.5 text-sm">
      <Link to="/dashboard" className="text-gray-500 hover:text-gray-300">Dashboard</Link>
      <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
      <span className="font-medium text-gray-300">{label}</span>
    </nav>
  );
}
