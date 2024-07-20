'use client';

import { type CoreMessage } from 'ai';
import { continueConversation } from './actions';
import { readStreamableValue } from 'ai/rsc';
import { useState } from 'react';
import {
  RedditComment,
  parseRedditUrl,
  scrapeRedditPost,
} from './utils/postScraper';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export default function Home() {
  const [url, setUrl] = useState('');
  const [comments, setComments] = useState<RedditComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [streamed, setStreamed] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setComments([]);

    try {
      const { subreddit, postId } = parseRedditUrl(url);
      const postJson = await fetch(
        `https://www.reddit.com/r/${subreddit}/comments/${postId}.json`
      ).then((res) => res.json());

      console.log(postJson);
      const { comments } = await scrapeRedditPost(postJson);

      setComments(comments);

      const result = await continueConversation(
        comments.map((c: RedditComment) => c.body).join('\n===\n')
      );

      for await (const content of readStreamableValue(result)) {
        setStreamed(content as string);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className='flex min-h-screen flex-col items-center justify-start p-2 md:p-24'>
      <h1 className='text-4xl font-bold mb-8'>Reddit music scraper</h1>
      <form onSubmit={handleSubmit} className='w-full max-w-md mb-8'>
        <input
          type='text'
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder='Enter Reddit post URL'
          className='w-full px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black'
        />
        <button
          type='submit'
          disabled={loading}
          className='mt-4 w-full border border-gray-100 text-white py-2 rounded hover:border-blue-600 transition-colors'>
          {loading ? 'Loading...' : 'Fetch Comments'}
        </button>
      </form>

      {error && <p className='text-red-500 mb-4'>{error}</p>}

      {streamed && <p className='text-green-500 mb-4'>{streamed}</p>}
      <div className='w-full max-w-2xl'>
        {comments.map((comment) => (
          <div
            key={comment.id}
            className='mb-4 p-4 border border-gray-100 rounded'>
            <p className='font-bold'>{comment.author}</p>
            <p className='mt-2 text-wrap truncate'>{comment.body}</p>
            <p className='mt-2 text-sm text-gray-500'>Score: {comment.score}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
