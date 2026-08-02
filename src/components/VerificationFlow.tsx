import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail, ArrowRight, CheckCircle2, Clock, XCircle, RefreshCw, AlertCircle,
  ShieldCheck, ArrowLeft, Loader2,
} from 'lucide-react';
import { api } from '@/services/api';
import { useSession } from '@/components/ui/Session';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/cn';

type Phase = 'select' | 'sent' | 'waiting' | 'verified' | 'expired' | 'failed';

const adminPrefixes = ['admin', 'security', 'webmaster', 'hostmaster', 'postmaster'];

export function VerificationFlow({ domain }: { domain: string }) {
  const { setPendingPackage } = useSession();
  const { toast } = useToast();
  const [phase, setPhase] = useState<Phase>('select');
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedAdvancedRisk, setAcceptedAdvancedRisk] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [customEmail, setCustomEmail] = useState('');

  const isDemo = true;

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const email = selectedEmail ?? `${adminPrefixes[0]}@${domain}`;

  const handleSend = async () => {
    if (!authorized || !acceptedTerms) return;
    const target = customEmail || email;
    setSending(true);
    try {
      await api.requestDomainVerification({ domain, email: target, authorized, acceptedTerms, termsVersion: '1.0', acceptedAt: new Date().toISOString() });
      setPhase('sent');
      setTimeout(() => setPhase('waiting'), 1500);
      setCooldown(30);
      toast(`Verification link sent to ${target}.`, 'success');
    } catch {
      toast('Could not send verification email. Try again.', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleDemoConfirm = useCallback(async () => {
    setVerifying(true);
    try {
      await api.confirmDomainVerification(domain);
      setPhase('verified');
      toast('Authorization verified. Starting your test...', 'success');
    } catch {
      setPhase('failed');
    } finally {
      setVerifying(false);
    }
  }, [domain, toast]);

  const handleResend = async () => {
    if (cooldown > 0) return;
    setSending(true);
    try {
      await api.requestDomainVerification({ domain, email, authorized, acceptedTerms, termsVersion: '1.0', acceptedAt: new Date().toISOString() });
      setCooldown(30);
      toast('Verification link resent.', 'info');
    } finally {
      setSending(false);
    }
  };

  const canSend = authorized && acceptedTerms && (selectedEmail || customEmail);

  return (
    <div className="max-w-2xl mx-auto">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" />
        Return and edit domain
      </Link>

      <Card raised className="overflow-hidden">
        <div className="p-6 border-b border-ink-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent-500/15 border border-accent-500/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-accent-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-100">Verify authorization for {domain}</h1>
              <p className="text-sm text-gray-500 mt-0.5">Authorization must be confirmed before any testing begins.</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-400 leading-relaxed mb-6">
            To protect internet users and prevent unauthorized testing, Pentor sends a verification link
            to an administrative email address associated with the domain. Choose a conventional admin
            address below, or enter a custom administrative email you control.
          </p>

          {phase === 'select' && (
            <SelectPhase
              domain={domain}
              selectedEmail={selectedEmail}
              setSelectedEmail={setSelectedEmail}
              customEmail={customEmail}
              setCustomEmail={setCustomEmail}
              authorized={authorized}
              setAuthorized={setAuthorized}
              acceptedTerms={acceptedTerms}
              setAcceptedTerms={setAcceptedTerms}
              canSend={canSend}
              sending={sending}
              onSend={handleSend}
            />
          )}

          {phase === 'sent' && (
            <div className="text-center py-8">
              <Loader2 className="w-10 h-10 text-accent-400 mx-auto animate-spin-slow mb-4" />
              <h2 className="text-lg font-semibold text-gray-100">Sending verification link...</h2>
              <p className="text-sm text-gray-500 mt-1">Delivering to {email}</p>
            </div>
          )}

          {(phase === 'waiting' || phase === 'expired' || phase === 'failed') && (
            <WaitingPhase
              email={email}
              phase={phase}
              cooldown={cooldown}
              onResend={handleResend}
              sending={sending}
              onDemoConfirm={handleDemoConfirm}
              verifying={verifying}
              isDemo={isDemo}
            />
          )}

          {phase === 'verified' && (
            <div className="text-center py-8 animate-fade-in">
              <CheckCircle2 className="w-12 h-12 text-accent-400 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-100">Authorization verified</h2>
              <p className="text-sm text-gray-500 mt-1 mb-6">Your domain is authorized. Redirecting to your security test...</p>
              <label className="flex items-start gap-3 text-left rounded-lg border border-warn-500/25 bg-warn-500/5 p-4 mb-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedAdvancedRisk}
                  onChange={(e) => setAcceptedAdvancedRisk(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-ink-600 bg-ink-900 text-accent-500 focus:ring-accent-500/40"
                />
                <span className="text-xs text-gray-400 leading-relaxed">
                  <strong className="block text-gray-200 mb-1">Required for Advanced Scan</strong>
                  I specifically authorize Pentor to perform the Advanced Scan against {domain}. I confirm the target is within my authorized scope, acknowledge that security testing may cause alerts, blocking, charges, degraded performance, interruption, or data loss, and accept Sections 3–5, 15, and 16 of the <Link to="/terms" className="text-accent-400 hover:underline">Terms of Service</Link>.
                </span>
              </label>
              <div className="grid sm:grid-cols-3 gap-2.5">
                {[
                  ['free', 'Free Scan'],
                  ['pro', 'Test Pro Scan'],
                  ['advanced', 'Test Advanced'],
                ].map(([tier, label]) => (
                  <Link
                    key={tier}
                    to="/scan"
                    onClick={(event) => {
                      if (tier === 'advanced' && !acceptedAdvancedRisk) {
                        event.preventDefault();
                        toast('Accept the Advanced Scan authorization and risk notice first.', 'error');
                        return;
                      }
                      setPendingPackage(tier);
                    }}
                    aria-disabled={tier === 'advanced' && !acceptedAdvancedRisk}
                    className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors ${tier === 'advanced' && !acceptedAdvancedRisk ? 'bg-ink-700 text-gray-500 cursor-not-allowed' : 'bg-accent-500 text-ink-950 hover:bg-accent-400'}`}
                  >
                    {label} <ArrowRight className="w-4 h-4" />
                  </Link>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-3">Test mode: paid tiers are temporarily available only for the authorized LiqHeat allowlist.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function SelectPhase({
  domain, selectedEmail, setSelectedEmail, customEmail, setCustomEmail,
  authorized, setAuthorized, acceptedTerms, setAcceptedTerms, canSend, sending, onSend,
}: {
  domain: string;
  selectedEmail: string | null;
  setSelectedEmail: (v: string | null) => void;
  customEmail: string;
  setCustomEmail: (v: string) => void;
  authorized: boolean;
  setAuthorized: (v: boolean) => void;
  acceptedTerms: boolean;
  setAcceptedTerms: (v: boolean) => void;
  canSend: boolean | string;
  sending: boolean;
  onSend: () => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <p className="label-base">Choose an administrative email</p>
        <div className="grid sm:grid-cols-2 gap-2.5">
          {adminPrefixes.map((prefix) => {
            const addr = `${prefix}@${domain}`;
            return (
              <button
                key={prefix}
                onClick={() => {
                  setSelectedEmail(addr);
                  setCustomEmail('');
                }}
                className={cn(
                  'flex items-center gap-2.5 px-4 py-3 rounded-lg border text-sm transition-all text-left',
                  selectedEmail === addr
                    ? 'border-accent-500/60 bg-accent-500/10 text-gray-100'
                    : 'border-ink-700/60 bg-ink-900/50 text-gray-400 hover:border-ink-600 hover:text-gray-300',
                )}
              >
                <Mail className="w-4 h-4 shrink-0 text-accent-400/70" />
                <span className="font-mono text-xs">{addr}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-x-0 top-1/2 border-t border-ink-700/40" />
        <span className="relative bg-ink-850 px-3 text-xs text-gray-500 mx-auto block w-fit -translate-y-1/2">or use a custom admin email</span>
      </div>

      <div>
        <label htmlFor="custom-email" className="label-base">Custom administrative email</label>
        <input
          id="custom-email"
          type="email"
          value={customEmail}
          onChange={(e) => {
            setCustomEmail(e.target.value);
            setSelectedEmail(null);
          }}
          placeholder={`you@${domain}`}
          className="input-base font-mono text-sm"
        />
      </div>

      <div className="space-y-3 pt-2">
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={authorized}
            onChange={(e) => setAuthorized(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-ink-600 bg-ink-900 text-accent-500 focus:ring-accent-500/40"
          />
          <span className="text-sm text-gray-400">
            I confirm that I own this domain or have explicit authorization to perform security testing on it.
          </span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-ink-600 bg-ink-900 text-accent-500 focus:ring-accent-500/40"
          />
          <span className="text-sm text-gray-400">
            I accept the <Link to="/terms" className="text-accent-400 hover:underline">Terms of Service</Link> and{' '}
            <Link to="/responsible-use" className="text-accent-400 hover:underline">Responsible Use Policy</Link>.
          </span>
        </label>
      </div>

      <Button onClick={onSend} disabled={!canSend} loading={sending} size="lg" className="w-full">
        Send Verification Link
      </Button>
      {!canSend && !sending && (
        <p className="text-xs text-gray-600 text-center">Confirm authorization and accept the terms to continue.</p>
      )}
    </div>
  );
}

function WaitingPhase({
  email, phase, cooldown, onResend, sending, onDemoConfirm, verifying, isDemo,
}: {
  email: string;
  phase: Phase;
  cooldown: number;
  onResend: () => void;
  sending: boolean;
  onDemoConfirm: () => void;
  verifying: boolean;
  isDemo: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center py-4">
        {phase === 'waiting' && <Clock className="w-12 h-12 text-cyber-400 mb-4 animate-pulse-soft" />}
        {phase === 'expired' && <XCircle className="w-12 h-12 text-danger-400 mb-4" />}
        {phase === 'failed' && <AlertCircle className="w-12 h-12 text-danger-400 mb-4" />}

        {phase === 'waiting' && (
          <>
            <h2 className="text-lg font-semibold text-gray-100">Waiting for verification</h2>
            <p className="text-sm text-gray-500 mt-1 max-w-sm">
              We sent a verification link to <span className="font-mono text-gray-300">{email}</span>. Check the inbox and click the link to confirm authorization.
            </p>
          </>
        )}
        {phase === 'expired' && (
          <>
            <h2 className="text-lg font-semibold text-gray-100">Link expired</h2>
            <p className="text-sm text-gray-500 mt-1">The verification link has expired. Request a new one.</p>
          </>
        )}
        {phase === 'failed' && (
          <>
            <h2 className="text-lg font-semibold text-gray-100">Verification failed</h2>
            <p className="text-sm text-gray-500 mt-1">We couldn't verify this email. Try resending or choosing a different address.</p>
          </>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button variant="secondary" onClick={onResend} disabled={cooldown > 0 || sending} loading={sending}>
          <RefreshCw className="w-4 h-4" />
          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend link'}
        </Button>
        {isDemo && (
          <Button variant="outline" onClick={onDemoConfirm} loading={verifying}>
            <CheckCircle2 className="w-4 h-4" />
            Demo: Confirm Verification
          </Button>
        )}
      </div>

      {isDemo && (
        <div className="rounded-lg border border-cyber-500/20 bg-cyber-500/5 p-3 text-center">
          <p className="text-xs text-cyber-400/80">
            Demo mode: no real email is sent. Use “Confirm Verification” to proceed.
          </p>
        </div>
      )}
    </div>
  );
}
