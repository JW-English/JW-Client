import { apiFetch } from '@/lib/api';

export type QuestionCategory = 'HOMEWORK' | 'VOCAB' | 'LISTENING' | 'TEXTBOOK' | 'ETC';
export type QuestionStatus = 'PENDING' | 'ANSWERED' | 'REOPENED' | 'CLOSED';
export type MessageRole = 'STUDENT' | 'TEACHER';

export type CursorPage<T> = {
  items: T[];
  nextCursor: string | null;
};

export type QuestionListItem = {
  id: string;
  category: QuestionCategory;
  status: QuestionStatus;
  title: string;
  authorName: string;
  mine: boolean;
  publicVisible: boolean;
  createdAt: string;
  answerCount: number;
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

export type QuestionMessage = {
  id: string;
  role: MessageRole;
  body: string;
  authorName: string;
  createdAt: string;
  attachments: QuestionAttachment[];
};

export type QuestionDetail = {
  id: string;
  category: QuestionCategory;
  status: QuestionStatus;
  title: string;
  body: string;
  authorName: string;
  mine: boolean;
  publicVisible: boolean;
  createdAt: string;
  answeredAt: string | null;
  reference: QuestionReference;
  attachments: QuestionAttachment[];
  messages: QuestionMessage[];
};

export type QnaNotice = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
};

export type AttachmentInput = {
  storageKey: string;
  mimeType: string;
  byteSize: number;
  width?: number;
  height?: number;
};

export type QuestionInput = {
  category: QuestionCategory;
  title: string;
  body: string;
  publicVisible: boolean;
  refExamId?: string;
  refItemNo?: number;
  refWordDayId?: string;
  refAssignmentId?: string;
  refTextbook?: string;
  refPage?: number;
  attachments?: AttachmentInput[];
};

export type AttachmentUrl = {
  id: string;
  url: string;
  expiresIn: number;
};

export function fetchQuestions(
  accessToken: string,
  params: {
    scope?: 'public' | 'mine';
    category?: QuestionCategory | null;
    status?: QuestionStatus | null;
    cursor?: string | null;
    size?: number;
  },
) {
  const search = new URLSearchParams();
  search.set('scope', params.scope ?? 'public');
  if (params.category) search.set('category', params.category);
  if (params.status) search.set('status', params.status);
  if (params.cursor) search.set('cursor', params.cursor);
  if (params.size) search.set('size', String(params.size));
  return apiFetch<CursorPage<QuestionListItem>>(`/api/questions?${search}`, { accessToken });
}

export function fetchQuestion(accessToken: string, questionId: string) {
  return apiFetch<QuestionDetail>(`/api/questions/${questionId}`, { accessToken });
}

export function createQuestion(accessToken: string, body: QuestionInput) {
  return apiFetch<QuestionDetail>('/api/questions', { method: 'POST', accessToken, body });
}

export function updateQuestion(
  accessToken: string,
  questionId: string,
  body: Pick<QuestionInput, 'title' | 'body' | 'publicVisible'>,
) {
  return apiFetch<QuestionDetail>(`/api/questions/${questionId}`, {
    method: 'PATCH',
    accessToken,
    body,
  });
}

export function deleteQuestion(accessToken: string, questionId: string) {
  return apiFetch<void>(`/api/questions/${questionId}`, { method: 'DELETE', accessToken });
}

export function addQuestionMessage(
  accessToken: string,
  questionId: string,
  body: { body: string; attachments?: AttachmentInput[] },
) {
  return apiFetch<QuestionDetail>(`/api/questions/${questionId}/messages`, {
    method: 'POST',
    accessToken,
    body,
  });
}

export function closeQuestion(accessToken: string, questionId: string) {
  return apiFetch<QuestionDetail>(`/api/questions/${questionId}/close`, {
    method: 'POST',
    accessToken,
  });
}

export function fetchNotices(accessToken: string) {
  return apiFetch<QnaNotice[]>('/api/qna/notices', { accessToken });
}

export function fetchAttachmentUrl(accessToken: string, attachmentId: string) {
  return apiFetch<AttachmentUrl>(`/api/questions/attachments/${attachmentId}/url`, { accessToken });
}
