import { api } from './api';

export type QuestionCategory = 'HOMEWORK' | 'VOCAB' | 'LISTENING' | 'TEXTBOOK' | 'ETC';
export type QuestionStatus = 'PENDING' | 'ANSWERED' | 'REOPENED' | 'CLOSED';

export const CATEGORY_LABEL: Record<QuestionCategory, string> = {
  HOMEWORK: '숙제',
  VOCAB: '단어',
  LISTENING: '리스닝',
  TEXTBOOK: '교재',
  ETC: '기타',
};

export const STATUS_LABEL: Record<QuestionStatus, { text: string; className: string }> = {
  PENDING: { text: '답변대기', className: 'bg-neutral-100 text-neutral-700' },
  ANSWERED: { text: '답변완료', className: 'bg-blue-100 text-blue-700' },
  REOPENED: { text: '재질문', className: 'bg-orange-100 text-orange-700' },
  CLOSED: { text: '종료', className: 'bg-neutral-100 text-neutral-500' },
};

export type CursorPage<T> = {
  items: T[];
  nextCursor: string | null;
};

export type AdminQuestionItem = {
  id: string;
  category: QuestionCategory;
  status: QuestionStatus;
  title: string;
  authorName: string;
  publicVisible: boolean;
  createdAt: string;
  answerCount: number;
};

export type QuestionReference = {
  examId: string | null;
  itemNo: number | null;
  examTitle: string | null;
  wordDayId: string | null;
  wordDayNo: number | null;
  wordDayTitle: string | null;
  assignmentId: string | null;
  assignmentTitle: string | null;
  textbook: string | null;
  page: number | null;
};

export type QuestionAttachment = {
  id: string;
  storageKey: string;
  mimeType: string;
  byteSize: number;
  width: number | null;
  height: number | null;
  sortOrder: number;
};

export type QuestionMessage = {
  id: string;
  role: 'STUDENT' | 'TEACHER';
  body: string;
  authorName: string;
  createdAt: string;
  attachments: QuestionAttachment[];
};

export type AdminQuestionDetail = {
  id: string;
  category: QuestionCategory;
  status: QuestionStatus;
  title: string;
  body: string;
  authorName: string;
  authorId: string;
  publicVisible: boolean;
  createdAt: string;
  answeredAt: string | null;
  reference: QuestionReference;
  attachments: QuestionAttachment[];
  messages: QuestionMessage[];
};

export const qnaApi = {
  summary: () => api.get<{ pendingCount: number }>('/api/admin/questions/summary'),

  questions: (params: {
    status?: QuestionStatus | 'ALL';
    category?: QuestionCategory | 'ALL';
    cursor?: string | null;
  }) => {
    const search = new URLSearchParams();
    if (params.status && params.status !== 'ALL') search.set('status', params.status);
    if (params.category && params.category !== 'ALL') search.set('category', params.category);
    if (params.cursor) search.set('cursor', params.cursor);
    return api.get<CursorPage<AdminQuestionItem>>(`/api/admin/questions?${search}`);
  },

  question: (id: string) => api.get<AdminQuestionDetail>(`/api/admin/questions/${id}`),

  answer: (id: string, body: string) =>
    api.post<AdminQuestionDetail>(`/api/admin/questions/${id}/messages`, { body }),

  visibility: (id: string, publicVisible: boolean) =>
    api.patch<AdminQuestionDetail>(`/api/admin/questions/${id}/visibility`, { publicVisible }),

  attachmentUrl: (id: string) =>
    api.get<{ id: string; url: string; expiresIn: number }>(`/api/questions/attachments/${id}/url`),
};
