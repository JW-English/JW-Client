'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

import { homeworkApi, STATUS_LABEL } from '@/lib/homework';

/**
 * 첨삭 화면. P2 의 "제출 → 첨삭" 루프를 닫는 지점이다.
 * 사진을 크게 보면서 코멘트를 쓸 수 있어야 해서 좌우로 나눴다.
 */
export default function SubmissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [body, setBody] = useState('');
  const [requestResubmit, setRequestResubmit] = useState(false);
  const [zoomed, setZoomed] = useState<string | null>(null);

  const { data, isPending, error } = useQuery({
    queryKey: ['submission', id],
    queryFn: () => homeworkApi.submission(id),
  });

  const comment = useMutation({
    mutationFn: () => homeworkApi.comment(id, { body: body.trim(), requestResubmit }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      router.push('/submissions');
    },
  });

  if (isPending) return <p className="text-sm text-neutral-500">불러오는 중…</p>;
  if (error || !data) return <p className="text-sm text-red-600">제출물을 불러오지 못했습니다.</p>;

  const status = STATUS_LABEL[data.status];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/submissions" className="text-sm text-neutral-500 hover:text-neutral-900">
          ← 목록
        </Link>
        <h1 className="text-lg font-semibold">
          {data.studentName} · {data.assignmentTitle}
        </h1>
        <span className={`rounded-md px-2 py-1 text-xs ${status.className}`}>{status.text}</span>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-sm text-neutral-500">
            제출 {new Date(data.submittedAt).toLocaleString('ko-KR')} · {data.images.length}장
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            {data.images.map((image) => (
              // 이미지 URL 은 만료되므로 캐싱하지 않고 그대로 쓴다
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={image.id}
                src={image.url}
                alt="제출한 숙제 사진"
                onClick={() => setZoomed(image.url)}
                className="w-full cursor-zoom-in rounded-lg border border-neutral-200 object-contain"
              />
            ))}
          </div>
        </div>

        <div className="h-fit space-y-3 rounded-xl border border-neutral-200 bg-white p-4">
          <h2 className="text-sm font-semibold">첨삭 코멘트</h2>

          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            placeholder="어디를 어떻게 고치면 좋을지 적어주세요"
            className="w-full resize-none rounded-lg border border-neutral-300 p-3 text-sm outline-none focus:border-blue-500"
          />

          <label className="flex items-center gap-2 text-sm text-neutral-600">
            <input
              type="checkbox"
              checked={requestResubmit}
              onChange={(e) => setRequestResubmit(e.target.checked)}
            />
            다시 제출하도록 요청
          </label>

          {comment.error ? (
            <p className="text-sm text-red-600">코멘트를 저장하지 못했습니다.</p>
          ) : null}

          <button
            onClick={() => comment.mutate()}
            disabled={body.trim().length === 0 || comment.isPending}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            {comment.isPending ? '저장 중…' : requestResubmit ? '재제출 요청하기' : '첨삭 완료'}
          </button>

          <p className="text-xs text-neutral-500">
            저장하면 학생 앱에 바로 표시됩니다.
          </p>
        </div>
      </div>

      {zoomed ? (
        <div
          onClick={() => setZoomed(null)}
          className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-black/80 p-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoomed} alt="확대한 숙제 사진" className="max-h-full max-w-full object-contain" />
        </div>
      ) : null}
    </div>
  );
}
