import { apiFetch } from '@/lib/api';

export type HomeworkSummary = {
  total: number;
  submitted: number;
  reviewed: number;
  pending: number;
};

export type VocabularySummary = {
  attemptCount: number;
  /** 응시가 없으면 null */
  averageScore: number | null;
  bestScore: number | null;
};

export type MeSummary = {
  homework: HomeworkSummary;
  vocabulary: VocabularySummary;
};

export type AttemptHistoryItem = {
  id: string;
  dayId: string;
  dayNo: number;
  dayTitle: string | null;
  totalCount: number;
  correctCount: number;
  /** 0~100 */
  score: number;
  finishedAt: string;
};

export type WrongNoteItem = {
  wordId: number;
  headword: string;
  meaningKo: string;
  wrongCount: number;
  streakCount: number;
  lastWrongAt: string;
};

export function fetchSummary(accessToken: string) {
  return apiFetch<MeSummary>('/api/me/summary', { accessToken });
}

export function fetchAttemptHistory(accessToken: string, page = 0, size = 20) {
  return apiFetch<AttemptHistoryItem[]>(`/api/quiz/attempts?page=${page}&size=${size}`, {
    accessToken,
  });
}

export function fetchWrongNotes(accessToken: string) {
  return apiFetch<WrongNoteItem[]>('/api/quiz/wrong-notes', { accessToken });
}

export function changePassword(
  accessToken: string,
  body: { currentPassword: string; newPassword: string },
) {
  return apiFetch<void>('/api/me/password', { method: 'PUT', accessToken, body });
}

export function withdraw(accessToken: string) {
  return apiFetch<void>('/api/me', { method: 'DELETE', accessToken });
}
