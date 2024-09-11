import React, { Suspense } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import AuthSessionProvider from './components/spotify/AuthSessionProvider';
import authOptions from './api/auth/[...nextauth]/authOptions';
import SpotifyAuth from './components/SpotifyAuth';
import { Toaster } from '@/components/ui/toaster';
import { cacheLLMResponse, getCachedLLMResponse } from './lib/redis';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Reddit Content Analyzer',
  description: 'Analyze and summarize Reddit posts',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  return (
    <html lang='en'>
      <AuthSessionProvider session={session}>
        <body
          className={`${inter.className} flex min-h-screen flex-col justify-start`}>
          <header className='p-4'>
            <nav className='flex gap-4 w-full max-sm:justify-center justify-end items-center'>
              <SpotifyAuth />
              <Link className='text-xs transition-colors' href='/'>
                Music recommender
              </Link>
              <Link className='text-xs transition-colors' href='/summary'>
                Summarizer
              </Link>
            </nav>
          </header>
          <main className='flex flex-col items-center max-sm:px-4 pb-8'>
            <Suspense>{children}</Suspense>
          </main>
          <Toaster />
        </body>
      </AuthSessionProvider>
    </html>
  );
}
