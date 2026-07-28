'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useSession } from '@/lib/session';

/** 진입점 — 세션 복구가 끝난 뒤 로그인 여부에 따라 보낸다. */
export default function HomePage() {
  const { restoring, me } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (restoring) return;
    router.replace(me ? '/submissions' : '/login');
  }, [restoring, me, router]);

  return (
    <main className="flex min-h-screen items-center justify-center text-sm text-neutral-500">
      불러오는 중…
    </main>
  );
}
