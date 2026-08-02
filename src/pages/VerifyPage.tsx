import { Navigate } from 'react-router-dom';
import { VerificationFlow } from '@/components/VerificationFlow';
import { useSession } from '@/components/ui/Session';

export function VerifyPage() {
  const { pendingDomain } = useSession();
  if (!pendingDomain) return <Navigate to="/" replace />;
  return (
    <div className="py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
      <VerificationFlow domain={pendingDomain} />
    </div>
  );
}
