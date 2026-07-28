import { api } from './api';

export type SubmissionStatus = 'SUBMITTED' | 'REVIEWED' | 'RESUBMIT_REQUIRED';

export const STATUS_LABEL: Record<SubmissionStatus, { text: string; className: string }> = {
  SUBMITTED: { text: '미첨삭', className: 'bg-blue-100 text-blue-700' },
  REVIEWED: { text: '첨삭완료', className: 'bg-emerald-100 text-emerald-700' },
  RESUBMIT_REQUIRED: { text: '재제출 요청', className: 'bg-orange-100 text-orange-700' },
};

export type AssignmentItem = {
  id: string;
  title: string;
  subject: string;
  assignedDate: string;
  dueDate: string;
  studentId: string | null;
  studentName: string;
};

export type SubmissionItem = {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  studentId: string;
  studentName: string;
  status: SubmissionStatus;
  submittedAt: string;
  imageCount: number;
};

export type SubmissionDetail = {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  studentName: string;
  status: SubmissionStatus;
  submittedAt: string;
  images: { id: string; storageKey: string; url: string; sortOrder: number }[];
};

export const homeworkApi = {
  assignments: () => api.get<AssignmentItem[]>('/api/admin/homework/assignments'),

  createAssignment: (body: {
    studentId?: string | null;
    title: string;
    description?: string;
    dueDate: string;
  }) => api.post<AssignmentItem>('/api/admin/homework/assignments', body),

  submissions: (status?: SubmissionStatus) =>
    api.get<SubmissionItem[]>(
      `/api/admin/homework/submissions${status ? `?status=${status}` : ''}`,
    ),

  submission: (id: string) => api.get<SubmissionDetail>(`/api/admin/homework/submissions/${id}`),

  comment: (id: string, body: { body: string; requestResubmit: boolean }) =>
    api.post<void>(`/api/admin/homework/submissions/${id}/comments`, body),
};
