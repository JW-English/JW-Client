import { useAuthStore } from '@/features/auth/auth-store';
import { ApiError } from '@/lib/api';

/**
 * 인증이 필요한 요청 공통 래퍼.
 *
 * Access Token 이 만료돼 401 이 오면 Refresh 로 한 번 교체하고 재시도한다.
 * 이 처리가 없으면 30분마다 사용자가 다시 로그인해야 한다.
 */
export async function withAuth<T>(request: (accessToken: string) => Promise<T>): Promise<T> {
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
