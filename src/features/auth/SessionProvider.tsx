import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';

import { identify, resetAnalytics } from '@/src/lib/analytics';
import { setCrashUser } from '@/src/lib/crashReporting';
import { supabase } from '@/src/lib/supabase';

type SessionState = {
  session: Session | null;
  /** True until the initial session restore completes. */
  isLoading: boolean;
};

const SessionContext = createContext<SessionState>({ session: null, isLoading: true });

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({ session: null, isLoading: true });

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setState({ session: data.session, isLoading: false });
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      setState({ session, isLoading: false });
      if (event === 'SIGNED_IN' && session?.user) {
        identify(session.user.id);
        setCrashUser(session.user.id);
      }
      if (event === 'SIGNED_OUT') {
        resetAnalytics();
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return <SessionContext.Provider value={state}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionState {
  return useContext(SessionContext);
}
