import type { CalendarStatus } from './api';

/** 캘린더 점·뱃지 색. 기획안 5.3의 4색 규칙을 그대로 따른다. */
export const STATUS_STYLE: Record<CalendarStatus, { label: string; color: string }> = {
  NOT_SUBMITTED: { label: '미제출', color: '#E5484D' },
  OVERDUE: { label: '기한초과', color: '#8E4EC6' },
  SUBMITTED: { label: '제출완료', color: '#208AEF' },
  REVIEWED: { label: '첨삭완료', color: '#30A46C' },
  RESUBMIT_REQUIRED: { label: '재제출 요청', color: '#F76B15' },
};

export function dDayLabel(dueDate: string, today = new Date()): string {
  const due = new Date(`${dueDate}T00:00:00`);
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const days = Math.round((due.getTime() - start.getTime()) / 86_400_000);

  if (days === 0) return '오늘 마감';
  if (days > 0) return `D-${days}`;
  return `${Math.abs(days)}일 지남`;
}
