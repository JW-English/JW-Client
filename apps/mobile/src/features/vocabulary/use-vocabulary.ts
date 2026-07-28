import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { withAuth } from '@/lib/with-auth';

import { fetchDay, fetchDays, fetchResult, saveAnswer, startQuiz, submitQuiz } from './api';

export function useDays(grade?: number) {
  return useQuery({
    queryKey: ['vocabulary', 'days', grade ?? 'mine'],
    queryFn: () => withAuth((token) => fetchDays(token, grade)),
  });
}

export function useDay(dayId: string) {
  return useQuery({
    queryKey: ['vocabulary', 'day', dayId],
    queryFn: () => withAuth((token) => fetchDay(token, dayId)),
    enabled: Boolean(dayId),
  });
}

export function useStartQuiz() {
  return useMutation({
    mutationFn: ({ dayId, questionCount }: { dayId: string; questionCount?: number }) =>
      withAuth((token) => startQuiz(token, dayId, questionCount)),
  });
}

/**
 * 답 저장은 화면을 막지 않는다 — 저장이 늦어도 다음 문항으로 넘어갈 수 있어야 한다.
 * 최종 정오답은 어차피 제출 시점에 서버가 판정한다.
 */
export function useSaveAnswer(attemptId: string) {
  return useMutation({
    mutationFn: (body: { wordId: number; selectedIndex: number }) =>
      withAuth((token) => saveAnswer(token, attemptId, body)),
  });
}

export function useSubmitQuiz(attemptId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => withAuth((token) => submitQuiz(token, attemptId)),
    onSuccess: (result) => {
      queryClient.setQueryData(['quiz', 'result', attemptId], result);
      // DAY 목록의 점수·응시 횟수가 바뀐다
      queryClient.invalidateQueries({ queryKey: ['vocabulary', 'days'] });
    },
  });
}

export function useResult(attemptId: string) {
  return useQuery({
    queryKey: ['quiz', 'result', attemptId],
    queryFn: () => withAuth((token) => fetchResult(token, attemptId)),
    enabled: Boolean(attemptId),
  });
}
