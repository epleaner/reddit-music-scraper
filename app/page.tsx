'use client';

import { extractMusic } from './actions/music';
import { readStreamableValue } from 'ai/rsc';
import { useState } from 'react';
import { RedditComment } from './utils/postScraper';
import { jsonrepair } from 'jsonrepair';
import { useRedditFetcher, RedditForm } from './components/RedditFetcher';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export default function Home() {
  const { setUrl, loading, error, fetchComments } = useRedditFetcher();
  const [streamed, setStreamed] = useState('');
  const [streamedJson, setStreamedJson] = useState([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const submittedUrl = formData.get('url') as string;
    setUrl(submittedUrl);

    const fetchedComments = await fetchComments(submittedUrl);
    const result = await extractMusic(
      fetchedComments.map((c: RedditComment) => c.body).join('\n===\n')
    );

    const jsonRegex = /```json([\s\S]*?)/;

    for await (const content of readStreamableValue(result)) {
      setStreamed(content as string);

      const match = content?.match(jsonRegex);
      console.log('Content:', content, match);
      if (match && match[1])
        setStreamedJson(JSON.parse(jsonrepair(match[1] as string)));
    }
  };

  return (
    <>
      <h1 className='text-4xl font-bold mb-4 text-center'>
        Reddit music scraper
      </h1>
      <RedditForm onSubmit={handleSubmit} loading={loading} />

      {error && <p className='text-red-500 mb-4'>{error}</p>}

      {streamedJson && (
        <p className='text-green-500 mb-4'>{streamedJson.toString()}</p>
      )}
    </>
  );
}
