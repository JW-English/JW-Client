import { apiFetch } from '@/lib/api';

export type VocabLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export type TokenResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  onboardingRequired: boolean;
};

export type Me = {
  id: string;
  email: string | null;
  name: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  grade: number | null;
  school: string | null;
  /** 어휘 레벨. 학교 학년과 별개고 선생님이 지정한다 */
  vocabLevel: VocabLevel | null;
  onboarded: boolean;
};

export function signUp(body: { email: string; password: string; name: string }) {
  return apiFetch<TokenResponse>('/api/auth/signup', { method: 'POST', body });
}

export function login(body: { email: string; password: string }) {
  return apiFetch<TokenResponse>('/api/auth/login', { method: 'POST', body });
}

export function refreshTokens(refreshToken: string) {
  return apiFetch<TokenResponse>('/api/auth/refresh', {
    method: 'POST',
    body: { refreshToken },
  });
}

export function logout(refreshToken: string) {
  return apiFetch<void>('/api/auth/logout', { method: 'POST', body: { refreshToken } });
}

export function fetchMe(accessToken: string) {
  return apiFetch<Me>('/api/me', { accessToken });
}

/** 최초 프로필 설정. 이메일·소셜 어느 경로로 가입했든 여기를 거친다. */
export function completeOnboarding(
  accessToken: string,
  body: { name: string; grade: number; school?: string },
) {
  return apiFetch<Me>('/api/me/onboarding', { method: 'PUT', accessToken, body });
}
