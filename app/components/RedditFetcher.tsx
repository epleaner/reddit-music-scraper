import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  RedditComment,
  parseRedditUrl,
  scrapeRedditPost,
} from '../utils/postScraper';
import { readStreamableValue } from 'ai/rsc';

export function useRedditFetcher(
  processResult: (comments: string) => Promise<any>,
  initialUrl = ''
) {
  const [url, setUrl] = useState(initialUrl);
  const [comments, setComments] = useState<RedditComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamed, setStreamed] = useState('');
  const [history, setHistory] = useState<string[]>([]);

  const searchParams = useSearchParams();

  useEffect(() => {
    const storedHistory = localStorage.getItem('searchHistory');
    if (storedHistory) {
      setHistory(JSON.parse(storedHistory));
    }
  }, []);

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

  const updateHistory = useCallback(
    (newUrl: string) => {
      const updatedHistory = Array.from(new Set([newUrl, ...history]));
      setHistory(updatedHistory);
      localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
    },
    [history]
  );

  const handleSubmit = useCallback(
    async (submittedUrl: string) => {
      setStreaming(true);
      setStreamed('');
      setUrl(submittedUrl);
      updateHistory(submittedUrl);

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
    },
    [fetchComments, processResult, updateHistory]
  );

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('searchHistory');
  };

  useEffect(() => {
    const urlParam = searchParams.get('url');
    if (urlParam) {
      setUrl(urlParam);
      handleSubmit(urlParam);
    }
  }, [handleSubmit, searchParams]);

  return {
    url,
    setUrl,
    comments,
    loading,
    error,
    streaming,
    streamed,
    history,
    handleSubmit,
    clearHistory,
  };
}

export function RedditForm({
  handleSubmit,
  loading,
  streaming,
  url,
  setUrl,
}: {
  handleSubmit: (submittedUrl: string) => Promise<void>;
  loading: boolean;
  streaming: boolean;
  url: string;
  setUrl: (url: string) => void;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const submittedUrl = formData.get('url') as string;
        handleSubmit(submittedUrl);
      }}
      className='w-full max-w-md mb-8'>
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
