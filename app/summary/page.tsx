'use client';

import { readStreamableValue } from 'ai/rsc';
import { useState } from 'react';
import { summarize } from '../actions/summary';
import { RedditComment } from '../utils/postScraper';
import Markdown from 'react-markdown';
import { useRedditFetcher, RedditForm } from '../components/RedditFetcher';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export default function Summary() {
  const { setUrl, loading, error, fetchComments } = useRedditFetcher();
  const [streamed, setStreamed] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const submittedUrl = formData.get('url') as string;
    setUrl(submittedUrl);

    const fetchedComments = await fetchComments(submittedUrl);
    const result = await summarize(
      fetchedComments.map((c: RedditComment) => c.body).join('\n===\n')
    );

    for await (const content of readStreamableValue(result)) {
      setStreamed(content as string);
    }
  };

  return (
    <>
      <h1 className='text-4xl font-bold mb-4 text-center'>
        Reddit post summarizer
      </h1>
      <RedditForm onSubmit={handleSubmit} loading={loading} />

      {error && <p className='text-red-500 mb-4'>{error}</p>}

      <div className='w-full max-w-2xl'>
        {streamed && <Markdown>{streamed}</Markdown>}
      </div>
    </>
  );
}
