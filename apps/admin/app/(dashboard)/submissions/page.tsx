'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';

import { homeworkApi, STATUS_LABEL, type SubmissionStatus } from '@/lib/homework';

const FILTERS: { value: SubmissionStatus | 'ALL'; label: string }[] = [
  { value: 'SUBMITTED', label: '미첨삭' },
  { value: 'ALL', label: '전체' },
  { value: 'REVIEWED', label: '첨삭완료' },
];

/** 선생님이 가장 자주 보는 화면이라 첫 화면으로 둔다. 기본 필터는 미첨삭. */
export default function SubmissionsPage() {
  const [filter, setFilter] = useState<SubmissionStatus | 'ALL'>('SUBMITTED');

  const { data, isPending, error } = useQuery({
    queryKey: ['submissions', filter],
    queryFn: () => homeworkApi.submissions(filter === 'ALL' ? undefined : filter),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">제출 현황</h1>
        <div className="flex gap-1">
          {FILTERS.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={`rounded-lg px-3 py-1.5 text-sm transition ${
                filter === option.value
                  ? 'bg-neutral-900 text-white'
                  : 'bg-white text-neutral-600 hover:bg-neutral-100'
              }`}>
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {isPending ? (
        <p className="text-sm text-neutral-500">불러오는 중…</p>
      ) : error ? (
        <p className="text-sm text-red-600">제출 현황을 불러오지 못했습니다.</p>
      ) : data.length === 0 ? (
        <p className="rounded-xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">
          해당하는 제출물이 없습니다
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-neutral-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">학생</th>
                <th className="px-4 py-2.5 font-medium">숙제</th>
                <th className="px-4 py-2.5 font-medium">제출일</th>
                <th className="px-4 py-2.5 font-medium">사진</th>
                <th className="px-4 py-2.5 font-medium">상태</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {data.map((submission) => {
                const status = STATUS_LABEL[submission.status];
                return (
                  <tr key={submission.id} className="border-b border-neutral-100 last:border-0">
                    <td className="px-4 py-3 font-medium">{submission.studentName}</td>
                    <td className="px-4 py-3">{submission.assignmentTitle}</td>
                    <td className="px-4 py-3 text-neutral-500">
                      {new Date(submission.submittedAt).toLocaleString('ko-KR')}
                    </td>
                    <td className="px-4 py-3 text-neutral-500">{submission.imageCount}장</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-md px-2 py-1 text-xs ${status.className}`}>
                        {status.text}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/submissions/${submission.id}`}
                        className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
                        첨삭하기
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
