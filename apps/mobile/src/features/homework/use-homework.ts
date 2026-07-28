import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { withAuth } from '@/lib/with-auth';

import { fetchAssignment, fetchAssignments, submitHomework } from './api';

/** 캘린더는 월 단위로 조회한다. 키에 월을 넣어 달을 넘길 때만 다시 부른다. */
export function useAssignments(month: Date) {
  const from = new Date(month.getFullYear(), month.getMonth(), 1);
  const to = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  return useQuery({
    queryKey: ['assignments', toIsoDate(from)],
    queryFn: () => withAuth((token) => fetchAssignments(token, toIsoDate(from), toIsoDate(to))),
  });
}

export function useAssignment(assignmentId: string) {
  return useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: () => withAuth((token) => fetchAssignment(token, assignmentId)),
    enabled: Boolean(assignmentId),
  });
}

export function useSubmitHomework(assignmentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (images: { storageKey: string; width?: number; height?: number }[]) =>
      withAuth((token) => submitHomework(token, assignmentId, images)),
    onSuccess: (detail) => {
      // 상세는 응답으로 갱신하고, 목록은 상태 뱃지가 바뀌므로 다시 불러온다
      queryClient.setQueryData(['assignment', assignmentId], detail);
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });
}

export function toIsoDate(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}
