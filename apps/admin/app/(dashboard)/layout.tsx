'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useSession } from '@/lib/session';

const NAV = [
  { href: '/submissions', label: '제출 현황' },
  { href: '/assignments', label: '숙제 관리' },
  { href: '/questions', label: 'Q&A' },
];

/** 로그인한 선생님만 들어올 수 있는 영역. 서버도 /api/admin/** 를 막지만 화면도 막는다. */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { restoring, me, signOut } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!restoring && !me) {
      router.replace('/login');
    }
  }, [restoring, me, router]);

  if (restoring || !me) {
    return (
      <main className="flex min-h-screen items-center justify-center text-sm text-neutral-500">
        불러오는 중…
      </main>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-6 px-6 py-3">
          <span className="font-semibold">정운영어 관리자</span>

          <nav className="flex gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-1.5 text-sm transition ${
                  pathname.startsWith(item.href)
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3 text-sm text-neutral-500">
            <span>{me.name} 선생님</span>
            <button
              onClick={() => signOut().then(() => router.replace('/login'))}
              className="rounded-lg px-2 py-1 hover:bg-neutral-100">
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
