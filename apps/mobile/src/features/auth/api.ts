import { apiFetch } from '@/lib/api';

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
