import { createContext, useContext, useState, type ReactNode } from 'react';

interface SessionState {
  pendingDomain: string | null;
  pendingPackage: string | null;
  scanId: string | null;
  pendingScanScope: { network: boolean; database: boolean };
  pendingDeepScan: boolean;
  setPendingDomain: (d: string | null) => void;
  setPendingPackage: (p: string | null) => void;
  setScanId: (s: string | null) => void;
  setPendingScanScope: (scope: { network: boolean; database: boolean }) => void;
  setPendingDeepScan: (enabled: boolean) => void;
}

const SessionContext = createContext<SessionState | null>(null);

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [pendingDomain, setPendingDomain] = useState<string | null>(null);
  const [pendingPackage, setPendingPackage] = useState<string | null>(null);
  const [scanId, setScanId] = useState<string | null>(null);
  const [pendingScanScope, setPendingScanScope] = useState({ network: true, database: true });
  const [pendingDeepScan, setPendingDeepScan] = useState(false);

  return (
    <SessionContext.Provider
      value={{ pendingDomain, pendingPackage, scanId, pendingScanScope, pendingDeepScan, setPendingDomain, setPendingPackage, setScanId, setPendingScanScope, setPendingDeepScan }}
    >
      {children}
    </SessionContext.Provider>
  );
}
