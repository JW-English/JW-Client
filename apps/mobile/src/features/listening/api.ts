import { apiFetch } from '@/lib/api';

export type ExamListItem = {
  id: string;
  year: number;
  examType: 'SUNEUNG' | 'MOCK_9' | 'MOCK_6' | 'MOCK_3' | 'EDU_OFFICE';
  examTypeLabel: string;
  grade: number;
  title: string;
  itemCount: number;
  completedCount: number;
};

export type ItemListItem = {
  id: string;
  itemNo: number;
  itemType: string | null;
  questionText: string | null;
  durationMs: number | null;
  completed: boolean;
  lastPositionMs: number;
};

export type SentenceItem = {
  id: number;
  seq: number;
  speaker: string | null;
  textEn: string;
  textKo: string | null;
  startMs: number;
  endMs: number;
};

export type ItemDetail = {
  id: string;
  itemNo: number;
  itemType: string | null;
  questionText: string | null;
  /** "2026학년도 수능". 서버를 올리기 전 빌드에서는 없을 수 있어 optional 로 둔다 */
  examLabel?: string;
  /** 만료형 URL. 저장하지 않고 매번 받아 쓴다 */
  audioUrl: string;
  durationMs: number | null;
  lastPositionMs: number;
  sentences: SentenceItem[];
};

export function fetchExams(accessToken: string, year?: number) {
  return apiFetch<ExamListItem[]>(`/api/listening/exams${year ? `?year=${year}` : ''}`, {
    accessToken,
  });
}

export function fetchItems(accessToken: string, examId: string) {
  return apiFetch<ItemListItem[]>(`/api/listening/exams/${examId}/items`, { accessToken });
}

export function fetchItem(accessToken: string, itemId: string) {
  return apiFetch<ItemDetail>(`/api/listening/items/${itemId}`, { accessToken });
}

export function saveProgress(
  accessToken: string,
  itemId: string,
  body: { lastPositionMs: number; completed: boolean },
) {
  return apiFetch<void>(`/api/listening/items/${itemId}/progress`, {
    method: 'PUT',
    accessToken,
    body,
  });
}
