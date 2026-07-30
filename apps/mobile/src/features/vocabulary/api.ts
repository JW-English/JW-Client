import type { VocabLevel } from '@/features/auth/api';
import { apiFetch } from '@/lib/api';

export type DayListItem = {
  id: string;
  dayNo: number;
  title: string | null;
  scheduledDate: string | null;
  wordCount: number;
  attemptCount: number;
  firstScore: number | null;
  bestScore: number | null;
  /** 제출하지 않고 나간 응시가 있으면 그 id */
  inProgressAttemptId: string | null;
};

export type WordItem = {
  id: number;
  headword: string;
  meaningKo: string;
  exampleEn: string | null;
  exampleKo: string | null;
};

export type DayDetail = {
  id: string;
  dayNo: number;
  title: string | null;
  scheduledDate: string | null;
  words: WordItem[];
  inProgressAttemptId: string | null;
};

/** 진행 중 문항. 정답 정보는 서버가 내려주지 않는다. */
export type QuestionItem = {
  wordId: number;
  sortOrder: number;
  questionType: 'EN_TO_KO' | 'KO_TO_EN';
  prompt: string;
  choices: string[];
  selectedIndex: number | null;
};

export type AttemptResponse = {
  attemptId: string;
  dayId: string;
  totalCount: number;
  questions: QuestionItem[];
};

export type ReviewItem = {
  wordId: number;
  headword: string;
  meaningKo: string;
  exampleEn: string | null;
  choices: string[];
  correctIndex: number;
  selectedIndex: number | null;
  correct: boolean;
};

export type ResultResponse = {
  attemptId: string;
  totalCount: number;
  correctCount: number;
  score: number;
  startedAt: string;
  finishedAt: string;
  reviews: ReviewItem[];
};

export function fetchDays(accessToken: string, level?: VocabLevel) {
  return apiFetch<DayListItem[]>(`/api/vocabulary/days${level ? `?level=${level}` : ''}`, {
    accessToken,
  });
}

export function fetchDay(accessToken: string, dayId: string) {
  return apiFetch<DayDetail>(`/api/vocabulary/days/${dayId}`, { accessToken });
}

export function startQuiz(accessToken: string, dayId: string, questionCount?: number) {
  return apiFetch<AttemptResponse>('/api/quiz/attempts', {
    method: 'POST',
    accessToken,
    body: { dayId, questionCount },
  });
}

/** 이어하기 — 중도 이탈한 시험을 다시 불러온다. */
export function fetchAttempt(accessToken: string, attemptId: string) {
  return apiFetch<AttemptResponse>(`/api/quiz/attempts/${attemptId}`, { accessToken });
}

export function saveAnswer(
  accessToken: string,
  attemptId: string,
  body: { wordId: number; selectedIndex: number },
) {
  return apiFetch<void>(`/api/quiz/attempts/${attemptId}/answers`, {
    method: 'POST',
    accessToken,
    body,
  });
}

export function submitQuiz(accessToken: string, attemptId: string) {
  return apiFetch<ResultResponse>(`/api/quiz/attempts/${attemptId}/submit`, {
    method: 'POST',
    accessToken,
  });
}

export function fetchResult(accessToken: string, attemptId: string) {
  return apiFetch<ResultResponse>(`/api/quiz/attempts/${attemptId}/result`, { accessToken });
}
