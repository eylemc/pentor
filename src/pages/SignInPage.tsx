import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Lock } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

export function SignInPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast('Authentication is not connected yet. This is a demo.', 'info');
      navigate('/dashboard');
    }, 900);
  };

  return (
    <div className="min-h-screen flex flex-col bg-ink-950">
      <div className="absolute inset-0 bg-grid-faint bg-grid-sm opacity-30" />
      <div className="absolute inset-0 bg-radial-fade" />
      <div className="relative flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <Logo />
          </div>

          <div className="surface-raised shadow-card p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="inline-flex w-12 h-12 rounded-lg bg-accent-500/15 border border-accent-500/30 items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6 text-accent-400" />
              </div>
              <h1 className="text-xl font-semibold text-gray-100">
                {mode === 'signin' ? 'Welcome back' : 'Create your account'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {mode === 'signin' ? 'Sign in to your Pentor dashboard' : 'Start testing your site in minutes'}
              </p>
            </div>

            <div className="flex rounded-lg bg-ink-900/60 p-1 mb-6">
              <button
                onClick={() => setMode('signin')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${mode === 'signin' ? 'bg-ink-700 text-gray-100' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Sign In
              </button>
              <button
                onClick={() => setMode('signup')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${mode === 'signup' ? 'bg-ink-700 text-gray-100' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label htmlFor="name" className="label-base">Name</label>
                  <input id="name" type="text" required placeholder="Your name" className="input-base" />
                </div>
              )}
              <div>
                <label htmlFor="email" className="label-base">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input id="email" type="email" required placeholder="you@company.com" className="input-base pl-10" />
                </div>
              </div>
              <div>
                <label htmlFor="password" className="label-base">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input id="password" type="password" required placeholder="••••••••" className="input-base pl-10" />
                </div>
              </div>

              <Button type="submit" size="lg" loading={loading} className="w-full">
                {mode === 'signin' ? 'Sign In' : 'Create Account'}
              </Button>
            </form>

            <p className="mt-5 text-xs text-gray-600 text-center">
              By continuing you agree to the{' '}
              <Link to="/terms" className="text-accent-400 hover:underline">Terms</Link> and{' '}
              <Link to="/responsible-use" className="text-accent-400 hover:underline">Responsible Use Policy</Link>.
            </p>
          </div>

          <p className="mt-6 text-center text-sm text-gray-500">
            <Link to="/" className="text-gray-400 hover:text-gray-200 transition-colors">← Back to home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
