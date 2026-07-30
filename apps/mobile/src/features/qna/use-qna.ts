import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { withAuth } from '@/lib/with-auth';

import {
  addQuestionMessage,
  closeQuestion,
  createQuestion,
  deleteQuestion,
  fetchAttachmentUrl,
  fetchNotices,
  fetchQuestion,
  fetchQuestions,
  type QuestionCategory,
  type QuestionInput,
  type QuestionStatus,
  updateQuestion,
} from './api';

export function useQuestions(filters: {
  scope: 'public' | 'mine';
  category: QuestionCategory | null;
  status: QuestionStatus | null;
}) {
  return useInfiniteQuery({
    queryKey: ['qna', 'questions', filters],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      withAuth((token) => fetchQuestions(token, { ...filters, cursor: pageParam, size: 20 })),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

export function useQuestion(questionId: string) {
  return useQuery({
    queryKey: ['qna', 'question', questionId],
    queryFn: () => withAuth((token) => fetchQuestion(token, questionId)),
    enabled: Boolean(questionId),
  });
}

export function useQnaNotices() {
  return useQuery({
    queryKey: ['qna', 'notices'],
    queryFn: () => withAuth(fetchNotices),
  });
}

export function useCreateQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: QuestionInput) => withAuth((token) => createQuestion(token, body)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['qna', 'questions'] }),
  });
}

export function useUpdateQuestion(questionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Pick<QuestionInput, 'title' | 'body' | 'publicVisible'>) =>
      withAuth((token) => updateQuestion(token, questionId, body)),
    onSuccess: (detail) => {
      queryClient.setQueryData(['qna', 'question', questionId], detail);
      queryClient.invalidateQueries({ queryKey: ['qna', 'questions'] });
    },
  });
}

export function useDeleteQuestion(questionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => withAuth((token) => deleteQuestion(token, questionId)),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['qna', 'question', questionId] });
      queryClient.invalidateQueries({ queryKey: ['qna', 'questions'] });
    },
  });
}

export function useAddQuestionMessage(questionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { body: string }) =>
      withAuth((token) => addQuestionMessage(token, questionId, body)),
    onSuccess: (detail) => {
      queryClient.setQueryData(['qna', 'question', questionId], detail);
      queryClient.invalidateQueries({ queryKey: ['qna', 'questions'] });
    },
  });
}

export function useCloseQuestion(questionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => withAuth((token) => closeQuestion(token, questionId)),
    onSuccess: (detail) => {
      queryClient.setQueryData(['qna', 'question', questionId], detail);
      queryClient.invalidateQueries({ queryKey: ['qna', 'questions'] });
    },
  });
}

export function useAttachmentUrl(attachmentId: string) {
  return useQuery({
    queryKey: ['qna', 'attachment-url', attachmentId],
    queryFn: () => withAuth((token) => fetchAttachmentUrl(token, attachmentId)),
    enabled: Boolean(attachmentId),
    staleTime: 45 * 60 * 1000,
  });
}
