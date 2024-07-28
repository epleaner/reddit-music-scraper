import React, { Suspense } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Reddit Content Analyzer',
  description: 'Analyze and summarize Reddit posts',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <body
        className={`${inter.className} flex min-h-screen flex-col justify-start`}>
        <header className='p-4'>
          <nav className='flex gap-4 w-full max-sm:justify-center justify-end'>
            <Link
              className='border-b border-transparent hover:border-gray-100/40 pb-1 transition-colors'
              href='/'>
              Music scraper
            </Link>
            <Link
              className='border-b border-transparent hover:border-gray-100/40 pb-1 transition-colors'
              href='/summary'>
              Summarizer
            </Link>
          </nav>
        </header>
        <main className='flex flex-col items-center max-sm:px-4 pb-8'>
          <Suspense>{children}</Suspense>
        </main>
      </body>
    </html>
  );
}
