import { create } from 'zustand';

import { ApiError } from '@/lib/api';

import { fetchMe, login, logout, refreshTokens, signUp, type Me } from './api';
import { tokenStorage, type StoredTokens } from './token-storage';

type AuthState = {
  /** 앱 시작 시 저장된 세션을 복구하는 동안 true */
  restoring: boolean;
  tokens: StoredTokens | null;
  me: Me | null;

  restore: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** 만료된 Access Token 을 Refresh 로 교체한다. 실패하면 로그아웃된다. */
  refresh: () => Promise<string | null>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  restoring: true,
  tokens: null,
  me: null,

  async restore() {
    const tokens = await tokenStorage.load();
    if (!tokens) {
      set({ restoring: false });
      return;
    }

    try {
      const me = await fetchMe(tokens.accessToken);
      set({ tokens, me, restoring: false });
    } catch (error) {
      // Access Token 만료는 정상 상황이다 — Refresh 로 한 번 더 시도한다
      if (error instanceof ApiError && error.status === 401) {
        set({ tokens });
        const accessToken = await get().refresh();
        if (accessToken) {
          const me = await fetchMe(accessToken).catch(() => null);
          set({ me, restoring: false });
          return;
        }
      }
      await tokenStorage.clear();
      set({ tokens: null, me: null, restoring: false });
    }
  },

  async signIn(email, password) {
    const response = await login({ email, password });
    await applyTokens(set, response);
  },

  async register(email, password, name) {
    const response = await signUp({ email, password, name });
    await applyTokens(set, response);
  },

  async signOut() {
    const { tokens } = get();
    if (tokens) {
      // 서버 세션 폐기가 실패해도 로컬 로그아웃은 진행한다
      await logout(tokens.refreshToken).catch(() => undefined);
    }
    await tokenStorage.clear();
    set({ tokens: null, me: null });
  },

  async refresh() {
    const { tokens } = get();
    if (!tokens) return null;

    try {
      const response = await refreshTokens(tokens.refreshToken);
      const next = {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      };
      await tokenStorage.save(next);
      set({ tokens: next });
      return next.accessToken;
    } catch {
      // 재사용 감지 등으로 세션이 끊겼다 → 재로그인시킨다
      await tokenStorage.clear();
      set({ tokens: null, me: null });
      return null;
    }
  },
}));

async function applyTokens(
  set: (partial: Partial<AuthState>) => void,
  response: { accessToken: string; refreshToken: string },
) {
  const tokens = {
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
  };
  await tokenStorage.save(tokens);
  const me = await fetchMe(tokens.accessToken).catch(() => null);
  set({ tokens, me });
}
