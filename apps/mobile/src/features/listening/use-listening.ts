import { useMutation, useQuery } from '@tanstack/react-query';

import { withAuth } from '@/lib/with-auth';

import { fetchExams, fetchItem, fetchItems, saveProgress } from './api';

export function useExams(year?: number) {
  return useQuery({
    queryKey: ['listening', 'exams', year ?? 'all'],
    queryFn: () => withAuth((token) => fetchExams(token, year)),
  });
}

export function useItems(examId: string) {
  return useQuery({
    queryKey: ['listening', 'items', examId],
    queryFn: () => withAuth((token) => fetchItems(token, examId)),
    enabled: Boolean(examId),
  });
}

export function useItem(itemId: string) {
  return useQuery({
    queryKey: ['listening', 'item', itemId],
    queryFn: () => withAuth((token) => fetchItem(token, itemId)),
    enabled: Boolean(itemId),
    // 음원 URL 이 만료되므로 오래 캐시하지 않는다
    staleTime: 10 * 60_000,
  });
}

export function useSaveProgress(itemId: string) {
  return useMutation({
    mutationFn: (body: { lastPositionMs: number; completed: boolean }) =>
      withAuth((token) => saveProgress(token, itemId, body)),
  });
}
