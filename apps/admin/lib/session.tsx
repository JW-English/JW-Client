'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { api, login as apiLogin, logout as apiLogout, refreshSession } from './api';

export type Me = {
  id: string;
  email: string | null;
  name: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
};

type SessionState = {
  /** 새로고침 직후 쿠키로 세션을 되살리는 동안 true */
  restoring: boolean;
  me: Me | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [restoring, setRestoring] = useState(true);
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    // Access Token 은 메모리에만 있으므로 새로고침하면 사라진다.
    // httpOnly 쿠키의 Refresh 로 되살린다.
    (async () => {
      if (await refreshSession()) {
        const profile = await api.get<Me>('/api/me').catch(() => null);
        setMe(profile);
      }
      setRestoring(false);
    })();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    await apiLogin(email, password);
    setMe(await api.get<Me>('/api/me'));
  }, []);

  const signOut = useCallback(async () => {
    await apiLogout();
    setMe(null);
  }, []);

  const value = useMemo(
    () => ({ restoring, me, signIn, signOut }),
    [restoring, me, signIn, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession 은 SessionProvider 안에서만 쓸 수 있습니다');
  }
  return context;
}
