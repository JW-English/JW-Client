import { useMutation, useQuery } from '@tanstack/react-query';

import { withAuth } from '@/lib/with-auth';

import {
  changePassword,
  fetchAttemptHistory,
  fetchSummary,
  fetchWrongNotes,
  withdraw,
} from './api';

export function useMeSummary() {
  return useQuery({
    queryKey: ['me', 'summary'],
    queryFn: () => withAuth((token) => fetchSummary(token)),
  });
}

export function useAttemptHistory() {
  return useQuery({
    queryKey: ['quiz', 'attempts'],
    queryFn: () => withAuth((token) => fetchAttemptHistory(token)),
  });
}

export function useWrongNotes() {
  return useQuery({
    queryKey: ['quiz', 'wrong-notes'],
    queryFn: () => withAuth((token) => fetchWrongNotes(token)),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (body: { currentPassword: string; newPassword: string }) =>
      withAuth((token) => changePassword(token, body)),
  });
}

export function useWithdraw() {
  return useMutation({
    mutationFn: () => withAuth((token) => withdraw(token)),
  });
}
