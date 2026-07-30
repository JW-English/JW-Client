'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';

import {
  CATEGORY_LABEL,
  qnaApi,
  STATUS_LABEL,
  type QuestionCategory,
  type QuestionStatus,
} from '@/lib/qna';

const STATUS_FILTERS: { value: QuestionStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: '미답변' },
  { value: 'PENDING', label: '답변대기' },
  { value: 'REOPENED', label: '재질문' },
  { value: 'ANSWERED', label: '답변완료' },
  { value: 'CLOSED', label: '종료' },
];

const CATEGORY_FILTERS: { value: QuestionCategory | 'ALL'; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'HOMEWORK', label: '숙제' },
  { value: 'VOCAB', label: '단어' },
  { value: 'LISTENING', label: '리스닝' },
  { value: 'TEXTBOOK', label: '교재' },
  { value: 'ETC', label: '기타' },
];

export default function QuestionsPage() {
  const [status, setStatus] = useState<QuestionStatus | 'ALL'>('ALL');
  const [category, setCategory] = useState<QuestionCategory | 'ALL'>('ALL');

  const summary = useQuery({
    queryKey: ['qna', 'summary'],
    queryFn: qnaApi.summary,
  });

  const questions = useQuery({
    queryKey: ['qna', 'admin-questions', status, category],
    queryFn: () => qnaApi.questions({ status, category }),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Q&A</h1>
          <p className="mt-1 text-sm text-neutral-500">
            미답변 {summary.data?.pendingCount ?? 0}건
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((option) => (
          <button
            key={option.value}
            onClick={() => setStatus(option.value)}
            className={`rounded-lg px-3 py-1.5 text-sm transition ${
              status === option.value
                ? 'bg-neutral-900 text-white'
                : 'bg-white text-neutral-600 hover:bg-neutral-100'
            }`}>
            {option.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORY_FILTERS.map((option) => (
          <button
            key={option.value}
            onClick={() => setCategory(option.value)}
            className={`rounded-lg px-3 py-1.5 text-sm transition ${
              category === option.value
                ? 'bg-blue-600 text-white'
                : 'bg-white text-neutral-600 hover:bg-neutral-100'
            }`}>
            {option.label}
          </button>
        ))}
      </div>

      {questions.isPending ? (
        <p className="text-sm text-neutral-500">불러오는 중…</p>
      ) : questions.error ? (
        <p className="text-sm text-red-600">질문 목록을 불러오지 못했습니다.</p>
      ) : questions.data.items.length === 0 ? (
        <p className="rounded-xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">
          처리할 질문이 없습니다
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-neutral-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">학생</th>
                <th className="px-4 py-2.5 font-medium">분류</th>
                <th className="px-4 py-2.5 font-medium">질문</th>
                <th className="px-4 py-2.5 font-medium">작성일</th>
                <th className="px-4 py-2.5 font-medium">상태</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {questions.data.items.map((question) => {
                const statusStyle = STATUS_LABEL[question.status];
                return (
                  <tr key={question.id} className="border-b border-neutral-100 last:border-0">
                    <td className="px-4 py-3 font-medium">{question.authorName}</td>
                    <td className="px-4 py-3 text-neutral-500">
                      {CATEGORY_LABEL[question.category]}
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-md truncate">
                        {!question.publicVisible ? '🔒 ' : ''}
                        {question.title}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-neutral-500">
                      {new Date(question.createdAt).toLocaleString('ko-KR')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-md px-2 py-1 text-xs ${statusStyle.className}`}>
                        {statusStyle.text}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/questions/${question.id}`}
                        className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
                        답변하기
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
