import type { Metadata } from 'next';
import './globals.css';

import { Providers } from './providers';

export const metadata: Metadata = {
  title: '정운영어 관리자',
  description: '숙제 관리 · 첨삭',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full bg-neutral-50 text-neutral-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
