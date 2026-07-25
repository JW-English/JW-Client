import { useQuery } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api';

export type PingResponse = {
  service: string;
  version: string;
  serverTime: string;
};

/** P0 관통 확인: 앱 → 서버 → DB 까지 살아있는지 화면에 찍는다. */
export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => apiFetch<PingResponse>('/api/public/ping'),
    retry: 1,
    staleTime: 30_000,
  });
}
