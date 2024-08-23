import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  RedditComment,
  parseRedditUrl,
  scrapeRedditPost,
} from '../utils/postScraper';
import { readStreamableValue } from 'ai/rsc';

export function useRedditFetcher(initialUrl = '') {
  const [url, setUrl] = useState(initialUrl);
  const [comments, setComments] = useState<RedditComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const searchParams = useSearchParams();

  const fetchComments = useCallback(
    async (submittedUrl?: string) => {
      setLoading(true);
      setError('');
      setComments([]);

      try {
        const urlToFetch = submittedUrl || url;
        const { subreddit, postId } = parseRedditUrl(urlToFetch);

        const post = await fetch(
          `https://www.reddit.com/r/${subreddit}/comments/${postId}.json`
        );

        const postJson = await post.json();

        const { comments } = await scrapeRedditPost(postJson);
        setComments(comments);
        return comments;
      } catch (err: any) {
        setError(err.message || 'An error occurred');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [url]
  );

  useEffect(() => {
    const urlParam = searchParams.get('url');
    if (urlParam) {
      setUrl(urlParam);
      fetchComments(urlParam);
      console.log('URL param found');
    }
  }, [fetchComments, searchParams]);

  return { url, setUrl, comments, loading, error, fetchComments };
}

export function useRedditHandler(
  fetchComments: (url: string) => Promise<RedditComment[]>,
  processResult: (comments: string) => Promise<any>
) {
  const [streaming, setStreaming] = useState(false);
  const [streamed, setStreamed] = useState('');

  const handleSubmit = async (submittedUrl: string) => {
    setStreaming(true);
    setStreamed('');

    try {
      const fetchedComments = await fetchComments(submittedUrl);
      const result = await processResult(
        fetchedComments.map((c: RedditComment) => c.body).join('\n===\n')
      );

      for await (let content of readStreamableValue(result)) {
        setStreamed(content as string);
      }
    } catch (error) {
      console.error('Error processing result:', error);
    } finally {
      setStreaming(false);
    }
  };

  return { handleSubmit, streaming, streamed };
}

export function RedditForm({
  onSubmit,
  loading,
  streaming,
  url,
  setUrl,
}: {
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  streaming: boolean;
  url: string;
  setUrl: (url: string) => void;
}) {
  return (
    <form onSubmit={onSubmit} className='w-full max-w-md mb-8'>
      <input
        type='text'
        name='url'
        placeholder='Enter Reddit post URL'
        className='w-full px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 text-black'
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <button
        type='submit'
        disabled={loading || streaming}
        className='mt-4 w-full border border-gray-100 text-white py-2 rounded hover:border-gray-400 transition-colors'>
        {loading || streaming ? 'Generating...' : 'Go!'}
      </button>
    </form>
  );
}
