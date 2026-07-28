'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { ApiError } from '@/lib/api';
import { homeworkApi } from '@/lib/homework';

export default function AssignmentsPage() {
  const queryClient = useQueryClient();
  const { data, isPending, error } = useQuery({
    queryKey: ['assignments'],
    queryFn: homeworkApi.assignments,
  });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [studentId, setStudentId] = useState('');
  const [dueDate, setDueDate] = useState(() => defaultDueDate());
  const [formError, setFormError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () =>
      homeworkApi.createAssignment({
        // 비우면 전체 학생 대상(공지형)이 된다
        studentId: studentId.trim() === '' ? null : studentId.trim(),
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate,
      }),
    onSuccess: () => {
      setTitle('');
      setDescription('');
      setFormError(null);
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
    onError: (e) => {
      setFormError(e instanceof ApiError ? e.message : '숙제를 만들지 못했습니다.');
    },
  });

  return (
    <div className="space-y-5">
      <h1 className="text-lg font-semibold">숙제 관리</h1>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          create.mutate();
        }}
        className="space-y-4 rounded-xl border border-neutral-200 bg-white p-5">
        <h2 className="text-sm font-semibold">새 숙제</h2>

        {formError ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-sm font-medium">제목</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="3과 본문 해석"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-medium">마감일</span>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </label>
        </div>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">설명</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="노트에 손으로 써서 사진으로 제출하세요"
            className="w-full resize-none rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">학생 ID</span>
          <input
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            placeholder="비우면 전체 학생에게 나갑니다"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 font-mono text-xs outline-none focus:border-blue-500"
          />
          <span className="text-xs text-neutral-500">
            학생 목록 화면은 아직 없습니다. 제출 현황에서 학생 ID 를 확인해 붙여넣으세요.
          </span>
        </label>

        <button
          type="submit"
          disabled={create.isPending || title.trim().length === 0}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
          {create.isPending ? '만드는 중…' : '숙제 만들기'}
        </button>
      </form>

      {isPending ? (
        <p className="text-sm text-neutral-500">불러오는 중…</p>
      ) : error ? (
        <p className="text-sm text-red-600">숙제 목록을 불러오지 못했습니다.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-neutral-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">제목</th>
                <th className="px-4 py-2.5 font-medium">대상</th>
                <th className="px-4 py-2.5 font-medium">부여일</th>
                <th className="px-4 py-2.5 font-medium">마감일</th>
              </tr>
            </thead>
            <tbody>
              {data.map((assignment) => (
                <tr key={assignment.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-3 font-medium">{assignment.title}</td>
                  <td className="px-4 py-3">{assignment.studentName}</td>
                  <td className="px-4 py-3 text-neutral-500">{assignment.assignedDate}</td>
                  <td className="px-4 py-3 text-neutral-500">{assignment.dueDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function defaultDueDate() {
  const date = new Date();
  date.setDate(date.getDate() + 3);
  return date.toISOString().slice(0, 10);
}
