import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';

import { identify, resetAnalytics } from '@/src/lib/analytics';
import { setCrashUser } from '@/src/lib/crashReporting';
import { openedFromRecoveryLink, supabase } from '@/src/lib/supabase';

type SessionState = {
  session: Session | null;
  /** True until the initial session restore completes. */
  isLoading: boolean;
  /** Signed in from a password-reset link; cleared once a new password is set. */
  passwordRecovery: boolean;
};

const SessionContext = createContext<SessionState>({ session: null, isLoading: true, passwordRecovery: false });

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({
    session: null,
    isLoading: true,
    passwordRecovery: openedFromRecoveryLink,
  });

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setState((s) => ({ ...s, session: data.session, isLoading: false }));
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      setState((s) => ({
        session,
        isLoading: false,
        passwordRecovery:
          event === 'PASSWORD_RECOVERY' ? true : event === 'USER_UPDATED' || !session ? false : s.passwordRecovery,
      }));
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
