import { apiFetch } from '@/lib/api';

export type CalendarStatus =
  | 'NOT_SUBMITTED'
  | 'SUBMITTED'
  | 'REVIEWED'
  | 'RESUBMIT_REQUIRED'
  | 'OVERDUE';

export type AssignmentListItem = {
  id: string;
  title: string;
  subject: string;
  assignedDate: string;
  dueDate: string;
  status: CalendarStatus;
};

export type SubmissionImage = {
  id: string;
  /** 재제출(교체) 때 남길 사진을 지정하는 데 쓴다. */
  storageKey: string;
  /** 만료형 URL. 표시용이며 저장하지 않는다. */
  url: string;
  sortOrder: number;
  width: number | null;
  height: number | null;
};

export type SubmissionComment = {
  id: string;
  body: string | null;
  imageUrl: string | null;
  fromTeacher: boolean;
  createdAt: string;
};

export type AssignmentDetail = {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  assignedDate: string;
  dueDate: string;
  closed: boolean;
  status: CalendarStatus;
  submission: {
    id: string;
    status: 'SUBMITTED' | 'REVIEWED' | 'RESUBMIT_REQUIRED';
    submittedAt: string;
    images: SubmissionImage[];
    comments: SubmissionComment[];
  } | null;
};

export type PresignedUpload = {
  key: string;
  url: string;
  expiresIn: number;
};

export function fetchAssignments(accessToken: string, from: string, to: string) {
  return apiFetch<AssignmentListItem[]>(
    `/api/homework/assignments?from=${from}&to=${to}`,
    { accessToken },
  );
}

export function fetchAssignment(accessToken: string, assignmentId: string) {
  return apiFetch<AssignmentDetail>(`/api/homework/assignments/${assignmentId}`, { accessToken });
}

export function presignUpload(
  accessToken: string,
  body: { directory: string; contentType: string; extension: string },
) {
  return apiFetch<PresignedUpload>('/api/files/presign', {
    method: 'POST',
    accessToken,
    body,
  });
}

export function submitHomework(
  accessToken: string,
  assignmentId: string,
  images: { storageKey: string; width?: number; height?: number }[],
) {
  return apiFetch<AssignmentDetail>(`/api/homework/assignments/${assignmentId}/submission`, {
    method: 'POST',
    accessToken,
    body: { images },
  });
}
