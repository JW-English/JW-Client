import { create } from 'zustand';

import { ApiError } from '@/lib/api';

import { completeOnboarding, fetchMe, login, logout, refreshTokens, signUp, type Me } from './api';
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
  /** 최초 프로필 설정 (학년·학교). 학년이 있어야 단어 DAY 가 열린다. */
  submitOnboarding: (input: { name: string; grade: number; school?: string }) => Promise<void>;
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

  async submitOnboarding(input) {
    // 서버가 갱신된 프로필을 그대로 돌려주므로 다시 조회하지 않는다
    const me = await withAuthToken((token) => completeOnboarding(token, input));
    set({ me });
  },
}));

/**
 * 토큰이 만료됐으면 한 번 갱신하고 재시도한다.
 * (lib/with-auth 는 이 스토어를 참조하므로 순환 의존을 피해 여기 둔다)
 */
async function withAuthToken<T>(request: (accessToken: string) => Promise<T>): Promise<T> {
  const { tokens, refresh } = useAuthStore.getState();
  if (!tokens) {
    throw new ApiError(401);
  }

  try {
    return await request(tokens.accessToken);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      const renewed = await refresh();
      if (renewed) {
        return request(renewed);
      }
    }
    throw error;
  }
}

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
