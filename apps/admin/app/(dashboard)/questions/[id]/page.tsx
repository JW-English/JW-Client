'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';

import {
  CATEGORY_LABEL,
  qnaApi,
  STATUS_LABEL,
  type QuestionAttachment,
  type QuestionReference,
} from '@/lib/qna';

export default function QuestionDetailPage() {
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [body, setBody] = useState('');

  const question = useQuery({
    queryKey: ['qna', 'admin-question', params.id],
    queryFn: () => qnaApi.question(params.id),
  });

  const answer = useMutation({
    mutationFn: () => qnaApi.answer(params.id, body),
    onSuccess: (detail) => {
      queryClient.setQueryData(['qna', 'admin-question', params.id], detail);
      queryClient.invalidateQueries({ queryKey: ['qna', 'admin-questions'] });
      queryClient.invalidateQueries({ queryKey: ['qna', 'summary'] });
      setBody('');
    },
  });

  const visibility = useMutation({
    mutationFn: (publicVisible: boolean) => qnaApi.visibility(params.id, publicVisible),
    onSuccess: (detail) => {
      queryClient.setQueryData(['qna', 'admin-question', params.id], detail);
      queryClient.invalidateQueries({ queryKey: ['qna', 'admin-questions'] });
    },
  });

  if (question.isPending) {
    return <p className="text-sm text-neutral-500">불러오는 중…</p>;
  }

  if (!question.data) {
    return <p className="text-sm text-red-600">질문을 불러오지 못했습니다.</p>;
  }

  const detail = question.data;
  const status = STATUS_LABEL[detail.status];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Link href="/questions" className="text-sm font-medium text-neutral-600 hover:text-neutral-900">
          ← Q&A
        </Link>
        <button
          onClick={() => visibility.mutate(!detail.publicVisible)}
          className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm hover:bg-neutral-50">
          {detail.publicVisible ? '비공개로 전환' : '공개로 전환'}
        </button>
      </div>

      <section className="space-y-4 rounded-xl border border-neutral-200 bg-white p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-blue-100 px-2 py-1 text-xs text-blue-700">
            {CATEGORY_LABEL[detail.category]}
          </span>
          <span className={`rounded-md px-2 py-1 text-xs ${status.className}`}>{status.text}</span>
          {!detail.publicVisible ? (
            <span className="rounded-md bg-neutral-100 px-2 py-1 text-xs text-neutral-600">비공개</span>
          ) : null}
        </div>

        <div>
          <h1 className="text-xl font-semibold">{detail.title}</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {detail.authorName} · {new Date(detail.createdAt).toLocaleString('ko-KR')}
          </p>
        </div>

        <Reference reference={detail.reference} />

        <p className="whitespace-pre-wrap text-sm leading-6 text-neutral-800">{detail.body}</p>
        <AttachmentGrid attachments={detail.attachments} />
      </section>

      {detail.messages.map((message) => (
        <section
          key={message.id}
          className={`space-y-3 rounded-xl border p-5 ${
            message.role === 'TEACHER'
              ? 'border-blue-100 bg-blue-50'
              : 'border-neutral-200 bg-white'
          }`}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">
              {message.role === 'TEACHER' ? '선생님 답변' : '학생 재질문'}
            </h2>
            <span className="text-xs text-neutral-500">
              {new Date(message.createdAt).toLocaleString('ko-KR')}
            </span>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-6 text-neutral-800">{message.body}</p>
          <AttachmentGrid attachments={message.attachments} />
        </section>
      ))}

      <section className="space-y-3 rounded-xl border border-neutral-200 bg-white p-5">
        <h2 className="text-sm font-semibold">답변 작성</h2>
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={8}
          className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
          placeholder="학생에게 보낼 답변을 입력하세요"
        />
        {answer.error ? (
          <p className="text-sm text-red-600">답변을 등록하지 못했습니다.</p>
        ) : null}
        <button
          disabled={body.trim().length < 2 || answer.isPending}
          onClick={() => answer.mutate()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
          {answer.isPending ? '전송 중…' : '답변 등록'}
        </button>
      </section>
    </div>
  );
}

function Reference({ reference }: { reference: QuestionReference }) {
  if (reference.examId && reference.itemNo) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-sm">
        🎧 {reference.examTitle} · {reference.itemNo}번
      </div>
    );
  }
  if (reference.wordDayId) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-sm">
        단어 Day {reference.wordDayNo} {reference.wordDayTitle ? `· ${reference.wordDayTitle}` : ''}
      </div>
    );
  }
  if (reference.assignmentId) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-sm">
        숙제 · {reference.assignmentTitle}
      </div>
    );
  }
  if (reference.textbook) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-sm">
        교재 · {reference.textbook} p.{reference.page}
      </div>
    );
  }
  return null;
}

function AttachmentGrid({ attachments }: { attachments: QuestionAttachment[] }) {
  if (attachments.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-3">
      {attachments.map((attachment) => (
        <AttachmentPreview key={attachment.id} attachment={attachment} />
      ))}
    </div>
  );
}

function AttachmentPreview({ attachment }: { attachment: QuestionAttachment }) {
  const signed = useQuery({
    queryKey: ['qna', 'attachment-url', attachment.id],
    queryFn: () => qnaApi.attachmentUrl(attachment.id),
    staleTime: 45 * 60 * 1000,
  });

  if (attachment.mimeType === 'application/pdf') {
    return signed.data ? (
      <a
        href={signed.data.url}
        target="_blank"
        rel="noreferrer"
        className="rounded-lg border border-neutral-200 px-3 py-2 text-sm text-blue-700">
        PDF 열기
      </a>
    ) : (
      <span className="text-sm text-neutral-500">PDF 불러오는 중…</span>
    );
  }

  return signed.data ? (
    <a href={signed.data.url} target="_blank" rel="noreferrer">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={signed.data.url}
        alt="질문 첨부"
        className="h-32 w-32 rounded-lg border border-neutral-200 object-cover"
      />
    </a>
  ) : (
    <div className="flex h-32 w-32 items-center justify-center rounded-lg border border-neutral-200 text-xs text-neutral-500">
      불러오는 중…
    </div>
  );
}
